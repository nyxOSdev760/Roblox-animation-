"""Turn the face JPGs in assets/faces into transparent, square PNG face decals.

Usage: python3 tools/make_face_pngs.py
Writes assets/faces/png/<name>.png (512x512, transparent background).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

FACES = Path(__file__).resolve().parent.parent / "assets" / "faces"
OUT = FACES / "png"
SIZE = 512          # output decal size in px
FILL = 0.78         # how much of the decal width/height the face features may take
UPSCALE = 4         # work at a higher resolution so edges come out smooth
NOISE_FLOOR = 0.07  # JPEG noise in the background below this opacity is dropped
OPACITY_BOOST = 2.2 # makes solid colours (pink blush, tongue) fully opaque
EDGE_TRIM = 4       # source px at the image edges that are always background (scan borders)
GAP_CLOSE = 1       # source px; gaps in outlines smaller than this don't leak into teeth/eyes
MIN_ENCLOSED = 2    # source px; enclosed white pockets thinner than this are JPEG specks, not teeth


def outside_mask(ink: np.ndarray, gap: int) -> np.ndarray:
    """Background reachable from the image border without crossing an outline.

    White areas enclosed by outlines (teeth, eye whites) are not reachable, so they stay opaque.
    """
    size = gap * 2 + 1
    walls = Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(size))
    walls = walls.point(lambda v: 0 if v else 128)
    padded = Image.new("L", (walls.width + 2, walls.height + 2), 128)
    padded.paste(walls, (1, 1))
    ImageDraw.floodfill(padded, (0, 0), 255)
    reached = padded.crop((1, 1, walls.width + 1, walls.height + 1)).point(lambda v: 255 if v == 255 else 0)
    # Grow back by the amount the outlines were thickened, without crossing real ink.
    reached = reached.filter(ImageFilter.MaxFilter(size))
    return (np.asarray(reached) > 0) & ~ink


def drop_specks(mask: np.ndarray, width: int) -> np.ndarray:
    """Remove parts of the mask thinner than `width`, keeping the full shape of the rest."""
    img = Image.fromarray((mask * 255).astype(np.uint8))
    core = img.filter(ImageFilter.MinFilter(width | 1))
    regrown = core.filter(ImageFilter.MaxFilter((width | 1) + 4))
    return (np.asarray(regrown) > 0) & mask


def remove_background(rgb: np.ndarray) -> np.ndarray:
    """Colour-to-alpha against the background colour, sampled from the corners."""
    corners = np.concatenate([rgb[:8, :8], rgb[:8, -8:], rgb[-8:, :8], rgb[-8:, -8:]]).reshape(-1, 3)
    bg = np.median(corners, axis=0)
    t = EDGE_TRIM * UPSCALE
    rgb = rgb.copy()
    rgb[:t], rgb[-t:], rgb[:, :t], rgb[:, -t:] = bg, bg, bg, bg

    # Minimum alpha needed to explain each pixel as some colour over the background.
    diff = rgb - bg
    # The background is near-white, so anything lighter than it is just JPEG noise.
    diff = np.where(bg > 220, np.minimum(diff, 0), diff)
    lim = np.where(diff > 0, 255.0 - bg, bg)
    alpha = np.max(np.abs(diff) / np.maximum(lim, 1), axis=-1)

    alpha = np.clip((alpha - NOISE_FLOOR) / (1 - NOISE_FLOOR), 0, 1)
    alpha = np.clip(alpha * OPACITY_BOOST, 0, 1)

    enclosed = ~outside_mask(alpha > 0.5, GAP_CLOSE * UPSCALE) & (alpha <= 0.5)
    enclosed = drop_specks(enclosed, MIN_ENCLOSED * UPSCALE)
    alpha = np.where(enclosed, 1.0, alpha)

    # Un-mix the background out of semi-transparent edge pixels.
    safe = np.maximum(alpha, 1e-3)[..., None]
    color = np.clip(bg + diff / safe, 0, 255)
    return np.dstack([color, alpha * 255]).astype(np.uint8)


def to_square_decal(rgba: Image.Image) -> Image.Image:
    alpha = rgba.getchannel("A").point(lambda a: 255 if a > 20 else 0)
    box = alpha.getbbox()
    face = rgba.crop(box)
    scale = SIZE * FILL / max(face.size)
    face = face.resize((round(face.width * scale), round(face.height * scale)), Image.LANCZOS)
    decal = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    decal.alpha_composite(face, ((SIZE - face.width) // 2, (SIZE - face.height) // 2))
    return decal


def trim_dark_bars(im: Image.Image) -> Image.Image:
    """Cut off black letterbox/pillarbox bars around a light face image."""
    grey = np.asarray(im.convert("L")).astype(float)
    cols = np.flatnonzero(grey.mean(axis=0) > 60)
    rows = np.flatnonzero(grey.mean(axis=1) > 60)
    # Step in a few px past the bar edge so no dark seam is left.
    pad = 3
    return im.crop((cols[0] + pad, rows[0] + pad, cols[-1] - pad + 1, rows[-1] - pad + 1))


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for src in sorted(FACES.glob("*.jpg")):
        im = trim_dark_bars(Image.open(src).convert("RGB"))
        im = im.resize((im.width * UPSCALE, im.height * UPSCALE), Image.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(UPSCALE * 0.35))  # smooth out JPEG blocks
        rgba = remove_background(np.asarray(im).astype(float))
        decal = to_square_decal(Image.fromarray(rgba, "RGBA"))
        decal.save(OUT / f"{src.stem}.png")
        print("wrote", OUT / f"{src.stem}.png")


if __name__ == "__main__":
    main()
