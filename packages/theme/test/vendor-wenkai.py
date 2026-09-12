"""Test the real vendoring entrypoint with offline download/compression doubles."""

from contextlib import redirect_stdout
import errno
import hashlib
import importlib.util
import io
from pathlib import Path
import signal
from tempfile import TemporaryDirectory
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

try:
    import resource
except ImportError:
    resource = None


SCRIPT = Path(__file__).resolve().parents[3] / "scripts/vendor-wenkai.py"
spec = importlib.util.spec_from_file_location("vendor_wenkai", SCRIPT)
vendor = importlib.util.module_from_spec(spec)
# Font encoding is unchanged and covered by the real font/browser checks.
# These stdlib-only tests isolate destination integrity from network/codec work.
with patch.dict("sys.modules", {
    "fontTools": ModuleType("fontTools"),
    "fontTools.ttLib": SimpleNamespace(TTFont=None, woff2=None),
}):
    spec.loader.exec_module(vendor)


class VendorWriteTests(unittest.TestCase):
    def setUp(self):
        self.temporary = TemporaryDirectory(prefix="wenkai-write-test-")
        self.addCleanup(self.temporary.cleanup)
        self.destination = Path(self.temporary.name)
        self.old = b"existing good font" * 1024
        self.downloads = {"Regular": b"regular source", "Medium": b"medium source"}
        self.outputs = {400: b"regular replacement" * 1024, 500: b"medium replacement" * 1024}
        self.fonts = [
            (style, weight, hashlib.sha256(self.downloads[style]).hexdigest())
            for style, weight in [("Regular", 400), ("Medium", 500)]
        ]
        for weight in self.outputs:
            self.asset(weight).write_bytes(self.old)
            self.asset(weight).chmod(0o644)

    def asset(self, weight):
        return self.destination / f"lxgw-wenkai-{weight}-normal.woff2"

    def download(self, request, timeout):
        return io.BytesIO(self.downloads["Regular" if "Regular.ttf" in request.full_url else "Medium"])

    def compress(self, source, output):
        output.write_bytes(self.outputs[400 if "Regular" in source.name else 500])

    def run_vendor(self, verify=lambda *_: None, download=None):
        with patch.multiple(vendor, DESTINATION=self.destination, FONTS=self.fonts,
                            urlopen=download or self.download,
                            woff2=SimpleNamespace(compress=self.compress),
                            verify_conversion=verify):
            with redirect_stdout(io.StringIO()):
                vendor.main()

    def assert_originals(self):
        for weight in self.outputs:
            self.assertEqual(self.asset(weight).read_bytes(), self.old)
        self.assertEqual(sorted(path.name for path in self.destination.iterdir()),
                         sorted(self.asset(weight).name for weight in self.outputs))

    def test_success_replaces_both_files_and_preserves_modes(self):
        self.run_vendor()
        for weight, data in self.outputs.items():
            self.assertEqual(self.asset(weight).read_bytes(), data)
            self.assertEqual(self.asset(weight).stat().st_mode & 0o777, 0o644)
        self.assertEqual(len(list(self.destination.iterdir())), 2)

    def test_first_generation_creates_readable_files(self):
        for weight in self.outputs:
            self.asset(weight).unlink()
        self.run_vendor()
        for weight, data in self.outputs.items():
            self.assertEqual(self.asset(weight).read_bytes(), data)
            self.assertEqual(self.asset(weight).stat().st_mode & 0o777, 0o644)

    def test_second_download_failure_preserves_existing_files(self):
        def failing_download(request, timeout):
            if "Medium.ttf" in request.full_url:
                raise TimeoutError("download interrupted")
            return self.download(request, timeout)
        with self.assertRaises(TimeoutError):
            self.run_vendor(download=failing_download)
        self.assert_originals()

    def test_failed_rename_preserves_existing_files_and_cleans_staging(self):
        with patch("os.replace", side_effect=PermissionError("rename denied")):
            with self.assertRaises(PermissionError):
                self.run_vendor()
        self.assert_originals()

    @unittest.skipUnless(resource is not None, "OS file-size fault injection requires POSIX")
    def test_partial_write_preserves_existing_files_and_cleans_staging(self):
        limits = resource.getrlimit(resource.RLIMIT_FSIZE)
        previous_handler = signal.signal(signal.SIGXFSZ, signal.SIG_IGN)
        verified = []
        def after_verification(source, output, weight):
            self.assertEqual(output.read_bytes(), self.outputs[weight])
            verified.append(weight)
            if weight == 500:
                resource.setrlimit(resource.RLIMIT_FSIZE, (4096, limits[1]))
        try:
            with self.assertRaises(OSError) as failure:
                self.run_vendor(verify=after_verification)
        finally:
            resource.setrlimit(resource.RLIMIT_FSIZE, limits)
            signal.signal(signal.SIGXFSZ, previous_handler)
        self.assertEqual(verified, [400, 500])
        self.assertEqual(failure.exception.errno, errno.EFBIG)
        self.assert_originals()


if __name__ == "__main__":
    unittest.main()
