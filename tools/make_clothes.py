"""Draw classic Roblox clothing templates (585x559 Shirt / Pants) for roles the catalog
doesn't cover: suit, lunch lady, mail carrier, doctor, graduation gown, wedding dress,
TV crew. Output: animation/assets/rbx/clothing/<slug>.png

Usage: python3 -I tools/make_clothes.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parent.parent / "animation" / "assets" / "rbx" / "clothing"
W, H = 585, 559
FONT = Path(__file__).resolve().parent.parent / "animation" / "assets" / "fonts" / "FredokaOne-Regular.ttf"

# Template regions (x, y, w, h).
T = {"up": (231, 8, 128, 64), "front": (231, 74, 128, 128), "right": (165, 74, 64, 128),
     "left": (361, 74, 64, 128), "back": (427, 74, 128, 128), "down": (231, 204, 128, 64)}
RIGHT = {"left": (19, 355, 64, 128), "back": (85, 355, 64, 128), "right": (151, 355, 64, 128),
         "front": (217, 355, 64, 128), "up": (217, 289, 64, 64), "down": (217, 485, 64, 64)}
LEFT = {"front": (308, 355, 64, 128), "left": (374, 355, 64, 128), "back": (440, 355, 64, 128),
        "right": (506, 355, 64, 128), "up": (308, 289, 64, 64), "down": (308, 485, 64, 64)}
LIMBS = (RIGHT, LEFT)
SIDES = ("front", "back", "left", "right")


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def box(d, r, color, top=0.0, bottom=1.0):
    """Fill a fraction (top..bottom, 0 = top edge) of a region."""
    x, y, w, h = r
    d.rectangle((x, y + round(h * top), x + w - 1, y + round(h * bottom) - 1), fill=color)


def fabric(img, strength=10, seed=1):
    """Subtle cloth noise and a soft top-to-bottom shade, like classic clothes have."""
    a = np.asarray(img).astype(np.int16)
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, strength, a.shape[:2])
    noise = np.asarray(Image.fromarray(np.clip(noise + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.int16) - 128
    shade = np.linspace(8, -10, a.shape[0])[:, None]
    for c in range(3):
        a[..., c] = np.where(a[..., 3] > 0, np.clip(a[..., c] + noise + shade, 0, 255), a[..., c])
    return Image.fromarray(a.astype(np.uint8))


def font(size):
    return ImageFont.truetype(str(FONT), size)


def new():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def long_sleeves(d, color, cuff=None, hand=0.14):
    """Sleeves down to the wrist; the bottom `hand` of each arm stays skin."""
    for limb in LIMBS:
        box(d, limb["up"], color)
        for s in SIDES:
            box(d, limb[s], color, 0, 1 - hand)
            if cuff:
                box(d, limb[s], cuff, 1 - hand - 0.07, 1 - hand)


def short_sleeves(d, color, trim=None, length=0.38):
    for limb in LIMBS:
        box(d, limb["up"], color)
        for s in SIDES:
            box(d, limb[s], color, 0, length)
            if trim:
                box(d, limb[s], trim, length - 0.05, length)


def torso(d, color):
    for k in T:
        box(d, T[k], color)


def trousers(d, color, shoe, length=1.0, sock=None):
    """Pants: torso band (belt area) + legs; shoes at the bottom of each leg."""
    for k in ("front", "back", "left", "right"):
        box(d, T[k], color, 0.78, 1)
    box(d, T["down"], color)
    for limb in LIMBS:
        box(d, limb["up"], color)
        for s in SIDES:
            box(d, limb[s], color, 0, length)
            if sock and length < 0.85:
                box(d, limb[s], sock, length, 0.86)
            box(d, limb[s], shoe, 0.86, 1)
        box(d, limb["down"], shoe)


def belt(d, color, buckle):
    for k in ("front", "back", "left", "right"):
        box(d, T[k], color, 0.78, 0.86)
    x, y, w, h = T["front"]
    d.rectangle((x + w // 2 - 8, y + round(h * 0.77), x + w // 2 + 8, y + round(h * 0.87)), fill=buckle)


# ---- outfits ------------------------------------------------------------------------------

def suit(jacket="#1b1d22", shirt="#f2f3f3", tie="#c4281c", lapel="#2a2d35"):
    img, d = new()
    torso(d, rgb(jacket))
    x, y, w, h = T["front"]
    cx = x + w // 2
    # White shirt V and tie.
    d.polygon([(cx - 26, y), (cx + 26, y), (cx, y + 70)], fill=rgb(shirt))
    d.polygon([(cx - 7, y + 2), (cx + 7, y + 2), (cx + 4, y + 12), (cx - 4, y + 12)], fill=rgb(tie))
    d.polygon([(cx - 5, y + 12), (cx + 5, y + 12), (cx + 9, y + 58), (cx, y + 68), (cx - 9, y + 58)], fill=rgb(tie))
    # Lapels and buttons.
    d.polygon([(cx - 26, y), (cx - 40, y), (cx - 4, y + 78), (cx, y + 70)], fill=rgb(lapel))
    d.polygon([(cx + 26, y), (cx + 40, y), (cx + 4, y + 78), (cx, y + 70)], fill=rgb(lapel))
    for by in (84, 102):
        d.ellipse((cx - 4, y + by - 4, cx + 4, y + by + 4), fill=rgb("#55585f"))
    d.line([(cx, y + 70), (cx, y + h)], fill=rgb("#101114"), width=2)
    # Pocket square and pockets.
    d.rectangle((x + w - 34, y + 30, x + w - 16, y + 36), fill=rgb(shirt))
    d.rectangle((x + 10, y + 100, x + 40, y + 104), fill=rgb("#101114"))
    d.rectangle((x + w - 40, y + 100, x + w - 10, y + 104), fill=rgb("#101114"))
    bx, by, bw, bh = T["back"]
    d.line([(bx + bw // 2, by), (bx + bw // 2, by + bh)], fill=rgb("#101114"), width=2)
    long_sleeves(d, rgb(jacket), cuff=rgb(shirt))
    return fabric(img, 6)


def suit_pants(color="#1b1d22", shoe="#0c0c0e"):
    img, d = new()
    trousers(d, rgb(color), rgb(shoe))
    belt(d, rgb("#0c0c0e"), rgb("#c9b26b"))
    for limb in LIMBS:  # crease
        x, y, w, h = limb["front"]
        d.line([(x + w // 2, y), (x + w // 2, y + round(h * 0.86))], fill=rgb("#2c2f36"), width=2)
    return fabric(img, 5)


def lunch_lady():
    img, d = new()
    torso(d, rgb("#f4a7b9"))
    short_sleeves(d, rgb("#f4a7b9"), trim=rgb("#e88aa2"))
    x, y, w, h = T["front"]
    # Apron bib with straps and a pocket, ties round the sides and back.
    d.rectangle((x + 22, y + 18, x + w - 22, y + h), fill=rgb("#fbfbfb"))
    d.rectangle((x + 30, y, x + 38, y + 18), fill=rgb("#fbfbfb"))
    d.rectangle((x + w - 38, y, x + w - 30, y + 18), fill=rgb("#fbfbfb"))
    d.rectangle((x + 36, y + 76, x + w - 36, y + 108), outline=rgb("#d9d9d9"), width=3)
    for k in ("left", "right", "back"):
        box(d, T[k], rgb("#fbfbfb"), 0.62, 0.68)
    # Name tag.
    d.rounded_rectangle((x + 74, y + 26, x + 102, y + 40), 3, fill=rgb("#ffd84d"))
    d.text((x + 77, y + 26), "HI!", font=font(11), fill=rgb("#333333"))
    return fabric(img, 7)


def lunch_lady_pants():
    img, d = new()
    trousers(d, rgb("#4a4f5a"), rgb("#f2f2f2"))
    return fabric(img, 6)


def mail_carrier():
    img, d = new()
    torso(d, rgb("#8fb8de"))
    short_sleeves(d, rgb("#8fb8de"), trim=rgb("#1f3b73"))
    x, y, w, h = T["front"]
    # Collar, pocket, badge and a mail-bag strap across the chest.
    d.polygon([(x + 44, y), (x + 64, y + 18), (x + 84, y)], fill=rgb("#6f9cc8"))
    d.rectangle((x + 80, y + 34, x + 108, y + 58), outline=rgb("#1f3b73"), width=3)
    d.ellipse((x + 18, y + 30, x + 40, y + 52), fill=rgb("#1f3b73"))
    d.polygon([(x + 22, y + 44), (x + 29, y + 35), (x + 36, y + 44)], fill=rgb("#f2f3f3"))
    d.line([(x + 6, y), (x + w - 6, y + h - 10)], fill=rgb("#7a4a26"), width=12)
    bx, by, bw, bh = T["back"]
    d.line([(bx + bw - 6, by), (bx + 6, by + bh - 10)], fill=rgb("#7a4a26"), width=12)
    for limb in LIMBS:  # shoulder patch
        x, y, w, h = limb["right"] if limb is RIGHT else limb["left"]
        d.rectangle((x + 18, y + 10, x + 46, y + 30), fill=rgb("#1f3b73"))
        d.rectangle((x + 22, y + 15, x + 42, y + 25), outline=rgb("#f2f3f3"), width=2)
    return fabric(img, 6)


def mail_shorts():
    img, d = new()
    trousers(d, rgb("#1f3b73"), rgb("#141414"), length=0.5, sock=rgb("#f5f5f5"))
    belt(d, rgb("#141414"), rgb("#bfbfbf"))
    return fabric(img, 6)


def doctor():
    img, d = new()
    torso(d, rgb("#fafafa"))
    long_sleeves(d, rgb("#fafafa"), cuff=rgb("#e6e6e6"))
    x, y, w, h = T["front"]
    cx = x + w // 2
    # Open coat showing blue scrubs, lapels, stethoscope, pocket with pens, badge.
    d.rectangle((cx - 22, y, cx + 22, y + h), fill=rgb("#7fb8d8"))
    d.polygon([(cx - 22, y), (cx - 34, y), (cx - 22, y + 50)], fill=rgb("#e9e9e9"))
    d.polygon([(cx + 22, y), (cx + 34, y), (cx + 22, y + 50)], fill=rgb("#e9e9e9"))
    d.arc((cx - 30, y - 30, cx + 30, y + 46), 20, 160, fill=rgb("#3a3a3a"), width=4)
    d.ellipse((cx + 8, y + 38, cx + 22, y + 52), fill=rgb("#9a9a9a"), outline=rgb("#3a3a3a"), width=2)
    d.rectangle((x + 8, y + 40, x + 34, y + 62), outline=rgb("#d0d0d0"), width=2)
    for i, c in enumerate(("#1f6fd1", "#d12f2f")):
        d.rectangle((x + 13 + i * 8, y + 30, x + 16 + i * 8, y + 44), fill=rgb(c))
    d.rectangle((x + w - 36, y + 40, x + w - 12, y + 58), fill=rgb("#cfe3f5"), outline=rgb("#7a9cc0"))
    return fabric(img, 5)


def scrub_pants():
    img, d = new()
    trousers(d, rgb("#7fb8d8"), rgb("#f0f0f0"))
    return fabric(img, 6)


def grad_gown(color="#1b1d22", trim="#f2c94c"):
    img, d = new()
    torso(d, rgb(color))
    long_sleeves(d, rgb(color), hand=0.12)
    x, y, w, h = T["front"]
    cx = x + w // 2
    d.polygon([(cx - 30, y), (cx + 30, y), (cx, y + 44)], fill=rgb("#f2f3f3"))
    d.polygon([(cx - 30, y), (cx - 20, y), (cx, y + 34), (cx + 20, y), (cx + 30, y), (cx, y + 50)], fill=rgb(trim))
    for limb in LIMBS:  # wide gown sleeves: darker fold lines
        for s in SIDES:
            lx, ly, lw, lh = limb[s]
            d.line([(lx + lw // 3, ly + 20), (lx + lw // 3, ly + lh - 24)], fill=rgb("#0e0f12"), width=2)
    return fabric(img, 5)


def gown_pants(color="#1b1d22"):
    img, d = new()
    trousers(d, rgb(color), rgb("#0c0c0e"), length=0.9)
    return fabric(img, 5)


def wedding_dress():
    img, d = new()
    torso(d, rgb("#fbfbfb"))
    x, y, w, h = T["front"]
    d.polygon([(x + 30, y), (x + 64, y + 30), (x + 98, y)], fill=(0, 0, 0, 0))  # sweetheart neckline shows skin
    for i in range(6):
        d.ellipse((x + 20 + i * 16, y + 96, x + 30 + i * 16, y + 106), fill=rgb("#e8e2f0"))
    return fabric(img, 4)


def wedding_skirt():
    img, d = new()
    trousers(d, rgb("#fbfbfb"), rgb("#f0eaf5"), length=0.95)
    return fabric(img, 4)


def crew_tee():
    img, d = new()
    torso(d, rgb("#1b1d22"))
    short_sleeves(d, rgb("#1b1d22"))
    x, y, w, h = T["front"]
    d.text((x + w // 2, y + 56), "GOTCHA!", font=font(26), fill=rgb("#ffd21f"), anchor="mm", stroke_width=2, stroke_fill=rgb("#c4281c"))
    bx, by, bw, bh = T["back"]
    d.text((bx + bw // 2, by + 50), "CREW", font=font(32), fill=rgb("#ffd21f"), anchor="mm")
    return fabric(img, 5)


OUTFITS = {
    "shirt-suit-black": suit, "pants-suit-black": suit_pants,
    "shirt-suit-tv-host": lambda: suit(jacket="#5b2a86", lapel="#43206a", tie="#ffd21f"), "pants-suit-tv-host": lambda: suit_pants("#43206a"),
    "shirt-lunch-lady": lunch_lady, "pants-lunch-lady": lunch_lady_pants,
    "shirt-mail-carrier": mail_carrier, "pants-mail-shorts": mail_shorts,
    "shirt-doctor": doctor, "pants-scrubs": scrub_pants,
    "shirt-grad-gown": grad_gown, "pants-grad-gown": gown_pants,
    "shirt-wedding-dress": wedding_dress, "pants-wedding-skirt": wedding_skirt,
    "shirt-gotcha-crew": crew_tee,
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, make in OUTFITS.items():
        make().save(OUT / f"{slug}.png")
        print("wrote", slug)


if __name__ == "__main__":
    main()
