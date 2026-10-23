"""Pull Roblox catalog items (hair, UGC faces, hats) into the animation's asset library.

    python3 -I tools/roblox_assets.py search --sub hair --pages 3 --out hair.json [--keyword messy]
    python3 -I tools/roblox_assets.py sheet hair.json hair.png          # thumbnail contact sheet
    python3 -I tools/roblox_assets.py build <assetId> <slug> [--kind hair|face|hat]

`build` downloads the accessory, its mesh and texture, places the mesh on a classic R6
head the way Roblox attaches it, and writes animation/assets/rbx/accessories/<slug>/
{model.json, texture.png}. model.json positions are in the renderer's head space: origin
at the head centre, y up, the face looking toward +z (Roblox looks toward -z).
"""
import argparse
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rbxm import asset_id, load  # noqa: E402
from rbx_mesh import read_mesh  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "animation" / "assets" / "rbx" / "accessories"
CACHE = Path(os.environ.get("RBX_CACHE", REPO / "tools" / ".cache"))
SUBCATEGORIES = {"hair": (18, 20), "face": (11, 21), "hat": (11, 54), "shirt": (3, 56), "pants": (3, 57)}
CLOTHING = REPO / "animation" / "assets" / "rbx" / "clothing"
TEXTURE_MAX = 512

# Attachments on the classic R6 head, relative to the head's centre (Roblox space).
HEAD_ATTACHMENTS = {
    "HairAttachment": (0, 0.6, 0),
    "HatAttachment": (0, 0.6, 0),
    "FaceFrontAttachment": (0, 0, -0.6),
    "FaceCenterAttachment": (0, 0, 0),
}


def http(url, retries=4):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Encoding": "gzip"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
                if r.headers.get("Content-Encoding") == "gzip" or data[:2] == b"\x1f\x8b":
                    import gzip

                    data = gzip.decompress(data)
                return data
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(5 * (attempt + 1))
                continue
            raise
        except urllib.error.URLError:
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise


