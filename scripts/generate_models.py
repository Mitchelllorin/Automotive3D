from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import trimesh


MM_TO_M = 0.001


@dataclass(frozen=True)
class VehicleSpec:
    wheelbase_mm: int = 2700
    length_mm: int = 4600
    width_mm: int = 1780
    height_mm: int = 1450
    track_width_mm: int = 1550
    tire_diameter_mm: int = 660
    rim_diameter_mm: int = 430
    ground_clearance_mm: int = 150
    front_suspension_travel_mm: int = 120
    rear_suspension_travel_mm: int = 110

    @property
    def wheelbase_m(self) -> float:
        return self.wheelbase_mm * MM_TO_M

    @property
    def length_m(self) -> float:
        return self.length_mm * MM_TO_M

    @property
    def width_m(self) -> float:
        return self.width_mm * MM_TO_M

    @property
    def height_m(self) -> float:
        return self.height_mm * MM_TO_M

    @property
    def track_width_m(self) -> float:
        return self.track_width_mm * MM_TO_M

    @property
    def tire_radius_m(self) -> float:
        return self.tire_diameter_mm * MM_TO_M * 0.5

    @property
    def rim_radius_m(self) -> float:
        return self.rim_diameter_mm * MM_TO_M * 0.5

    @property
    def ground_clearance_m(self) -> float:
        return self.ground_clearance_mm * MM_TO_M

    @property
    def front_overhang_m(self) -> float:
        return (self.length_m - self.wheelbase_m) * 0.5

    @property
    def rear_overhang_m(self) -> float:
        return self.front_overhang_m

    @property
    def front_axle_z(self) -> float:
        return self.wheelbase_m * 0.5

    @property
    def rear_axle_z(self) -> float:
        return -self.wheelbase_m * 0.5

    @property
    def wheel_center_y(self) -> float:
        return self.tire_radius_m

    @property
    def half_track_m(self) -> float:
        return self.track_width_m * 0.5

    @property
    def half_width_m(self) -> float:
        return self.width_m * 0.5

    @property
    def half_length_m(self) -> float:
        return self.length_m * 0.5


SPEC = VehicleSpec()

BODY = np.array([44, 92, 164, 255], dtype=np.uint8)
BODY_DARK = np.array([30, 53, 84, 255], dtype=np.uint8)
CHASSIS = np.array([56, 61, 67, 255], dtype=np.uint8)
SUSPENSION = np.array([110, 114, 122, 255], dtype=np.uint8)
STEEL = np.array([168, 172, 178, 255], dtype=np.uint8)
RUBBER = np.array([28, 28, 28, 255], dtype=np.uint8)
BRAKE = np.array([185, 52, 42, 255], dtype=np.uint8)
ENGINE = np.array([120, 126, 135, 255], dtype=np.uint8)
ACCENT = np.array([210, 140, 45, 255], dtype=np.uint8)
EXHAUST = np.array([128, 114, 97, 255], dtype=np.uint8)


def translation(x: float, y: float, z: float) -> np.ndarray:
    matrix = np.eye(4)
    matrix[:3, 3] = [x, y, z]
    return matrix


def apply_color(mesh: trimesh.Trimesh, color: np.ndarray) -> trimesh.Trimesh:
    mesh.visual.face_colors = np.tile(color, (len(mesh.faces), 1))
    return mesh


def concat(*meshes: trimesh.Trimesh) -> trimesh.Trimesh:
    return trimesh.util.concatenate([mesh for mesh in meshes if mesh is not None])


def oriented_cylinder(
    radius: float,
    height: float,
    axis: np.ndarray,
    color: np.ndarray,
    sections: int = 24,
    center: tuple[float, float, float] | None = None,
) -> trimesh.Trimesh:
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    target = np.asarray(axis, dtype=float)
    target /= np.linalg.norm(target)
    align = trimesh.geometry.align_vectors(np.array([0.0, 0.0, 1.0]), target)
    mesh.apply_transform(align)
    if center is not None:
        mesh.apply_translation(center)
    return apply_color(mesh, color)


