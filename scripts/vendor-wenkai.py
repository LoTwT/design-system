# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools[woff]==4.60.1", "brotli==1.1.0"]
# ///
"""Rebuild the pinned, full-coverage WenKai webfonts: uv run scripts/vendor-wenkai.py."""

import hashlib
from pathlib import Path
from tempfile import NamedTemporaryFile, TemporaryDirectory
from urllib.request import Request, urlopen

from fontTools.ttLib import TTFont, woff2


VERSION = "v1.522"
FONTS = (
    ("Regular", 400, "39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009"),
    ("Medium", 500, "d4bdeb38a39151d74d084cba5090f8cb7d20bf83eedb78c35939ae70b9f4e3f6"),
)
DESTINATION = Path(__file__).resolve().parents[1] / "packages/theme/src/fonts"


def verify_conversion(source_path: Path, webfont_path: Path, weight: int) -> None:
    with TTFont(source_path) as source, TTFont(webfont_path) as webfont:
        assert source["OS/2"].usWeightClass == webfont["OS/2"].usWeightClass == weight
        assert "fvar" not in source and "fvar" not in webfont
        assert source.getGlyphOrder() == webfont.getGlyphOrder()
        assert source.getBestCmap() == webfont.getBestCmap()
        assert source["name"].compile(source) == webfont["name"].compile(webfont)
        assert source["hmtx"].metrics == webfont["hmtx"].metrics
        for character in "霞鹜文楷中文简体繁體閱讀龘":
            assert ord(character) in webfont.getBestCmap(), character


def replace_font(destination: Path, data: bytes) -> None:
    """Keep the previous asset intact until a complete replacement is ready."""
    mode = destination.stat().st_mode & 0o777 if destination.exists() else 0o644
    temporary_path = None
    try:
        with NamedTemporaryFile(mode="wb", prefix=f".{destination.name}.", suffix=".tmp",
                                dir=destination.parent, delete=False) as temporary:
            temporary_path = Path(temporary.name)
            temporary.write(data)
        temporary_path.chmod(mode)
        temporary_path.replace(destination)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def main() -> None:
    with TemporaryDirectory(prefix="ayingott-wenkai-") as temporary:
        staged = []
        for style, weight, expected_hash in FONTS:
            filename = f"LXGWWenKai-{style}.ttf"
            url = f"https://github.com/lxgw/LxgwWenKai/releases/download/{VERSION}/{filename}"
            request = Request(url, headers={"User-Agent": "ayingott-font-vendor"})
            with urlopen(request, timeout=120) as response:
                data = response.read()
            actual_hash = hashlib.sha256(data).hexdigest()
            if actual_hash != expected_hash:
                raise ValueError(f"Upstream checksum mismatch for {filename}: {actual_hash}")
            source = Path(temporary) / filename
            source.write_bytes(data)
            output = Path(temporary) / f"lxgw-wenkai-{weight}-normal.woff2"
            # WOFF2 compression only: preserve every glyph, name, and original weight.
            woff2.compress(source, output)
            verify_conversion(source, output, weight)
            staged.append(output)
        for output in staged:
            data = output.read_bytes()
            replace_font(DESTINATION / output.name, data)
            print(f"{output.name}: {len(data):,} bytes; SHA-256 {hashlib.sha256(data).hexdigest()}")


if __name__ == "__main__":
    main()
