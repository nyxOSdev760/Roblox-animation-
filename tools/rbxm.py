"""Read Roblox model files (.rbxm binary and .rbxmx XML) into plain Python objects.

    from rbxm import load
    for inst in load(data):            # data: bytes of a .rbxm/.rbxmx file
        print(inst.cls, inst.props["Name"], inst.parent)

Each Instance has .cls, .props (name -> value), .children and .parent. Values:
strings -> str, numbers -> int/float, Vector3 -> (x, y, z), Color3 -> (r, g, b) floats
0..1, CFrame -> (x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22), Content ->
str (the asset URL). Property types this tool doesn't need are skipped.
"""
import re
import struct
import xml.etree.ElementTree as ET


class Instance:
    def __init__(self, cls):
        self.cls = cls
        self.props = {}
        self.children = []
        self.parent = None

    @property
    def name(self):
        return self.props.get("Name", "")

    def descendants(self):
        for c in self.children:
            yield c
            yield from c.descendants()

    def __repr__(self):
        return f"<{self.cls} {self.name!r}>"


def load(data: bytes):
    """Return all instances (in file order) of a .rbxm or .rbxmx file."""
    if data.startswith(b"<roblox!"):
        return _load_binary(data)
    return _load_xml(data)


# ---- binary format ---------------------------------------------------------------------

def _lz4_block(src: bytes, size: int) -> bytes:
    out = bytearray()
    i = 0
    while i < len(src):
        token = src[i]
        i += 1
        n = token >> 4
        if n == 15:
            while True:
                b = src[i]
                i += 1
                n += b
                if b != 255:
                    break
        out += src[i : i + n]
        i += n
        if i >= len(src):
            break
        off = src[i] | (src[i + 1] << 8)
        i += 2
        m = token & 15
        if m == 15:
            while True:
                b = src[i]
                i += 1
                m += b
                if b != 255:
                    break
        m += 4
        start = len(out) - off
        for k in range(m):  # may overlap, so copy byte by byte
            out.append(out[start + k])
    if len(out) != size:
        raise ValueError(f"lz4: got {len(out)} bytes, expected {size}")
    return bytes(out)


class _Reader:
    def __init__(self, b):
        self.b = b
        self.i = 0

    def take(self, n):
        v = self.b[self.i : self.i + n]
        self.i += n
        return v

    def u8(self):
        return self.take(1)[0]

    def u32(self):
        return struct.unpack("<I", self.take(4))[0]

    def string(self):
        return self.take(self.u32())

    def interleaved(self, count, width=4):
        """Byte-interleaved big-endian values (all first bytes, then all second bytes...)."""
        raw = self.take(count * width)
        vals = []
        for j in range(count):
            v = 0
            for k in range(width):
                v = (v << 8) | raw[k * count + j]
            vals.append(v)
        return vals

    def ints(self, count):
        return [(v >> 1) ^ -(v & 1) for v in self.interleaved(count)]

    def floats(self, count):
        out = []
        for v in self.interleaved(count):
            bits = ((v >> 1) | (v << 31)) & 0xFFFFFFFF
            out.append(struct.unpack("<f", struct.pack("<I", bits))[0])
        return out

    def refs(self, count):
        acc, out = 0, []
        for d in self.ints(count):
            acc += d
            out.append(acc)
        return out


_NORMALS = [(1, 0, 0), (0, 1, 0), (0, 0, 1), (-1, 0, 0), (0, -1, 0), (0, 0, -1)]


def _basic_rotation(rid):
    v = rid - 1
    x = _NORMALS[v // 6]
    y = _NORMALS[v % 6]
    z = (x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0])
    return (*x, *y, *z)


def _decode_prop(r: _Reader, type_id, n, sstrings):
    if type_id == 0x01:  # String
        out = []
        for _ in range(n):
            s = r.string()
            try:
                out.append(s.decode("utf-8"))
            except UnicodeDecodeError:
                out.append(s)
        return out
    if type_id == 0x02:  # Bool
        return [b != 0 for b in r.take(n)]
    if type_id == 0x03:  # Int32
        return r.ints(n)
    if type_id == 0x04:  # Float32
        return r.floats(n)
    if type_id == 0x05:  # Float64
        return [struct.unpack("<d", r.take(8))[0] for _ in range(n)]
    if type_id == 0x0C:  # Color3 (floats)
        rr, gg, bb = r.floats(n), r.floats(n), r.floats(n)
        return list(zip(rr, gg, bb))
    if type_id == 0x0E:  # Vector3
        xs, ys, zs = r.floats(n), r.floats(n), r.floats(n)
        return list(zip(xs, ys, zs))
    if type_id == 0x10:  # CFrame
        rots = []
        for _ in range(n):
            rid = r.u8()
            rots.append(struct.unpack("<9f", r.take(36)) if rid == 0 else _basic_rotation(rid))
        xs, ys, zs = r.floats(n), r.floats(n), r.floats(n)
        return [(xs[k], ys[k], zs[k], *rots[k]) for k in range(n)]
    if type_id == 0x12:  # Enum
        return r.interleaved(n)
    if type_id == 0x13:  # Referent
        return r.refs(n)
    if type_id == 0x1A:  # Color3uint8
        rr, gg, bb = r.take(n), r.take(n), r.take(n)
        return [(rr[k] / 255, gg[k] / 255, bb[k] / 255) for k in range(n)]
    if type_id == 0x1C:  # SharedString
        return [sstrings[k] for k in r.interleaved(n)]
    if type_id == 0x22:  # Content (newer files): source type per value, then URIs
        kinds = r.ints(n)
        uris = [r.string().decode("utf-8", "replace") for _ in range(r.u32())]
        it = iter(uris)
        return [next(it, "") if k == 1 else "" for k in kinds]
    return None  # a type we don't need