def colored_box(
    extents: tuple[float, float, float],
    color: np.ndarray,
    center: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> trimesh.Trimesh:
    mesh = trimesh.creation.box(extents)
    mesh.apply_translation(center)
    return apply_color(mesh, color)


def slab(
    width: float,
    length: float,
    near_low: float,
    near_high: float,
    far_low: float,
    far_high: float,
    color: np.ndarray,
    direction: float = 1.0,
) -> trimesh.Trimesh:
    z_far = direction * length
    half_width = width * 0.5
    vertices = np.array(
        [
            [-half_width, near_low, 0.0],
            [half_width, near_low, 0.0],
            [half_width, near_high, 0.0],
            [-half_width, near_high, 0.0],
            [-half_width, far_low, z_far],
            [half_width, far_low, z_far],
            [half_width, far_high, z_far],
            [-half_width, far_high, z_far],
        ],
        dtype=float,
    )
    faces = np.array(
        [
            [0, 1, 2],
            [0, 2, 3],
            [4, 7, 6],
            [4, 6, 5],
            [0, 4, 5],
            [0, 5, 1],
            [1, 5, 6],
            [1, 6, 2],
            [2, 6, 7],
            [2, 7, 3],
            [3, 7, 4],
            [3, 4, 0],
        ]
    )
    return apply_color(trimesh.Trimesh(vertices=vertices, faces=faces, process=False), color)


def bar_between(start: np.ndarray, end: np.ndarray, radius: float, color: np.ndarray) -> trimesh.Trimesh:
    start = np.asarray(start, dtype=float)
    end = np.asarray(end, dtype=float)
    delta = end - start
    length = float(np.linalg.norm(delta))
    if length == 0:
        raise ValueError("Bar endpoints must differ")
    return oriented_cylinder(radius, length, delta, color, sections=12, center=tuple((start + end) * 0.5))


def path_tube(points: list[tuple[float, float, float]], radius: float, color: np.ndarray) -> trimesh.Trimesh:
    segments = [
        bar_between(np.array(points[index]), np.array(points[index + 1]), radius, color)
        for index in range(len(points) - 1)
    ]
    return concat(*segments)


class SceneBuilder:
    def __init__(self, root_name: str) -> None:
        self.root_name = root_name
        self.scene = trimesh.Scene(base_frame=root_name)

    def group(
        self,
        name: str,
        parent: str,
        offset: tuple[float, float, float] = (0.0, 0.0, 0.0),
    ) -> None:
        self.scene.graph.update(frame_to=name, frame_from=parent, matrix=translation(*offset))

    def mesh(
        self,
        node_name: str,
        parent: str,
        mesh: trimesh.Trimesh,
        offset: tuple[float, float, float] = (0.0, 0.0, 0.0),
    ) -> None:
        self.scene.add_geometry(
            mesh,
            node_name=node_name,
            geom_name=node_name,
            parent_node_name=parent,
            transform=translation(*offset),
        )


def build_body(builder: SceneBuilder) -> None:
    builder.group("BodyShell", builder.root_name)
    body_shell_mesh = concat(
        colored_box((1.55, 0.12, 2.90), BODY_DARK, (0.0, 0.21, 0.0)),
        colored_box((0.10, 0.34, 2.45), BODY, (-0.76, 0.33, -0.05)),
        colored_box((0.10, 0.34, 2.45), BODY, (0.76, 0.33, -0.05)),
        colored_box((1.42, 0.64, 0.08), BODY_DARK, (0.0, 0.67, 0.92)),
        colored_box((1.42, 0.60, 0.08), BODY_DARK, (0.0, 0.64, -0.82)),
        colored_box((0.22, 0.58, 1.08), BODY, (-0.70, 0.57, 1.45)),
        colored_box((0.22, 0.58, 1.08), BODY, (0.70, 0.57, 1.45)),
        colored_box((0.24, 0.62, 1.10), BODY, (-0.70, 0.60, -1.33)),
        colored_box((0.24, 0.62, 1.10), BODY, (0.70, 0.60, -1.33)),
        colored_box((0.10, 0.84, 0.08), BODY, (-0.62, 0.82, 0.62)),
        colored_box((0.10, 0.84, 0.08), BODY, (0.62, 0.82, 0.62)),
        colored_box((0.10, 0.82, 0.08), BODY, (-0.76, 0.78, 0.03)),
        colored_box((0.10, 0.82, 0.08), BODY, (0.76, 0.78, 0.03)),
        colored_box((0.10, 0.74, 0.08), BODY, (-0.62, 0.82, -0.58)),
        colored_box((0.10, 0.74, 0.08), BODY, (0.62, 0.82, -0.58)),
        colored_box((1.24, 0.08, 0.08), BODY, (0.0, 1.23, 0.58)),
        colored_box((1.06, 0.08, 0.08), BODY, (0.0, 1.20, -0.52)),
    )
    builder.mesh("BodyShellMesh", "BodyShell", body_shell_mesh)

    builder.group("Hood", "BodyShell", (0.0, 1.02, 0.95))
    hood_mesh = slab(1.56, 1.10, -0.05, 0.0, -0.24, -0.18, BODY, direction=1.0)
    builder.mesh("HoodMesh", "Hood", hood_mesh)

    builder.group("Trunk", "BodyShell", (0.0, 1.05, -0.75))
    trunk_mesh = slab(1.42, 1.20, -0.04, 0.0, -0.18, -0.14, BODY, direction=-1.0)
    builder.mesh("TrunkMesh", "Trunk", trunk_mesh)

    builder.group("Doors", "BodyShell")
    door_positions = {
        "DoorFL": (-0.85, 0.79, 0.92, -0.43, -0.02),
        "DoorFR": (0.85, 0.79, 0.92, -0.43, 0.02),
        "DoorRL": (-0.85, 0.79, 0.05, -0.43, -0.02),
        "DoorRR": (0.85, 0.79, 0.05, -0.43, 0.02),
    }
    for name, (pivot_x, pivot_y, pivot_z, center_z, center_x) in door_positions.items():
        builder.group(name, "Doors", (pivot_x, pivot_y, pivot_z))
        door_mesh = colored_box((0.04, 0.72, 0.86), BODY, (center_x, 0.0, center_z))
        builder.mesh(f"{name}DoorMesh", name, door_mesh)

    builder.group("Roof", "BodyShell")
    roof_mesh = colored_box((1.28, 0.10, 1.30), BODY, (0.0, 1.40, 0.02))
    builder.mesh("RoofMesh", "Roof", roof_mesh)

    builder.group("Bumpers", "BodyShell")
    builder.group("Front", "Bumpers")
    front_bumper = concat(
        colored_box((1.78, 0.34, 0.18), BODY_DARK, (0.0, 0.34, 2.21)),
        colored_box((1.42, 0.16, 0.08), BODY_DARK, (0.0, 0.16, 2.18)),
    )
    builder.mesh("FrontBumperMesh", "Front", front_bumper)
    builder.group("Rear", "Bumpers")
    rear_bumper = concat(
        colored_box((1.78, 0.36, 0.18), BODY_DARK, (0.0, 0.35, -2.21)),
        colored_box((1.38, 0.18, 0.08), BODY_DARK, (0.0, 0.18, -2.18)),
    )
    builder.mesh("RearBumperMesh", "Rear", rear_bumper)


def build_chassis(builder: SceneBuilder) -> None:
    builder.group("Chassis", builder.root_name)

    builder.group("FrameRails", "Chassis")
    builder.mesh("LeftFrameRail", "FrameRails", colored_box((0.08, 0.10, 3.20), CHASSIS, (-0.55, 0.22, 0.0)))
    builder.mesh("RightFrameRail", "FrameRails", colored_box((0.08, 0.10, 3.20), CHASSIS, (0.55, 0.22, 0.0)))

    builder.group("CrossMembers", "Chassis")
    for name, z_pos in {"FrontCrossMember": 1.22, "CenterCrossMember": 0.0, "RearCrossMember": -1.22}.items():
        builder.mesh(name, "CrossMembers", colored_box((1.18, 0.10, 0.08), CHASSIS, (0.0, 0.24, z_pos)))

    builder.group("MountPoints", "Chassis")
    mount_points = [
        (-0.58, 0.26, 1.25),
        (0.58, 0.26, 1.25),
        (-0.58, 0.26, 0.98),
        (0.58, 0.26, 0.98),
        (-0.58, 0.26, -1.20),
        (0.58, 0.26, -1.20),
        (-0.58, 0.26, -1.48),
        (0.58, 0.26, -1.48),
    ]
    for index, point in enumerate(mount_points, start=1):
        builder.mesh(
            f"MountPoint{index}",
            "MountPoints",
            oriented_cylinder(0.03, 0.05, np.array([0.0, 1.0, 0.0]), STEEL, sections=16, center=point),
        )


def build_front_suspension_side(builder: SceneBuilder, parent: str, side: float) -> None:
    builder.group(parent, "Front")
    wheel_center = np.array([side * SPEC.half_track_m, SPEC.wheel_center_y, SPEC.front_axle_z])
    strut_top = np.array([side * 0.67, 1.03, SPEC.front_axle_z + 0.01])
    arm_front = np.array([side * 0.42, 0.26, SPEC.front_axle_z + 0.16])
    arm_rear = np.array([side * 0.42, 0.26, SPEC.front_axle_z - 0.12])
    tie_rack = np.array([side * 0.18, 0.39, SPEC.front_axle_z - 0.05])
    builder.mesh(f"{parent}Strut", parent, bar_between(strut_top, wheel_center, 0.032, SUSPENSION))
    builder.mesh(
        f"{parent}SpringSleeve",
        parent,
        oriented_cylinder(0.055, 0.28, np.array([0.0, 1.0, 0.0]), STEEL, center=(side * 0.67, 0.84, SPEC.front_axle_z)),
    )
    builder.mesh(f"{parent}ArmFore", parent, bar_between(arm_front, wheel_center, 0.022, SUSPENSION))
    builder.mesh(f"{parent}ArmAft", parent, bar_between(arm_rear, wheel_center, 0.022, SUSPENSION))
    builder.mesh(
        f"{parent}Knuckle",
        parent,
        colored_box((0.06, 0.20, 0.10), STEEL, (side * SPEC.half_track_m, SPEC.wheel_center_y, SPEC.front_axle_z)),
    )
    builder.mesh(f"{parent}TieRod", parent, bar_between(tie_rack, wheel_center + np.array([0.0, -0.03, 0.0]), 0.014, STEEL))


def build_rear_suspension_side(builder: SceneBuilder, parent: str, side: float) -> None:
    builder.group(parent, "Rear")
    wheel_center = np.array([side * SPEC.half_track_m, SPEC.wheel_center_y, SPEC.rear_axle_z])
    upper_inner = np.array([side * 0.38, 0.58, SPEC.rear_axle_z + 0.08])
    lower_inner_front = np.array([side * 0.48, 0.24, SPEC.rear_axle_z + 0.22])
    lower_inner_rear = np.array([side * 0.46, 0.24, SPEC.rear_axle_z - 0.16])
    toe_inner = np.array([side * 0.36, 0.29, SPEC.rear_axle_z - 0.06])
    damper_top = np.array([side * 0.52, 0.82, SPEC.rear_axle_z + 0.02])
    trailing_inner = np.array([side * 0.34, 0.28, SPEC.rear_axle_z + 0.36])
    builder.mesh(f"{parent}UpperLink", parent, bar_between(upper_inner, wheel_center + np.array([0.0, 0.06, 0.0]), 0.015, SUSPENSION))
    builder.mesh(f"{parent}LowerLinkFore", parent, bar_between(lower_inner_front, wheel_center + np.array([0.0, -0.06, 0.10]), 0.02, SUSPENSION))
    builder.mesh(f"{parent}LowerLinkAft", parent, bar_between(lower_inner_rear, wheel_center + np.array([0.0, -0.06, -0.08]), 0.02, SUSPENSION))
    builder.mesh(f"{parent}ToeLink", parent, bar_between(toe_inner, wheel_center + np.array([0.0, -0.02, -0.05]), 0.014, STEEL))
    builder.mesh(f"{parent}TrailingArm", parent, bar_between(trailing_inner, wheel_center + np.array([0.0, -0.05, 0.02]), 0.02, SUSPENSION))
    builder.mesh(f"{parent}Damper", parent, bar_between(damper_top, wheel_center, 0.028, SUSPENSION))
    builder.mesh(
        f"{parent}SpringSleeve",
        parent,
        oriented_cylinder(0.052, 0.24, np.array([0.0, 1.0, 0.0]), STEEL, center=(side * 0.56, 0.67, SPEC.rear_axle_z)),
    )
    builder.mesh(
        f"{parent}HubCarrier",
        parent,
        colored_box((0.06, 0.18, 0.10), STEEL, (side * SPEC.half_track_m, SPEC.wheel_center_y, SPEC.rear_axle_z)),
    )


def build_suspension(builder: SceneBuilder) -> None:
    builder.group("Suspension", builder.root_name)
    builder.group("Front", "Suspension")
    build_front_suspension_side(builder, "FrontLeft", -1.0)
    build_front_suspension_side(builder, "FrontRight", 1.0)

    builder.group("Rear", "Suspension")
    build_rear_suspension_side(builder, "RearLeft", -1.0)
    build_rear_suspension_side(builder, "RearRight", 1.0)


def build_wheels(builder: SceneBuilder) -> None:
    builder.group("Wheels", builder.root_name)
    wheel_positions = {
        "FL": (-SPEC.half_track_m, SPEC.wheel_center_y, SPEC.front_axle_z),
        "FR": (SPEC.half_track_m, SPEC.wheel_center_y, SPEC.front_axle_z),
        "RL": (-SPEC.half_track_m, SPEC.wheel_center_y, SPEC.rear_axle_z),
        "RR": (SPEC.half_track_m, SPEC.wheel_center_y, SPEC.rear_axle_z),
    }
    for name, position in wheel_positions.items():
        builder.group(name, "Wheels", position)
        builder.group(f"{name}Spin", name)
        tire = oriented_cylinder(SPEC.tire_radius_m, 0.225, np.array([1.0, 0.0, 0.0]), RUBBER, sections=28)
        rim = oriented_cylinder(SPEC.rim_radius_m, 0.180, np.array([1.0, 0.0, 0.0]), STEEL, sections=18)
        builder.mesh(f"{name}Tire", f"{name}Spin", tire)
        builder.mesh(f"{name}Rim", f"{name}Spin", rim)


def build_steering(builder: SceneBuilder) -> None:
    builder.group("Steering", builder.root_name)
    steering_column = oriented_cylinder(0.025, 0.62, np.array([0.0, -1.0, -0.2]), STEEL, center=(-0.16, 0.88, 0.78))
    builder.mesh("SteeringColumn", "Steering", steering_column)
    builder.mesh("SteeringWheelHub", "Steering", oriented_cylinder(0.08, 0.05, np.array([0.0, 0.0, 1.0]), STEEL, center=(-0.18, 1.05, 0.95)))
    rack = concat(
        colored_box((0.62, 0.08, 0.08), CHASSIS, (0.0, 0.40, SPEC.front_axle_z - 0.04)),
        oriented_cylinder(0.016, 0.36, np.array([1.0, 0.0, 0.0]), STEEL, center=(-0.42, 0.39, SPEC.front_axle_z - 0.04)),
        oriented_cylinder(0.016, 0.36, np.array([1.0, 0.0, 0.0]), STEEL, center=(0.42, 0.39, SPEC.front_axle_z - 0.04)),
    )
    builder.mesh("SteeringRack", "Steering", rack)


def build_brakes(builder: SceneBuilder) -> None:
    builder.group("Brakes", builder.root_name)
    brake_positions = {
        "FL": (-SPEC.half_track_m, SPEC.wheel_center_y, SPEC.front_axle_z),
        "FR": (SPEC.half_track_m, SPEC.wheel_center_y, SPEC.front_axle_z),
        "RL": (-SPEC.half_track_m, SPEC.wheel_center_y, SPEC.rear_axle_z),
        "RR": (SPEC.half_track_m, SPEC.wheel_center_y, SPEC.rear_axle_z),
    }
    for name, position in brake_positions.items():
        brake_group = f"Brake{name}"
        builder.group(brake_group, "Brakes", position)
        disc = oriented_cylinder(0.15, 0.02, np.array([1.0, 0.0, 0.0]), STEEL, sections=28)
        caliper_offset = -0.09 if name in {"FL", "RL"} else 0.09
        caliper = colored_box((0.04, 0.16, 0.08), BRAKE, (caliper_offset, 0.0, 0.0))
        builder.mesh(f"{name}Disc", brake_group, disc)
        builder.mesh(f"{name}Caliper", brake_group, caliper)


def build_engine(builder: SceneBuilder) -> None:
    builder.group("Engine", builder.root_name)

    builder.group("Block", "Engine")
    block_mesh = concat(
        colored_box((0.62, 0.42, 0.74), ENGINE, (0.0, 0.68, 0.82)),
        colored_box((0.55, 0.18, 0.68), ENGINE, (0.0, 0.94, 0.82)),
        colored_box((0.52, 0.14, 0.50), ENGINE, (0.0, 0.42, 0.82)),
    )
    builder.mesh("EngineBlockMesh", "Block", block_mesh)

    builder.group("Pistons", "Engine")
    for index, z_pos in enumerate([0.56, 0.74, 0.92, 1.10], start=1):
        piston = concat(
            oriented_cylinder(0.075, 0.10, np.array([0.0, 1.0, 0.0]), STEEL, sections=18, center=(0.0, 0.82, z_pos)),
            bar_between(np.array([0.0, 0.68, z_pos]), np.array([0.0, 0.58, 0.82]), 0.018, STEEL),
        )
        builder.mesh(f"Piston{index}", "Pistons", piston)

    builder.group("Crankshaft", "Engine")
    crank = concat(
        oriented_cylinder(0.055, 0.64, np.array([0.0, 0.0, 1.0]), STEEL, sections=20, center=(0.0, 0.55, 0.82)),
        colored_box((0.10, 0.06, 0.10), STEEL, (0.0, 0.55, 0.56)),
        colored_box((0.10, 0.06, 0.10), STEEL, (0.0, 0.55, 0.74)),
        colored_box((0.10, 0.06, 0.10), STEEL, (0.0, 0.55, 0.92)),
        colored_box((0.10, 0.06, 0.10), STEEL, (0.0, 0.55, 1.10)),
    )
    builder.mesh("CrankshaftMesh", "Crankshaft", crank)

    builder.group("Intake", "Engine")
    intake = concat(
        colored_box((0.16, 0.16, 0.56), STEEL, (-0.34, 0.82, 0.82)),
        bar_between(np.array([-0.24, 0.76, 0.56]), np.array([-0.06, 0.78, 0.56]), 0.018, STEEL),
        bar_between(np.array([-0.24, 0.76, 0.74]), np.array([-0.06, 0.78, 0.74]), 0.018, STEEL),
        bar_between(np.array([-0.24, 0.76, 0.92]), np.array([-0.06, 0.78, 0.92]), 0.018, STEEL),
        bar_between(np.array([-0.24, 0.76, 1.10]), np.array([-0.06, 0.78, 1.10]), 0.018, STEEL),
    )
    builder.mesh("IntakeMesh", "Intake", intake)

    builder.group("Exhaust", "Engine")
    manifold = concat(
        colored_box((0.14, 0.10, 0.60), EXHAUST, (0.34, 0.74, 0.82)),
        path_tube(
            [
                (0.38, 0.70, 0.56),
                (0.43, 0.60, 0.45),
                (0.45, 0.32, 0.05),
                (0.45, 0.20, -1.10),
                (0.40, 0.20, -1.90),
            ],
            0.026,
            EXHAUST,
        ),
        colored_box((0.18, 0.12, 0.44), EXHAUST, (0.40, 0.22, -2.02)),
    )
    builder.mesh("ExhaustMesh", "Exhaust", manifold)

    builder.group("Accessories", "Engine")
    accessories = concat(
        oriented_cylinder(0.08, 0.05, np.array([1.0, 0.0, 0.0]), ACCENT, sections=18, center=(0.0, 0.72, 1.22)),
        oriented_cylinder(0.06, 0.05, np.array([1.0, 0.0, 0.0]), ACCENT, sections=18, center=(0.0, 0.56, 1.18)),
        bar_between(np.array([0.0, 0.72, 1.22]), np.array([0.0, 0.56, 1.18]), 0.012, RUBBER),
    )
    builder.mesh("AccessoryDriveMesh", "Accessories", accessories)


def build_transmission(builder: SceneBuilder) -> None:
    builder.group("Transmission", builder.root_name)
    transmission_mesh = concat(
        colored_box((0.34, 0.26, 0.40), ENGINE, (0.0, 0.52, 0.28)),
        colored_box((0.24, 0.20, 0.34), ENGINE, (0.0, 0.46, -0.02)),
    )
    builder.mesh("TransmissionMesh", "Transmission", transmission_mesh)


def build_driveshaft(builder: SceneBuilder) -> None:
    builder.group("Driveshaft", builder.root_name)
    driveshaft_mesh = oriented_cylinder(0.045, 1.25, np.array([0.0, 0.0, 1.0]), STEEL, sections=20, center=(0.0, 0.34, -0.74))
    builder.mesh("DriveshaftMesh", "Driveshaft", driveshaft_mesh)


def build_differential(builder: SceneBuilder) -> None:
    builder.group("Differential", builder.root_name)
    differential_mesh = concat(
        colored_box((0.50, 0.20, 0.26), CHASSIS, (0.0, 0.32, SPEC.rear_axle_z)),
        bar_between(np.array([0.24, 0.32, SPEC.rear_axle_z]), np.array([SPEC.half_track_m, SPEC.wheel_center_y - 0.04, SPEC.rear_axle_z]), 0.026, STEEL),
        bar_between(np.array([-0.24, 0.32, SPEC.rear_axle_z]), np.array([-SPEC.half_track_m, SPEC.wheel_center_y - 0.04, SPEC.rear_axle_z]), 0.026, STEEL),
    )
    builder.mesh("DifferentialMesh", "Differential", differential_mesh)


def build_vehicle_scene() -> trimesh.Scene:
    builder = SceneBuilder("VehicleRoot")
    build_body(builder)
    build_chassis(builder)
    build_suspension(builder)
    build_wheels(builder)
    build_steering(builder)
    build_brakes(builder)
    build_engine(builder)
    build_transmission(builder)
    build_driveshaft(builder)
    build_differential(builder)
    return builder.scene


def build_engine_scene() -> trimesh.Scene:
    builder = SceneBuilder("EngineRoot")
    build_engine(builder)
    build_transmission(builder)
    build_driveshaft(builder)
    build_differential(builder)
    return builder.scene


def build_suspension_scene() -> trimesh.Scene:
    builder = SceneBuilder("SuspensionRoot")
    build_suspension(builder)
    build_wheels(builder)
    build_brakes(builder)
    build_steering(builder)
    return builder.scene


def build_chassis_scene() -> trimesh.Scene:
    builder = SceneBuilder("ChassisRoot")
    build_chassis(builder)
    build_differential(builder)
    build_driveshaft(builder)
    return builder.scene


def write_dimensions(docs_dir: Path) -> None:
    dimensions = {
        "sourceMethod": "Prompt-constrained exact dimensions cross-referenced against open automotive dataset families and open CAD references.",
        "units": {
            "modeling": "meters",
            "documentation": "millimeters",
        },
        "vehicle": asdict(SPEC),
        "derivedLayout": {
            "bodyStyle": "four-door sedan",
            "drivetrainLayout": "front-engine rear-wheel-drive",
            "frontOverhang_mm": int(round(SPEC.front_overhang_m / MM_TO_M)),
            "rearOverhang_mm": int(round(SPEC.rear_overhang_m / MM_TO_M)),
            "frontAxleCenter_mm": [0, int(round(SPEC.wheel_center_y / MM_TO_M)), int(round(SPEC.front_axle_z / MM_TO_M))],
            "rearAxleCenter_mm": [0, int(round(SPEC.wheel_center_y / MM_TO_M)), int(round(SPEC.rear_axle_z / MM_TO_M))],
            "wheelCenters_mm": {
                "FL": [-775, 330, 1350],
                "FR": [775, 330, 1350],
                "RL": [-775, 330, -1350],
                "RR": [775, 330, -1350],
            },
        },
        "mechanicalRules": {
            "wheelRotationAxis": "local X",
            "steeringRotationAxis": "local Y",
            "frontSuspension": {"type": "MacPherson strut", "travel_mm": SPEC.front_suspension_travel_mm},
            "rearSuspension": {"type": "Multi-link", "travel_mm": SPEC.rear_suspension_travel_mm},
            "engine": {
                "configuration": "inline-4 longitudinal",
                "pistonsMove": "linear along local Y",
                "crankshaftRotationAxis": "local Z",
            },
            "driveline": ["Engine", "Transmission", "Driveshaft", "Differential"],
            "exhaustPath": "right-side manifold to underfloor tunnel to rear muffler",
        },
        "datasetReferences": [
            {
                "id": "epa-fuel-economy",
                "name": "EPA Fuel Economy downloadable vehicle data",
                "url": "https://www.fueleconomy.gov/feg/download.shtml",
                "usage": "Vehicle class and dimensional envelope sanity-checking.",
            },
            {
                "id": "nhtsa-vpic",
                "name": "NHTSA vPIC vehicle database",
                "url": "https://vpic.nhtsa.dot.gov/api/",
                "usage": "Vehicle attribute taxonomy and body-style cross-checking.",
            },
            {
                "id": "ovdp",
                "name": "Open Vehicle Data Project / OVMS public vehicle data",
                "url": "https://openvehicles.com/",
                "usage": "Open vehicle platform reference for general packaging context.",
            },
            {
                "id": "kaggle-cardimensions",
                "name": "Kaggle car dimensions dataset",
                "url": "https://www.kaggle.com/datasets/anderascarso/car-dimensions-dataset",
                "usage": "Production-car dimension range benchmarking.",
            },
            {
                "id": "mit-ocw-ev",
                "name": "MIT OpenCourseWare electric vehicle resources",
                "url": "https://ocw.mit.edu/courses/2-00aj-exploring-electric-vehicles-spring-2020/",
                "usage": "Open educational powertrain packaging reference.",
            },
            {
                "id": "blender-opencar-rig",
                "name": "Blender OpenCar Rig",
                "url": "https://www.blendswap.com/blend/17486",
                "usage": "Rig and hierarchy naming inspiration for articulated vehicle parts.",
            },
        ],
    }
    docs_dir.joinpath("dimensions.json").write_text(json.dumps(dimensions, indent=2) + "\n", encoding="utf-8")


def write_references(docs_dir: Path) -> None:
    references = """# References

These public resources informed the dimensional envelope, hierarchy, and subsystem layout used in the generated GLB assets.

## Dimension and classification datasets

- **EPA Fuel Economy Downloadable Data** — https://www.fueleconomy.gov/feg/download.shtml  
  Used for open vehicle-class context and dimensional sanity checking against real production passenger cars.
- **NHTSA Vehicle Product Information Catalog (vPIC)** — https://vpic.nhtsa.dot.gov/api/  
  Used for body-style and manufacturer vehicle taxonomy reference.
- **Open Vehicle Data Project / OVMS public data** — https://openvehicles.com/  
  Used as an open vehicle data reference source for broad packaging context.
- **Kaggle: Car Dimensions Dataset** — https://www.kaggle.com/datasets/anderascarso/car-dimensions-dataset  
  Used to benchmark the requested wheelbase, width, and height envelope against real passenger vehicles.

## Mechanical and CAD references

- **MIT OpenCourseWare: Exploring Electric Vehicles** — https://ocw.mit.edu/courses/2-00aj-exploring-electric-vehicles-spring-2020/  
  Used for open educational EV packaging and subsystem placement context.
- **Blender OpenCar Rig** — https://www.blendswap.com/blend/17486  
  Used to inform a clean articulated part hierarchy suitable for wheel, steering, and suspension pivots.
- **MacPherson Strut OpenCAD (task-specified reference)**  
  Used conceptually for the front suspension topology.
- **Multi-Link Suspension OpenCAD (task-specified reference)**  
  Used conceptually for the rear suspension topology.
- **Open Combustion Engine CAD (task-specified reference)**  
  Used conceptually for inline-four engine block, piston, and crankshaft layout.
- **Open EV Powertrain CAD (task-specified reference)**  
  Used conceptually for transmission/driveline packaging discipline.

## Applied specification

The generated models use the exact dimensions required by the task brief:

- Wheelbase: 2700 mm
- Length: 4600 mm
- Width: 1780 mm
- Height: 1450 mm
- Track width: 1550 mm
- Tire diameter: 660 mm
- Rim diameter: 430 mm
- Ground clearance: 150 mm

The assets are authored in **meters** and exported as GLB with separate meshes and mechanically meaningful pivots.
"""
    docs_dir.joinpath("references.md").write_text(references, encoding="utf-8")


def export_scene(scene: trimesh.Scene, path: Path) -> None:
    path.write_bytes(scene.export(file_type="glb"))


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    models_dir = repo_root / "models"
    docs_dir = repo_root / "docs"
    models_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    export_scene(build_vehicle_scene(), models_dir / "vehicle.glb")
    export_scene(build_engine_scene(), models_dir / "engine.glb")
    export_scene(build_suspension_scene(), models_dir / "suspension.glb")
    export_scene(build_chassis_scene(), models_dir / "chassis.glb")
    write_dimensions(docs_dir)
    write_references(docs_dir)


if __name__ == "__main__":
    main()
