from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'

DARK = '#182026'
LIGHT = '#FAFAF7'


def scale(value: int, size: int) -> int:
    return round(value * size / 512)


def rounded_rect(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], radius: int, fill: str) -> None:
    draw.rounded_rectangle(bounds, radius=radius, fill=fill)


def render_icon(size: int, maskable: bool = False) -> Image.Image:
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # The desktop-facing icon sits inside a generous transparent inset. This gives Windows
    # a true rounded app silhouette rather than the previous full-bleed black sticker.
    inset = 16 if maskable else 28
    corner_radius = 112 if maskable else 104
    rounded_rect(
        draw,
        (scale(inset, size), scale(inset, size), scale(512 - inset, size), scale(512 - inset, size)),
        scale(corner_radius, size),
        DARK,
    )

    # Canonical Margin two-bar mark. Capsules retain recognition but soften the hard corners
    # that were visually aggressive at the Windows taskbar's small raster size.
    bar_height = 72
    bar_radius = 36
    rounded_rect(draw, (scale(100, size), scale(174, size), scale(334, size), scale(174 + bar_height, size)), scale(bar_radius, size), LIGHT)
    rounded_rect(draw, (scale(178, size), scale(266, size), scale(412, size), scale(266 + bar_height, size)), scale(bar_radius, size), LIGHT)

    return image


for output_size in (144, 192, 512):
    render_icon(output_size).save(PUBLIC / f'margin-pwa-{output_size}-v4.png', optimize=True)

render_icon(512, maskable=True).save(PUBLIC / 'margin-pwa-maskable-512-v4.png', optimize=True)

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect x="28" y="28" width="456" height="456" rx="104" fill="#182026"/>
  <rect x="100" y="174" width="234" height="72" rx="36" fill="#FAFAF7"/>
  <rect x="178" y="266" width="234" height="72" rx="36" fill="#FAFAF7"/>
</svg>
'''
(PUBLIC / 'favicon-margin.svg').write_text(svg, encoding='utf-8')
