"""Build the Case 404 board in Blender from scene.json and the exported textures.

Usage:
  blender --background --python tools/blender/build_scene.py -- \
      --assets tools/blender/out [--render stills|animation|none] [--engine CYCLES|EEVEE] \
      [--samples 64] [--resolution 50] [--haze 0.006]
"""

import argparse
import json
import math
import os
import sys

import bpy

FPS = 24
HOLD_FRAMES = 24
MOVE_FRAMES = 48
REFERENCE_DISTANCE = 12.0
LAMP_POWER = 2200.0
PIN_HEAD_RADIUS = 0.085
PIN_HEAD_HEIGHT = 0.11
GRID_SEGMENTS = 14
FLIP_FRAMES = 30
LAMP_TINT = "#ffcf9e"
LAMP_CONE_RATIO = 0.82


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", required=True)
    parser.add_argument("--render", default="stills", choices=["stills", "animation", "none"])
    parser.add_argument("--engine", default="CYCLES", choices=["CYCLES", "EEVEE"])
    parser.add_argument("--samples", type=int, default=64)
    parser.add_argument("--resolution", type=int, default=50)
    parser.add_argument("--haze", type=float, default=0.012)
    parser.add_argument("--stills", default="")
    parser.add_argument("--pack", action="store_true", help="embed textures into the .blend")
    return parser.parse_args(argv)


def to_blender(point):
    x, y, z = point
    return (x, -z, y)


