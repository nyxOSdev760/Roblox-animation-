"""Convert Roblox .mesh files (version 2.00) to JSON for three.js.

Usage: python3 -I tools/rbx_mesh.py <in.mesh> <out.json>

Output: {"positions": [...], "normals": [...], "uvs": [...], "indices": [...],
         "bbox": {"min": [x,y,z], "max": [x,y,z]}}
Coordinates are left in Roblox's space (Y up, the front of a part faces -Z).
"""
import json
import struct
import sys


def read_mesh(data: bytes):
    header, _, body = data.partition(b"\n")
    if header.strip() != b"version 2.00":
        raise ValueError(f"unsupported mesh version: {header!r}")
    header_size, vert_size, face_size, nverts, nfaces = struct.unpack_from("<HBBII", body, 0)
    off = header_size
    positions, normals, uvs = [], [], []
    for i in range(nverts):
        px, py, pz, nx, ny, nz, u, v = struct.unpack_from("<8f", body, off + i * vert_size)
        positions += [px, py, pz]
        normals += [nx, ny, nz]
        uvs += [u, v]
    off += nverts * vert_size
    indices = list(struct.unpack_from(f"<{nfaces * 3}I", body, off))
    xs, ys, zs = positions[0::3], positions[1::3], positions[2::3]
    bbox = {"min": [min(xs), min(ys), min(zs)], "max": [max(xs), max(ys), max(zs)]}
    return {"positions": positions, "normals": normals, "uvs": uvs, "indices": indices, "bbox": bbox}


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    with open(src, "rb") as f:
        mesh = read_mesh(f.read())
    with open(dst, "w") as f:
        json.dump(mesh, f, separators=(",", ":"))
    print(dst, len(mesh["positions"]) // 3, "verts", len(mesh["indices"]) // 3, "tris", "bbox", mesh["bbox"])


if __name__ == "__main__":
    main()
