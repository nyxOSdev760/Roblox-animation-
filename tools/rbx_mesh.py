"""Read Roblox .mesh files (versions 1.00 to 7.00) and convert them to JSON for three.js.

Usage: python3 -I tools/rbx_mesh.py <in.mesh> <out.json>

Output: {"positions": [...], "normals": [...], "uvs": [...], "indices": [...],
         "bbox": {"min": [x,y,z], "max": [x,y,z]}}
Coordinates stay in Roblox's space (Y up, the front of a part faces -Z). Only the
highest-detail LOD is kept.
"""
import json
import re
import struct
import sys


class MeshError(ValueError):
    pass


def read_mesh(data: bytes):
    header, _, body = data.partition(b"\n")
    version = header.strip().decode("ascii", "replace")
    if version in ("version 1.00", "version 1.01"):
        return _v1(body, scale=0.5 if version.endswith("1.00") else 1.0)
    if version == "version 2.00":
        return _v2(body)
    if version in ("version 3.00", "version 3.01"):
        return _v3(body)
    if version in ("version 4.00", "version 4.01", "version 5.00"):
        return _v4(body)
    if version in ("version 6.00", "version 7.00"):
        return _chunked(body)
    raise MeshError(f"unsupported mesh version: {version!r}")


def _finish(positions, normals, uvs, indices):
    if not indices:
        raise MeshError("mesh has no faces")
    # Some meshes carry a few unused NaN vertices; zero them so nothing downstream breaks.
    positions = [0.0 if v != v else v for v in positions]
    normals = [0.0 if v != v else v for v in normals]
    uvs = [0.0 if v != v else v for v in uvs]
    xs, ys, zs = positions[0::3], positions[1::3], positions[2::3]
    bbox = {"min": [min(xs), min(ys), min(zs)], "max": [max(xs), max(ys), max(zs)]}
    return {"positions": positions, "normals": normals, "uvs": uvs, "indices": indices, "bbox": bbox}


def _v1(body, scale):
    lines = body.decode("ascii", "replace").split("\n", 1)
    nums = [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?(?:e[-+]?\d+)?", lines[1], re.I)]
    nfaces = int(lines[0].strip())
    positions, normals, uvs = [], [], []
    for v in range(nfaces * 3):
        px, py, pz, nx, ny, nz, u, w, _ = nums[v * 9 : v * 9 + 9]
        positions += [px * scale, py * scale, pz * scale]
        normals += [nx, ny, nz]
        uvs += [u, 1 - w]  # v1 stores V flipped relative to v2+
    return _finish(positions, normals, uvs, list(range(nfaces * 3)))


def _verts(b, off, n, size):
    positions, normals, uvs = [], [], []
    for i in range(n):
        px, py, pz, nx, ny, nz, u, v = struct.unpack_from("<8f", b, off + i * size)
        positions += [px, py, pz]
        normals += [nx, ny, nz]
        uvs += [u, v]
    return positions, normals, uvs


def _v2(b):
    hsize, vsize, fsize, nv, nf = struct.unpack_from("<HBBII", b, 0)
    p, n, uv = _verts(b, hsize, nv, vsize)
    idx = list(struct.unpack_from(f"<{nf * 3}I", b, hsize + nv * vsize))
    return _finish(p, n, uv, idx)


def _lod0(idx, lods):
    """Keep the faces of the first (highest-detail) LOD."""
    if len(lods) >= 2 and lods[1] > lods[0]:
        return idx[lods[0] * 3 : lods[1] * 3]
    return idx


def _v3(b):
    hsize, vsize, fsize, lsize, nlods, nv, nf = struct.unpack_from("<HBBHHII", b, 0)
    p, n, uv = _verts(b, hsize, nv, vsize)
    off = hsize + nv * vsize
    idx = list(struct.unpack_from(f"<{nf * 3}I", b, off))
    lods = list(struct.unpack_from(f"<{nlods}I", b, off + nf * 12)) if nlods else []
    return _finish(p, n, uv, _lod0(idx, lods))


def _v4(b):
    hsize, _lodtype, nv, nf, nlods, nbones = struct.unpack_from("<HHIIHH", b, 0)
    off = hsize
    p, n, uv = _verts(b, off, nv, 40)
    off += nv * 40
    if nbones:
        off += nv * 8  # skinning envelopes
    idx = list(struct.unpack_from(f"<{nf * 3}I", b, off))
    off += nf * 12
    lods = list(struct.unpack_from(f"<{nlods}I", b, off)) if nlods else []
    return _finish(p, n, uv, _lod0(idx, lods))


def _chunked(b):
    off = 0
    core = None
    lods = []
    while off + 16 <= len(b):
        kind = b[off : off + 8]
        cver, size = struct.unpack_from("<II", b, off + 8)
        data = b[off + 16 : off + 16 + size]
        off += 16 + size
        if kind == b"COREMESH":
            if cver != 1:
                raise MeshError("compressed (Draco) COREMESH is not supported")
            nv = struct.unpack_from("<I", data, 0)[0]
            p, n, uv = _verts(data, 4, nv, 40)
            o = 4 + nv * 40
            nf = struct.unpack_from("<I", data, o)[0]
            idx = list(struct.unpack_from(f"<{nf * 3}I", data, o + 4))
            core = (p, n, uv, idx)
        elif kind == b"LODS\0\0\0\0" and cver == 1:
            count = struct.unpack_from("<I", data, 3)[0]
            lods = list(struct.unpack_from(f"<{count}I", data, 7))
    if core is None:
        raise MeshError("no COREMESH chunk")
    p, n, uv, idx = core
    return _finish(p, n, uv, _lod0(idx, lods))


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    with open(src, "rb") as f:
        mesh = read_mesh(f.read())
    with open(dst, "w") as f:
        json.dump(mesh, f, separators=(",", ":"))
    print(dst, len(mesh["positions"]) // 3, "verts", len(mesh["indices"]) // 3, "tris", "bbox", mesh["bbox"])


if __name__ == "__main__":
    main()