def fetch(aid: int) -> bytes:
    """Asset bytes from Roblox's asset delivery service, cached on disk."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / str(aid)
    if path.exists():
        return path.read_bytes()
    info = json.loads(http(f"https://assetdelivery.roblox.com/v2/asset/?id={aid}"))
    if "locations" not in info:
        raise RuntimeError(f"asset {aid}: {info}")
    data = http(info["locations"][0]["location"])
    path.write_bytes(data)
    return data


# ---- catalog ---------------------------------------------------------------------------

def search(sub, keyword=None, pages=1, sort=1):
    cat, subcat = SUBCATEGORIES[sub]
    items, cursor = [], ""
    for _ in range(pages):
        q = {"Category": cat, "Subcategory": subcat, "Limit": 30, "SortType": sort, "SortAggregation": 5}
        if keyword:
            q["Keyword"] = keyword
        if cursor:
            q["Cursor"] = cursor
        d = json.loads(http("https://catalog.roblox.com/v1/search/items/details?" + urllib.parse.urlencode(q)))
        for it in d.get("data", []):
            if it.get("itemType") == "Asset":
                items.append({k: it.get(k) for k in ("id", "name", "creatorName", "favoriteCount", "price", "assetType")})
        cursor = d.get("nextPageCursor")
        if not cursor:
            break
        time.sleep(1)
    return items


def thumbnails(ids, size="150x150"):
    out = {}
    for i in range(0, len(ids), 100):
        chunk = ",".join(str(x) for x in ids[i : i + 100])
        d = json.loads(http(f"https://thumbnails.roblox.com/v1/assets?assetIds={chunk}&size={size}&format=Png"))
        for t in d.get("data", []):
            if t.get("imageUrl"):
                out[t["targetId"]] = t["imageUrl"]
    return out


def sheet(items, dest, cols=10, cell=150):
    urls = thumbnails([it["id"] for it in items])
    rows = (len(items) + cols - 1) // cols
    img = Image.new("RGB", (cols * cell, rows * (cell + 14)), "white")
    d = ImageDraw.Draw(img)
    for n, it in enumerate(items):
        x, y = (n % cols) * cell, (n // cols) * (cell + 14)
        if it["id"] in urls:
            try:
                th = Image.open(io.BytesIO(http(urls[it["id"]]))).convert("RGBA").resize((cell, cell))
                bg = Image.new("RGBA", th.size, (235, 235, 235, 255))
                img.paste(Image.alpha_composite(bg, th).convert("RGB"), (x, y))
            except Exception:
                pass
        d.text((x + 3, y + cell), f"{n}: {it['name'][:22]}", fill="black")
    img.save(dest)


# ---- building an accessory ---------------------------------------------------------------

def cframe(t):
    """4x4 matrix from a Roblox CFrame tuple (x, y, z, r00..r22)."""
    m = np.eye(4)
    m[:3, :3] = np.array(t[3:12]).reshape(3, 3)
    m[:3, 3] = t[:3]
    return m


def translate(x, y, z):
    m = np.eye(4)
    m[:3, 3] = (x, y, z)
    return m


def texture_png(aid, dest):
    im = Image.open(io.BytesIO(fetch(aid))).convert("RGBA")
    if max(im.size) > TEXTURE_MAX:
        im.thumbnail((TEXTURE_MAX, TEXTURE_MAX), Image.LANCZOS)
    im.save(dest)
    return im.size


def key_out_skin(path, softness=0.12):
    """Make a face mask's skin colour transparent so only its features show on any head.

    The skin colour is the most common colour in the texture; pixels near it fade out.
    """
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255
    rgb, a = im[..., :3], im[..., 3]
    q = (rgb[a > 0.5] * 15).round().astype(int)
    vals, counts = np.unique(q, axis=0, return_counts=True)
    skin = vals[counts.argmax()] / 15
    near = rgb[(np.abs(rgb - skin).max(axis=-1) < 0.1) & (a > 0.5)]
    skin = near.mean(axis=0) if len(near) else skin
    dist = np.sqrt(((rgb - skin) ** 2).sum(axis=-1))
    keep = np.clip((dist - softness * 0.5) / softness, 0, 1)
    out = np.dstack([rgb, a * keep])
    Image.fromarray((out * 255).astype(np.uint8)).save(path)


def build(aid, slug, kind, key=False):
    insts = load(fetch(aid))
    acc = next((i for i in insts if i.cls in ("Accessory", "Hat")), None)
    if acc is None:
        raise RuntimeError("no Accessory in asset")
    handle = next((c for c in acc.children if c.name == "Handle"), None)
    if handle is None:
        raise RuntimeError("no Handle")

    # Where the handle sits relative to the head centre.
    att = next((c for c in handle.children if c.cls == "Attachment" and c.name in HEAD_ATTACHMENTS), None)
    if att is not None:
        head_att = translate(*HEAD_ATTACHMENTS[att.name])
        handle_in_head = head_att @ np.linalg.inv(cframe(att.props["CFrame"]))
        attach = att.name
    else:  # legacy hat: AttachmentPoint relative to the top of the head
        ap = acc.props.get("AttachmentPoint", (0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1))
        handle_in_head = translate(0, 0.5, 0) @ np.linalg.inv(cframe(ap))
        attach = "legacy"

    # The mesh and how it is scaled inside the handle.
    special = next((c for c in handle.children if c.cls == "SpecialMesh"), None)
    color = handle.props.get("Color3uint8") or handle.props.get("Color") or (0.64, 0.64, 0.65)
    if handle.cls == "MeshPart":
        mesh_url = handle.props.get("MeshId") or handle.props.get("MeshContent", "")
        tex_url = handle.props.get("TextureID") or handle.props.get("TextureContent", "")
        if not asset_id(tex_url):  # PBR items keep their colour map in a SurfaceAppearance
            sa = next((c for c in handle.children if c.cls == "SurfaceAppearance"), None)
            tex_url = sa.props.get("ColorMap", "") if sa else ""
        tint = (1, 1, 1)
    elif special is not None and special.props.get("MeshType", 5) == 5:
        mesh_url = special.props.get("MeshId", "")
        tex_url = special.props.get("TextureId", "")
        tint = special.props.get("VertexColor", (1, 1, 1))
    else:
        raise RuntimeError("handle has no file mesh")
    mid = asset_id(mesh_url)
    if mid is None:
        raise RuntimeError(f"no mesh id in {mesh_url!r}")
    mesh = read_mesh(fetch(mid))

    p = np.array(mesh["positions"]).reshape(-1, 3)
    nrm = np.array(mesh["normals"]).reshape(-1, 3)
    if handle.cls == "MeshPart":
        lo, hi = np.array(mesh["bbox"]["min"]), np.array(mesh["bbox"]["max"])
        # Binary files store a part's Size as "size".
        size = np.array(handle.props.get("Size") or handle.props.get("size") or (hi - lo))
        initial = np.array(handle.props.get("InitialSize", hi - lo))
        scale = size / np.where(initial == 0, 1, initial)
        p = (p - (lo + hi) / 2) * scale
    else:
        scale = np.array(special.props.get("Scale", (1, 1, 1)))
        p = p * scale + np.array(special.props.get("Offset", (0, 0, 0)))
    nrm = nrm / np.where(scale == 0, 1, scale)  # non-uniform scale: inverse-transpose

    m = handle_in_head
    p = p @ m[:3, :3].T + m[:3, 3]
    nrm = nrm @ m[:3, :3].T
    nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-9)
    # Roblox faces -z; the renderer's characters face +z: rotate 180 degrees about y.
    p[:, [0, 2]] *= -1
    nrm[:, [0, 2]] *= -1

    dest = OUT / slug
    dest.mkdir(parents=True, exist_ok=True)
    tid = asset_id(tex_url)
    has_tex = False
    if tid is not None:
        try:
            texture_png(tid, dest / "texture.png")
            if key:
                key_out_skin(dest / "texture.png")
            has_tex = True
        except Exception as e:  # a missing/moderated texture: fall back to the part colour
            print(f"  texture {tid} failed: {e}")
    uvs = np.array(mesh["uvs"]).reshape(-1, 2)
    uvs[:, 1] = 1 - uvs[:, 1]  # Roblox V runs top-down
    model = {
        "name": acc.name,
        "assetId": aid,
        "kind": kind,
        "attachment": attach,
        "color": [round(c, 4) for c in color],
        "tint": [round(c, 4) for c in tint],
        "texture": has_tex,
        "positions": [round(v, 4) for v in p.ravel().tolist()],
        "normals": [round(v, 3) for v in nrm.ravel().tolist()],
        "uvs": [round(v, 4) for v in uvs.ravel().tolist()],
        "indices": mesh["indices"],
    }
    (dest / "model.json").write_text(json.dumps(model, separators=(",", ":")))
    lo, hi = p.min(axis=0), p.max(axis=0)
    print(f"built {slug}: {acc.name!r} ({attach}) {len(p)} verts, bbox {lo.round(2)}..{hi.round(2)}, texture={has_tex}")
    return model


def clothing(aid, slug):
    """Download a classic Shirt or Pants template (585x559) to assets/rbx/clothing/<slug>.png."""
    insts = load(fetch(aid))
    for i in insts:
        for prop in ("ShirtTemplate", "PantsTemplate"):
            tid = asset_id(i.props.get(prop, ""))
            if tid:
                CLOTHING.mkdir(parents=True, exist_ok=True)
                im = Image.open(io.BytesIO(fetch(tid))).convert("RGBA")
                if im.size != (585, 559):
                    im = im.resize((585, 559), Image.LANCZOS)
                im.save(CLOTHING / f"{slug}.png")
                print(f"clothing {slug}: {prop} {tid}")
                return
    raise RuntimeError("no ShirtTemplate/PantsTemplate in asset")


def main() -> None:
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("search")
    s.add_argument("--sub", choices=SUBCATEGORIES, required=True)
    s.add_argument("--keyword")
    s.add_argument("--pages", type=int, default=1)
    s.add_argument("--sort", type=int, default=1, help="1 favourites, 2 sales, 0 relevance")
    s.add_argument("--out", required=True)
    sh = sp.add_parser("sheet")
    sh.add_argument("list")
    sh.add_argument("png")
    b = sp.add_parser("build")
    b.add_argument("asset", type=int)
    b.add_argument("slug")
    b.add_argument("--kind", default="hair")
    b.add_argument("--key", action="store_true", help="make a face mask's skin colour transparent")
    c = sp.add_parser("clothing")
    c.add_argument("asset", type=int)
    c.add_argument("slug")
    a = ap.parse_args()
    if a.cmd == "search":
        items = search(a.sub, a.keyword, a.pages, a.sort)
        Path(a.out).write_text(json.dumps(items, indent=1))
        print(len(items), "items ->", a.out)
    elif a.cmd == "sheet":
        sheet(json.loads(Path(a.list).read_text()), a.png)
    elif a.cmd == "clothing":
        clothing(a.asset, a.slug)
    else:
        build(a.asset, a.slug, a.kind, a.key)


if __name__ == "__main__":
    main()
