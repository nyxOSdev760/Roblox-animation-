"""Build the R15 rig data from Roblox Studio's own content.

Usage: python3 -I tools/rbx_r15.py [animation/assets/rbx/meshes/r15.json]

Downloads the current Studio build's content-avatar package from setup.rbxcdn.com, reads
characterR15.rbxm (the default R15 blocky rig: MeshParts and Motor6Ds), downloads each body
part's mesh from asset delivery and writes one JSON file with:

  parts:      { UpperTorso: { positions, normals, uvs, indices, size }, ... }  part-local studs
  joints:     { RightElbow: { part0, part1, c0: [x, y, z], c1: [x, y, z] }, ... }
  composites: { torso: {...}, rightArm: {...}, leftArm: {...} }  R15 clothing compositing:
              positions are pixels in the part atlas (y up), uvs point into the classic
              585x559 Shirt/Pants template (v down). See animation/src/r15.js.

Everything stays in Roblox's space (front is -z); r15.js turns it around.
"""
import io
import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rbx_mesh import read_mesh  # noqa: E402
from rbxm import load  # noqa: E402
from roblox_assets import http  # noqa: E402

SETUP = "https://setup.rbxcdn.com"


def studio_avatar_zip():
    version = json.loads(http("https://clientsettings.roblox.com/v2/client-version/WindowsStudio64"))["clientVersionUpload"]
    return zipfile.ZipFile(io.BytesIO(http(f"{SETUP}/{version}-content-avatar.zip"))), version


def asset(aid):
    info = json.loads(http(f"https://assetdelivery.roblox.com/v2/asset/?id={aid}"))
    return http(info["locations"][0]["location"])


def rounded(m, nd=5):
    return {k: [round(v, nd) for v in m[k]] if k != "indices" else m[k] for k in ("positions", "normals", "uvs", "indices")}


def main():
    dest = Path(sys.argv[1] if len(sys.argv) > 1 else "animation/assets/rbx/meshes/r15.json")
    z, version = studio_avatar_zip()
    read = lambda name: z.read(next(n for n in z.namelist() if n.replace("\\", "/").lstrip("/") == name))  # noqa: E731
    rig = load(read("characterR15.rbxm"))

    parts, joints = {}, {}
    for inst in rig:
        if inst.cls == "MeshPart":
            m = read_mesh(asset(inst.props["MeshId"].split("=")[-1]))
            parts[inst.name] = {**rounded(m), "size": [round(v, 5) for v in inst.props["InitialSize"]]}
            print(f"{inst.name}: {len(m['positions']) // 3} vertices")
        elif inst.cls == "Motor6D":
            joints[inst.name] = {
                "part0": inst.props["Part0"].name,
                "part1": inst.props["Part1"].name,
                "c0": [round(v, 5) for v in inst.props["C0"][:3]],
                "c1": [round(v, 5) for v in inst.props["C1"][:3]],
            }
    composites = {}
    for key, name in (("torso", "R15CompositTorsoBase"), ("rightArm", "R15CompositRightArmBase"), ("leftArm", "R15CompositLeftArmBase")):
        m = read_mesh(read(f"compositing/{name}.mesh"))
        composites[key] = {"positions": [round(v, 3) for i, v in enumerate(m["positions"]) if i % 3 != 2], "uvs": [round(v, 6) for v in m["uvs"]], "indices": m["indices"],
                           "size": [round(m["bbox"]["max"][0]), round(m["bbox"]["max"][1])]}
    dest.write_text(json.dumps({"source": f"{version} characterR15.rbxm", "parts": parts, "joints": joints, "composites": composites}, separators=(",", ":")))
    print("wrote", dest)


if __name__ == "__main__":
    main()
