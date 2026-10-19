"""Convert Roblox Studio material and sky textures (.dds/.tex) into PNGs for the renderer.

Usage: python3 -I tools/rbx_textures.py <roblox content-textures3 dir> <out dir>

Roblox material diffuse maps are greyscale detail textures that get tinted by the part's
Color. We normalise each one so its average brightness is DETAIL_MEAN, so multiplying it
with a part colour keeps that colour recognisable (the same BrickColor reads the same).
Normal maps are stored DXT5nm-style (X in alpha, Y in green); we rebuild a regular RGB
normal map from them.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

MATERIALS = ["grass", "concrete", "wood", "woodplanks", "brick", "slate", "cobblestone", "sand", "metal", "fabric"]
SIZE = 512
DETAIL_MEAN = 0.86  # average brightness of a normalised diffuse (1.0 = no darkening)
SKY_FACES = ["bk", "dn", "ft", "lf", "rt", "up"]


def diffuse(path: Path) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float32) / 255
    lum = rgb.mean(axis=-1, keepdims=True)
    detail = lum / lum.mean() * DETAIL_MEAN  # keep only the brightness pattern
    # Some materials carry a bit of colour (cobblestone); keep a trace of it.
    tint = rgb / np.maximum(lum, 1e-3)
    out = detail * (0.75 + 0.25 * tint)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


def normal(path: Path) -> Image.Image:
    rgba = np.asarray(Image.open(path).convert("RGBA").resize((SIZE, SIZE), Image.LANCZOS)).astype(np.float32) / 255
    x = rgba[..., 3] * 2 - 1
    y = rgba[..., 1] * 2 - 1
    z = np.sqrt(np.clip(1 - x * x - y * y, 0, 1))
    n = np.stack([x, y, z], axis=-1) * 0.5 + 0.5
    return Image.fromarray((n * 255).astype(np.uint8))


def main() -> None:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for mat in MATERIALS:
        diffuse(src / mat / "diffuse.dds").save(out / f"{mat}.png")
        normal(src / mat / "normal.dds").save(out / f"{mat}_n.png")
        print("wrote", mat)
    # Smooth plastic still has a faint surface grain in Roblox.
    normal(src / "plastic" / "normaldetail.dds").save(out / "plastic_n.png")
    sky = out / "sky"
    sky.mkdir(exist_ok=True)
    for face in SKY_FACES:
        Image.open(src / "sky" / f"sky512_{face}.tex").convert("RGB").resize((SIZE, SIZE), Image.LANCZOS).save(sky / f"{face}.png")
    print("wrote sky")


if __name__ == "__main__":
    main()