def hex_color(value, alpha=1.0):
    value = value.lstrip("#")
    srgb = [int(value[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*linear, alpha)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    return scene


def node_material(name):
    material = bpy.data.materials.new(name)
    if hasattr(material, "use_nodes") and not material.use_nodes:
        material.use_nodes = True
    return material, material.node_tree.nodes, material.node_tree.links


def principled(nodes):
    node = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")
    return node


def load_image(path, non_color=False):
    image = bpy.data.images.load(path, check_existing=True)
    if non_color:
        image.colorspace_settings.name = "Non-Color"
    return image


def textured_material(name, image_path, bump_path, roughness, bump_strength, tiles=(2.0, 2.0), tile_base=False, tint=None):
    material, nodes, links = node_material(name)
    bsdf = principled(nodes)
    coords = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (tiles[0], tiles[1], 1)
    links.new(coords.outputs["UV"], mapping.inputs["Vector"])

    texture = nodes.new("ShaderNodeTexImage")
    texture.image = load_image(image_path)
    if tile_base:
        links.new(mapping.outputs["Vector"], texture.inputs["Vector"])
    if tint:
        multiply = nodes.new("ShaderNodeMix")
        multiply.data_type = "RGBA"
        multiply.blend_type = "MULTIPLY"
        multiply.inputs["Factor"].default_value = 1.0
        multiply.inputs["B"].default_value = hex_color(tint)
        links.new(texture.outputs["Color"], multiply.inputs["A"])
        links.new(multiply.outputs["Result"], bsdf.inputs["Base Color"])
    else:
        links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(texture.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = roughness

    bump_texture = nodes.new("ShaderNodeTexImage")
    bump_texture.image = load_image(bump_path, non_color=True)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12 * bump_strength
    links.new(mapping.outputs["Vector"], bump_texture.inputs["Vector"])
    links.new(bump_texture.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    if hasattr(material, "surface_render_method"):
        material.surface_render_method = "DITHERED"
    return material


def solid_material(name, color, roughness=0.5, metallic=0.0, emission=0.0):
    material, nodes, _ = node_material(name)
    bsdf = principled(nodes)
    bsdf.inputs["Base Color"].default_value = hex_color(color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission > 0:
        bsdf.inputs["Emission Color"].default_value = hex_color(color)
        bsdf.inputs["Emission Strength"].default_value = emission
    return material


def link(obj, collection=None):
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def card_mesh(name, width, height, lift, curl):
    vertices, faces, uvs = [], [], []
    for row in range(GRID_SEGMENTS + 1):
        for col in range(GRID_SEGMENTS + 1):
            u = col / GRID_SEGMENTS
            v = row / GRID_SEGMENTS
            x = (u - 0.5) * width
            y = (v - 0.5) * height
            from_top = 0.5 - y / height
            z = lift * from_top * from_top + curl * (x / width) ** 2 * from_top * 4
            vertices.append(to_blender((x, y, z)))
            uvs.append((u, v))
    for row in range(GRID_SEGMENTS):
        for col in range(GRID_SEGMENTS):
            a = row * (GRID_SEGMENTS + 1) + col
            faces.append((a, a + 1, a + GRID_SEGMENTS + 2, a + GRID_SEGMENTS + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    layer = mesh.uv_layers.new(name="UVMap")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            layer.data[loop_index].uv = uvs[mesh.loops[loop_index].vertex_index]
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return mesh


def add_pin(parent, local, color, materials):
    material = materials.setdefault(color, solid_material(f"Pin {color}", color, roughness=0.3))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=PIN_HEAD_RADIUS, segments=20, ring_count=12)
    head = bpy.context.active_object
    head.data.materials.append(material)
    head.parent = parent
    head.location = to_blender((local[0], local[1], PIN_HEAD_HEIGHT * 1.05))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.065, depth=PIN_HEAD_HEIGHT * 0.5, vertices=16)
    collar = bpy.context.active_object
    collar.data.materials.append(material)
    collar.parent = parent
    collar.rotation_euler = (math.pi / 2, 0, 0)
    collar.location = to_blender((local[0], local[1], PIN_HEAD_HEIGHT * 0.78))


def build_board(scene_data, surfaces, bump_path):
    board = scene_data["board"]
    width, height = board["width"], board["height"]
    tile = board["corkTile"]
    cork = textured_material("Cork", surfaces["cork"], surfaces["cork"], 0.96, 3.0, (width / tile, height / tile), tile_base=True, tint="#b39a80")
    mesh = card_mesh("Cork", width, height, 0, 0)
    obj = link(bpy.data.objects.new("Cork Board", mesh))
    obj.data.materials.append(cork)

    frame_material = solid_material("Frame", "#2c1a10", roughness=0.55)
    frame, depth = board["frame"], board["frameDepth"]
    sides = [
        ((0, height / 2 + frame / 2), (width + frame * 2, frame)),
        ((0, -height / 2 - frame / 2), (width + frame * 2, frame)),
        ((-width / 2 - frame / 2, 0), (frame, height)),
        ((width / 2 + frame / 2, 0), (frame, height)),
    ]
    for (x, y), (w, h) in sides:
        bpy.ops.mesh.primitive_cube_add(size=1, location=to_blender((x, y, 0)))
        cube = bpy.context.active_object
        cube.scale = (w, depth, h)
        cube.data.materials.append(frame_material)

    wall = textured_material("Wall", surfaces["wall"], bump_path, 1.0, 0.5, (6, 4), tile_base=True)
    wall_mesh = card_mesh("Wall", 140, 80, 0, 0)
    wall_obj = link(bpy.data.objects.new("Wall", wall_mesh))
    wall_obj.location = to_blender((0, 0, board["wallZ"]))
    wall_obj.data.materials.append(wall)


def build_evidence(scene_data, textures_dir, bump_path):
    pin_materials = {}
    objects = {}
    collection = bpy.data.collections.new("Evidence")
    bpy.context.scene.collection.children.link(collection)
    for item in scene_data["evidence"]:
        holder = link(bpy.data.objects.new(item["id"], None), collection)
        holder.location = to_blender(item["position"])
        holder.rotation_euler = (0, -math.radians(item["rotation"]), 0)
        material = textured_material(
            f"Evidence {item['id']}",
            os.path.join(textures_dir, item["texture"]),
            bump_path,
            item["roughness"],
            item["bump"],
        )
        mesh = card_mesh(item["id"], item["width"], item["height"], item["lift"], item["curl"])
        card = link(bpy.data.objects.new(f"{item['id']} card", mesh), collection)
        card.data.materials.append(material)
        card.parent = holder
        for pin in item["pins"]:
            add_pin(holder, pin, item["pinColor"], pin_materials)
        objects[item["id"]] = {"holder": holder, "card": card, "data": item}
    return objects


def station_frame(index):
    return 1 + index * (HOLD_FRAMES + MOVE_FRAMES)


def build_threads(scene_data):
    materials = {}
    for index, thread in enumerate(scene_data["threads"]):
        points = thread["points"]
        curve = bpy.data.curves.new(f"Thread {index}", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = scene_data["threadRadius"]
        curve.bevel_resolution = 2
        spline = curve.splines.new("POLY")
        spline.points.add(len(points) - 1)
        for i, point in enumerate(points):
            spline.points[i].co = (*to_blender(point), 1)
        color = thread["color"]
        material = materials.setdefault(color, solid_material(f"Thread {color}", color, roughness=0.65, emission=0.25))
        curve.materials.append(material)
        link(bpy.data.objects.new(f"Thread {index}", curve))


def build_reveal(scene_data, objects, textures_dir, bump_path):
    reveal = scene_data.get("reveal")
    if not reveal:
        return
    target = objects[reveal["evidenceId"]]
    item, card = target["data"], target["card"]
    width, height = item["width"], item["height"]
    back_material = textured_material("Mugshot revealed", os.path.join(textures_dir, reveal["back"]), bump_path, item["roughness"], item["bump"])
    back = link(bpy.data.objects.new("mugshot back", card_mesh("mugshot back", width, height, 0, 0)))
    back.data.materials.append(back_material)
    back.parent = card
    back.rotation_euler = (0, 0, math.pi)
    back.location = to_blender((0, 0, -0.004))

    final = station_frame(len(scene_data["stations"]) - 1)
    card.keyframe_insert("rotation_euler", frame=final)
    card.keyframe_insert("location", frame=final)
    card.rotation_euler = (0, 0, math.pi)
    card.keyframe_insert("rotation_euler", frame=final + FLIP_FRAMES)
    card.location = to_blender((0, 0, 0.9))
    card.keyframe_insert("location", frame=final + FLIP_FRAMES // 2)
    card.location = (0, 0, 0)
    card.keyframe_insert("location", frame=final + FLIP_FRAMES)

    stamp = reveal["stamp"]
    stamp_material = textured_material("Stamp", os.path.join(textures_dir, stamp["texture"]), bump_path, 0.9, 0.2)
    stamp_width = width * stamp["widthRatio"]
    stamp_obj = link(bpy.data.objects.new("Stamp", card_mesh("Stamp", stamp_width, stamp_width * stamp["aspect"], 0, 0)))
    stamp_obj.data.materials.append(stamp_material)
    stamp_obj.parent = target["holder"]
    stamp_obj.location = to_blender((0, height * stamp["offsetY"], stamp["lift"]))
    stamp_obj.rotation_euler = (0, -stamp["rotation"], 0)
    stamp_obj.scale = (0, 0, 0)
    stamp_obj.keyframe_insert("scale", frame=final + FLIP_FRAMES + 4)
    stamp_obj.scale = (1.6, 1.6, 1.6)
    stamp_obj.keyframe_insert("scale", frame=final + FLIP_FRAMES + 5)
    stamp_obj.scale = (1, 1, 1)
    stamp_obj.keyframe_insert("scale", frame=final + FLIP_FRAMES + 10)


def lamp_energy(reach, haze, distance_ratio):
    distance_falloff = (reach / REFERENCE_DISTANCE) ** 2
    light_and_view_path = 1 + distance_ratio
    haze_extinction = math.exp(haze * light_and_view_path * (reach - REFERENCE_DISTANCE))
    return LAMP_POWER * distance_falloff * haze_extinction


def build_camera_and_lamp(scene_data, scene, haze):
    camera_data = bpy.data.cameras.new("Investigator")
    camera_data.sensor_fit = "VERTICAL"
    camera_data.sensor_height = 24
    camera_data.lens = 12 / math.tan(math.radians(scene_data["camera"]["fovDegrees"]) / 2)
    camera_data.clip_end = 300
    camera = link(bpy.data.objects.new("Investigator", camera_data))
    scene.camera = camera

    focus = link(bpy.data.objects.new("Focus", None))
    camera_data.dof.use_dof = True
    camera_data.dof.focus_object = focus
    camera_data.dof.aperture_fstop = 2.8
    track = camera.constraints.new("TRACK_TO")
    track.target = focus
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    lamp = scene_data["lamp"]
    light_data = bpy.data.lights.new("Desk lamp", "SPOT")
    light_data.color = hex_color(LAMP_TINT)[:3]
    light_data.spot_size = lamp["angle"] * 2 * LAMP_CONE_RATIO
    light_data.spot_blend = 1.0
    light_data.shadow_soft_size = 0.35
    light = link(bpy.data.objects.new("Desk lamp", light_data))
    aim = light.constraints.new("TRACK_TO")
    aim.target = focus
    aim.track_axis = "TRACK_NEGATIVE_Z"
    aim.up_axis = "UP_Y"
    direction = lamp["direction"]
    norm = math.sqrt(sum(c * c for c in direction))
    direction = [c / norm for c in direction]

    fill_data = bpy.data.lights.new("Fill", "AREA")
    fill_data.energy = 60
    fill_data.size = 30
    fill_data.color = hex_color("#3c4a66")[:3]
    fill = link(bpy.data.objects.new("Fill", fill_data))
    fill.location = to_blender((0, 0, 30))
    fill.rotation_euler = (math.pi / 2, 0, 0)

    for index, station in enumerate(scene_data["stations"]):
        arrive = station_frame(index)
        target = station["target"]
        position = station["position"]
        reach = math.dist(position, target)
        for frame in (arrive, arrive + HOLD_FRAMES):
            camera.location = to_blender(position)
            camera.keyframe_insert("location", frame=frame)
            focus.location = to_blender(target)
            focus.keyframe_insert("location", frame=frame)
            light.location = to_blender([t + d * reach * lamp["distanceRatio"] for t, d in zip(target, direction)])
            light.keyframe_insert("location", frame=frame)
            light_data.energy = lamp_energy(reach, haze, lamp["distanceRatio"])
            light_data.keyframe_insert("energy", frame=frame)
        marker = scene.timeline_markers.new(station["id"], frame=arrive + HOLD_FRAMES // 2)
        marker.camera = camera

    scene.frame_start = 1
    scene.frame_end = station_frame(len(scene_data["stations"]) - 1) + HOLD_FRAMES + FLIP_FRAMES + 24
    return camera


def build_world(scene, haze):
    world = bpy.data.worlds.new("Night")
    scene.world = world
    if hasattr(world, "use_nodes") and not world.use_nodes:
        world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = hex_color("#0a0806")
    background.inputs["Strength"].default_value = 0.3
    if haze <= 0:
        return
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -22, 0))
    volume = bpy.context.active_object
    volume.name = "Haze"
    volume.scale = (70, 43, 40)
    material, nodes, links = node_material("Haze")
    for node in list(nodes):
        nodes.remove(node)
    output = nodes.new("ShaderNodeOutputMaterial")
    scatter = nodes.new("ShaderNodeVolumePrincipled")
    scatter.inputs["Density"].default_value = haze
    scatter.inputs["Anisotropy"].default_value = 0.55
    links.new(scatter.outputs["Volume"], output.inputs["Volume"])
    volume.data.materials.append(material)


def configure_render(scene, args):
    if args.engine == "EEVEE":
        engines = [item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
        scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
    else:
        scene.render.engine = "CYCLES"
        scene.cycles.samples = args.samples
        scene.cycles.use_denoising = True
        scene.cycles.device = "CPU"
        scene.cycles.volume_step_rate = 4
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = args.resolution
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    scene.view_settings.exposure = 0.3


def render(scene, args, out_dir, stations):
    renders = os.path.join(out_dir, "renders")
    os.makedirs(renders, exist_ok=True)
    if args.render == "animation":
        scene.render.image_settings.file_format = "FFMPEG"
        scene.render.ffmpeg.format = "MPEG4"
        scene.render.ffmpeg.codec = "H264"
        scene.render.filepath = os.path.join(renders, "investigation.mp4")
        bpy.ops.render.render(animation=True)
        return
    if args.render != "stills":
        return
    wanted = set(filter(None, args.stills.split(",")))
    scene.render.image_settings.file_format = "PNG"
    for index, station in enumerate(stations):
        if wanted and station["id"] not in wanted:
            continue
        frame = station_frame(index) + HOLD_FRAMES // 2
        if index == len(stations) - 1:
            frame += FLIP_FRAMES + 12
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(renders, f"{index:02d}-{station['id']}.png")
        bpy.ops.render.render(write_still=True)
        print(f"Rendered {station['id']}", flush=True)


def main():
    args = parse_args()
    assets = os.path.abspath(args.assets)
    textures = os.path.join(assets, "textures")
    with open(os.path.join(assets, "scene.json"), encoding="utf-8") as handle:
        scene_data = json.load(handle)

    scene = reset_scene()
    surfaces = {key: os.path.join(textures, name) for key, name in scene_data["surfaces"].items()}
    bump = surfaces["paperBump"]
    build_world(scene, args.haze)
    build_board(scene_data, surfaces, bump)
    objects = build_evidence(scene_data, textures, bump)
    build_threads(scene_data)
    build_reveal(scene_data, objects, textures, bump)
    build_camera_and_lamp(scene_data, scene, args.haze)
    configure_render(scene, args)

    bpy.context.preferences.filepaths.save_version = 0
    blend_path = os.path.join(assets, "case-404.blend")
    if args.pack:
        bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, relative_remap=True)
    print(f"Saved {blend_path}", flush=True)
    render(scene, args, assets, scene_data["stations"])


if __name__ == "__main__":
    main()
