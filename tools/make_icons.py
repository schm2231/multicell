"""Generate the extension icons: a 3x3 grid with the middle row and column highlighted."""
from PIL import Image, ImageDraw
import sys, os

out = sys.argv[1] if len(sys.argv) > 1 else "icons"
for size in (16, 32, 48, 128):
    S = 8  # supersample
    n = size * S
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = n * 0.06
    r = n * 0.18
    d.rounded_rectangle([pad, pad, n - pad, n - pad], radius=r, fill=(24, 128, 56, 255))
    inner = n * 0.2
    cell = (n - 2 * inner) / 3
    band = (255, 213, 79, 255)
    # middle row and column
    d.rectangle([inner, inner + cell, n - inner, inner + 2 * cell], fill=band)
    d.rectangle([inner + cell, inner, inner + 2 * cell, n - inner], fill=band)
    # grid lines (skip on tiny icon)
    if size >= 32:
        w = max(1, int(n * 0.02))
        for i in range(4):
            p = inner + i * cell
            d.line([inner, p, n - inner, p], fill=(255, 255, 255, 230), width=w)
            d.line([p, inner, p, n - inner], fill=(255, 255, 255, 230), width=w)
    # active cell outline
    w = max(S, int(n * 0.045))
    d.rectangle([inner + cell, inner + cell, inner + 2 * cell, inner + 2 * cell], outline=(26, 115, 232, 255), width=w)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(out, f"icon{size}.png"))