def _load_binary(data: bytes):
    n_types, n_insts = struct.unpack_from("<iI", data, 16)
    pos = 32
    classes = {}  # class id -> (class name, [referents])
    by_ref = {}
    order = []
    sstrings = []
    while pos < len(data):
        name = data[pos : pos + 4]
        clen, ulen = struct.unpack_from("<II", data, pos + 4)
        body = data[pos + 16 : pos + 16 + (clen or ulen)]
        pos += 16 + (clen or ulen)
        if clen:
            if body[:4] == b"\x28\xb5\x2f\xfd":
                raise ValueError("zstd-compressed chunk (not supported)")
            body = _lz4_block(body, ulen)
        r = _Reader(body)
        if name == b"INST":
            cid = r.u32()
            cname = r.string().decode()
            r.u8()  # object format
            count = r.u32()
            refs = r.refs(count)
            classes[cid] = (cname, refs)
            for ref in refs:
                inst = Instance(cname)
                by_ref[ref] = inst
                order.append(inst)
        elif name == b"SSTR":
            r.u32()  # version
            for _ in range(r.u32()):
                r.take(16)  # hash
                sstrings.append(r.string())
        elif name == b"PROP":
            cid = r.u32()
            pname = r.string().decode()
            type_id = r.u8()
            cname, refs = classes[cid]
            try:
                values = _decode_prop(r, type_id, len(refs), sstrings)
            except (IndexError, struct.error):
                values = None
            if values is not None:
                for ref, v in zip(refs, values):
                    by_ref[ref].props[pname] = v
        elif name == b"PRNT":
            r.u8()
            count = r.u32()
            kids = r.refs(count)
            parents = r.refs(count)
            for c, p in zip(kids, parents):
                if p >= 0 and c in by_ref and p in by_ref:
                    by_ref[c].parent = by_ref[p]
                    by_ref[p].children.append(by_ref[c])
        elif name == b"END\0":
            break
    # Referent-typed properties point at instances.
    for inst in order:
        for k, v in list(inst.props.items()):
            if k in ("Part0", "Part1", "PrimaryPart") and isinstance(v, int):
                inst.props[k] = by_ref.get(v)
    return order


# ---- XML format ------------------------------------------------------------------------

def _xml_value(el):
    tag = el.tag
    if tag in ("string", "ProtectedString", "BinaryString"):
        return el.text or ""
    if tag in ("Content", "ContentId"):
        url = el.find("url")
        return (url.text if url is not None else el.text or "").strip()
    if tag in ("float", "double"):
        return float(el.text)
    if tag in ("int", "int64", "token"):
        return int(el.text)
    if tag == "bool":
        return el.text == "true"
    if tag == "Vector3":
        return tuple(float(el.find(c).text) for c in "XYZ")
    if tag in ("CoordinateFrame", "CFrame"):
        keys = ["X", "Y", "Z", "R00", "R01", "R02", "R10", "R11", "R12", "R20", "R21", "R22"]
        return tuple(float(el.find(k).text) for k in keys)
    if tag == "Color3uint8":
        v = int(el.text)
        return (((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255)
    if tag == "Color3":
        return tuple(float(el.find(c).text) for c in "RGB")
    return None


def _load_xml(data: bytes):
    root = ET.fromstring(data.decode("utf-8", "replace"))
    order = []

    def walk(el, parent):
        for item in el.findall("Item"):
            inst = Instance(item.get("class"))
            props = item.find("Properties")
            if props is not None:
                for p in props:
                    try:
                        v = _xml_value(p)
                    except (AttributeError, ValueError):  # unexpected layout: skip it
                        v = None
                    if v is not None:
                        inst.props[p.get("name")] = v
            inst.parent = parent
            if parent:
                parent.children.append(inst)
            order.append(inst)
            walk(item, inst)

    walk(root, None)
    return order


def asset_id(url: str):
    """The numeric asset id in a Roblox content URL (rbxassetid://N, ...?id=N), or None."""
    m = re.search(r"(?:rbxassetid://|[?&]id=)(\d+)", url or "")
    return int(m.group(1)) if m else None
