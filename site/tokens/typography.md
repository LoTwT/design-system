# Typography

Typography tokens come from `packages/theme/src/foundation/typography.css`.

## Font Families

| Token | Use |
| --- | --- |
| `--font-display` | Page titles, nav, hero text, chips, compact UI labels |
| `--font-sans` | Body copy and regular UI text |
| `--font-mono` | Code, dates, metadata, technical labels |
| `--font-reading` | Long-form reading body and headings |

With `@ayingott/theme/fonts.css`, all four roles use original LXGW WenKai for Chinese glyphs. Latin text retains Bricolage Grotesque, system UI, Space Mono, and Literata respectively. Without the opt-in import, the font stacks use available local/system fallbacks.

WenKai ships real `400` (Regular) and `500` (Medium) faces. Use `font-medium` for slightly heavier Chinese text; the theme's `600` / `700` tokens do not add real WenKai weights. See [Fonts](/fonts) for a weight comparison and loading details.

## Reading Leading

| Token | Value | Use |
| --- | --- | --- |
| `--leading-reading` | `1.7` | Long-form paragraph rhythm |

## Type Scale

<TypeScale />
