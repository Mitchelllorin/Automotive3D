/**
 * VehicleModel – procedurally built low-poly generic sedan.
 *
 * The model is divided into clearly named mesh groups that correspond
 * to the subsystem definitions in src/data/subsystems.js.
 * Each subsystem group can be independently highlighted, exploded, or isolated.
 * Individual meshes are clickable and highlight the selected component.
 */
import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import useAppStore from '../../store/appStore';
import { SUBSYSTEMS } from '../../data/subsystems';
import { FAULTS } from '../../data/faults';
import { COMPONENTS } from '../../data/components';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a MeshStandardMaterial for a subsystem mesh.
 * When isSelected is true the mesh pulses with a bright blue highlight
 * to indicate the individually selected component.
 */
function subMat(color, emissive, opacity, isSelected = false) {
  if (isSelected) {
    return (
      <meshStandardMaterial
        color="#e2e8f0"
        emissive="#58a6ff"
        emissiveIntensity={0.9}
        metalness={0.6}
        roughness={0.2}
        transparent={false}
        opacity={1}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={0.3}
      metalness={0.4}
      roughness={0.5}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

// ─── Engine subsystem meshes ──────────────────────────────────────────────────
function EngineGroup({ color, emissive, opacity, selectedComponent, onMeshClick }) {
  const isSel = (name) => selectedComponent === name;
  return (
    <group name="engine">
      {/* Engine block */}
      <mesh name="engine_block" position={[0, 0, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('engine_block'); }}>
        <boxGeometry args={[0.9, 0.55, 0.7]} />
        {subMat(color, emissive, opacity, isSel('engine_block'))}
      </mesh>
      {/* Pistons (4 cylinders) */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} name="pistons" position={[x, 0.38, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('pistons'); }}>
          <cylinderGeometry args={[0.06, 0.06, 0.35, 10]} />
          {subMat(color, emissive, opacity, isSel('pistons'))}
        </mesh>
      ))}
      {/* Crankshaft */}
      <mesh name="crankshaft" position={[0, -0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('crankshaft'); }}>
        <cylinderGeometry args={[0.04, 0.04, 0.85, 10]} />
        {subMat(color, emissive, opacity, isSel('crankshaft'))}
      </mesh>
      {/* Camshaft */}
      <mesh name="camshaft" position={[0, 0.15, -0.28]} rotation={[0, 0, Math.PI / 2]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('camshaft'); }}>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 8]} />
        {subMat(color, emissive, opacity, isSel('camshaft'))}
      </mesh>
      {/* Valve cover (simplified as flat box) */}
      <mesh name="valves" position={[0, 0.32, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('valves'); }}>
        <boxGeometry args={[0.88, 0.06, 0.68]} />
        {subMat(color, emissive, opacity, isSel('valves'))}
      </mesh>
    </group>
  );
}

// ─── Cooling subsystem meshes ─────────────────────────────────────────────────
function CoolingGroup({ color, emissive, opacity, selectedComponent, onMeshClick }) {
  const isSel = (name) => selectedComponent === name;
  return (
    <group name="cooling">
      {/* Radiator (front of engine bay) */}
      <mesh name="radiator" position={[0, 0.1, 1.1]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('radiator'); }}>
        <boxGeometry args={[0.9, 0.55, 0.08]} />
        {subMat(color, emissive, opacity, isSel('radiator'))}
      </mesh>
      {/* Water pump */}
      <mesh name="water_pump" position={[0.55, 0.1, 0.5]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('water_pump'); }}>
        <cylinderGeometry args={[0.1, 0.1, 0.18, 12]} />
        {subMat(color, emissive, opacity, isSel('water_pump'))}
      </mesh>
      {/* Thermostat housing */}
      <mesh name="thermostat" position={[0.3, 0.32, 0.3]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('thermostat'); }}>
        <sphereGeometry args={[0.07, 8, 8]} />
        {subMat(color, emissive, opacity, isSel('thermostat'))}
      </mesh>
      {/* Coolant hoses (represented as thin cylinders) */}
      <mesh name="coolant_hoses" position={[0.25, 0.15, 0.8]} rotation={[0.4, 0, 0.3]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('coolant_hoses'); }}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        {subMat(color, emissive, opacity, isSel('coolant_hoses'))}
      </mesh>
      <mesh name="coolant_hoses" position={[-0.25, 0.15, 0.8]} rotation={[0.4, 0, -0.3]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('coolant_hoses'); }}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        {subMat(color, emissive, opacity, isSel('coolant_hoses'))}
      </mesh>
      {/* Cooling fan */}
      <mesh name="fan" position={[0, 0.1, 0.95]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('fan'); }}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 6]} />
        {subMat(color, emissive, opacity, isSel('fan'))}
      </mesh>
    </group>
  );
}

// ─── Electrical subsystem meshes ─────────────────────────────────────────────
function ElectricalGroup({ color, emissive, opacity, selectedComponent, onMeshClick }) {
  const isSel = (name) => selectedComponent === name;
  return (
    <group name="electrical">
      {/* Battery */}
      <mesh name="battery" position={[-0.65, 0.05, 0.4]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('battery'); }}>
        <boxGeometry args={[0.28, 0.22, 0.38]} />
        {subMat(color, emissive, opacity, isSel('battery'))}
      </mesh>
      {/* Alternator */}
      <mesh name="alternator" position={[-0.55, 0.1, -0.1]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('alternator'); }}>
        <cylinderGeometry args={[0.1, 0.1, 0.16, 12]} />
        {subMat(color, emissive, opacity, isSel('alternator'))}
      </mesh>
      {/* Fuse box */}
      <mesh name="fuse_box" position={[-0.65, 0.2, 0.8]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('fuse_box'); }}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        {subMat(color, emissive, opacity, isSel('fuse_box'))}
      </mesh>
      {/* Starter motor */}
      <mesh name="starter_motor" position={[0.5, -0.1, -0.25]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('starter_motor'); }}>
        <cylinderGeometry args={[0.07, 0.07, 0.22, 10]} />
        {subMat(color, emissive, opacity, isSel('starter_motor'))}
      </mesh>
      {/* Wiring harness (representational line) */}
      <mesh name="wiring" position={[-0.1, 0.28, 0.55]} rotation={[0, 0, 0.5]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('wiring'); }}>
        <cylinderGeometry args={[0.015, 0.015, 1.1, 6]} />
        {subMat(color, emissive, opacity, isSel('wiring'))}
      </mesh>
    </group>
  );
}

// ─── Fuel subsystem meshes ────────────────────────────────────────────────────
function FuelGroup({ color, emissive, opacity, selectedComponent, onMeshClick }) {
  const isSel = (name) => selectedComponent === name;
  return (
    <group name="fuel">
      {/* Fuel tank (under rear) */}
      <mesh name="fuel_tank" position={[0, -0.55, -1.4]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('fuel_tank'); }}>
        <boxGeometry args={[0.8, 0.22, 0.6]} />
        {subMat(color, emissive, opacity, isSel('fuel_tank'))}
      </mesh>
      {/* Fuel pump */}
      <mesh name="fuel_pump" position={[0.2, -0.42, -1.2]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('fuel_pump'); }}>
        <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
        {subMat(color, emissive, opacity, isSel('fuel_pump'))}
      </mesh>
      {/* Fuel injectors */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} name="fuel_injectors" position={[x, 0.28, 0.28]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('fuel_injectors'); }}>
          <cylinderGeometry args={[0.025, 0.025, 0.14, 8]} />
          {subMat(color, emissive, opacity, isSel('fuel_injectors'))}
        </mesh>
      ))}
      {/* Throttle body */}
      <mesh name="throttle_body" position={[0, 0.22, 0.55]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('throttle_body'); }}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
        {subMat(color, emissive, opacity, isSel('throttle_body'))}
      </mesh>
      {/* Fuel lines */}
      <mesh name="fuel_lines" position={[0.15, -0.1, -0.5]} rotation={[1.2, 0, 0.1]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('fuel_lines'); }}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
        {subMat(color, emissive, opacity, isSel('fuel_lines'))}
      </mesh>
    </group>
  );
}

// ─── Exhaust subsystem meshes ─────────────────────────────────────────────────
function ExhaustGroup({ color, emissive, opacity, selectedComponent, onMeshClick }) {
  const isSel = (name) => selectedComponent === name;
  return (
    <group name="exhaust">
      {/* Exhaust manifold */}
      <mesh name="exhaust_manifold" position={[0, 0, -0.45]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('exhaust_manifold'); }}>
        <boxGeometry args={[0.85, 0.12, 0.12]} />
        {subMat(color, emissive, opacity, isSel('exhaust_manifold'))}
      </mesh>
      {/* Catalytic converter */}
      <mesh name="catalytic_converter" position={[0, -0.3, -0.9]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('catalytic_converter'); }}>
        <cylinderGeometry args={[0.1, 0.1, 0.38, 10]} />
        {subMat(color, emissive, opacity, isSel('catalytic_converter'))}
      </mesh>
      {/* O2 sensor */}
      <mesh name="o2_sensor" position={[0.15, -0.22, -0.68]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('o2_sensor'); }}>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 8]} />
        {subMat(color, emissive, opacity, isSel('o2_sensor'))}
      </mesh>
      {/* Exhaust pipe */}
      <mesh name="exhaust_pipe" position={[0, -0.45, -1.5]} rotation={[0.15, 0, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('exhaust_pipe'); }}>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 10]} />
        {subMat(color, emissive, opacity, isSel('exhaust_pipe'))}
      </mesh>
      {/* Muffler */}
      <mesh name="muffler" position={[0, -0.48, -2.05]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('muffler'); }}>
        <cylinderGeometry args={[0.14, 0.14, 0.42, 10]} />
        {subMat(color, emissive, opacity, isSel('muffler'))}
      </mesh>
    </group>
  );
}

// ─── Suspension subsystem meshes ─────────────────────────────────────────────
function SuspensionGroup({ color, emissive, opacity, selectedComponent, onMeshClick }) {
  const isSel = (name) => selectedComponent === name;
  // Front and rear left/right
  const corners = [
    [-0.75, 1.0],
    [0.75, 1.0],
    [-0.75, -1.0],
    [0.75, -1.0],
  ];
  return (
    <group name="suspension">
      {corners.map(([x, z], i) => (
        <group key={i} position={[x, -0.4, z]}>
          {/* Strut */}
          <mesh name="struts" position={[0, 0.25, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('struts'); }}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            {subMat(color, emissive, opacity, isSel('struts'))}
          </mesh>
          {/* Spring */}
          <mesh name="springs" position={[0, 0.1, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('springs'); }}>
            <torusGeometry args={[0.07, 0.02, 8, 16]} />
            {subMat(color, emissive, opacity, isSel('springs'))}
          </mesh>
          {/* Control arm */}
          <mesh name="control_arms" position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('control_arms'); }}>
            <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
            {subMat(color, emissive, opacity, isSel('control_arms'))}
          </mesh>
          {/* Wheel hub */}
          <mesh name="wheel_hubs" position={[0, -0.2, 0]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('wheel_hubs'); }}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 12]} />
            {subMat(color, emissive, opacity, isSel('wheel_hubs'))}
          </mesh>
        </group>
      ))}
      {/* Sway bar */}
      <mesh name="sway_bar" position={[0, -0.55, 1.0]} rotation={[0, 0, Math.PI / 2]} castShadow onClick={(e) => { e.stopPropagation(); onMeshClick('sway_bar'); }}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
        {subMat(color, emissive, opacity, isSel('sway_bar'))}
      </mesh>
    </group>
  );
}

// ─── Car body (non-interactive) ───────────────────────────────────────────────
function CarBody() {
  return (
    <group name="body">
      {/* Main cabin */}
      <mesh position={[0, 0.55, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.55, 0.5, 2.4]} />
        <meshStandardMaterial color="#2d3436" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.9, -0.05]} castShadow>
        <boxGeometry args={[1.4, 0.28, 1.5]} />
        <meshStandardMaterial color="#2d3436" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Hood */}
      <mesh position={[0, 0.44, 0.85]} castShadow>
        <boxGeometry args={[1.45, 0.08, 0.9]} />
        <meshStandardMaterial color="#2d3436" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.44, -1.2]} castShadow>
        <boxGeometry args={[1.45, 0.08, 0.55]} />
        <meshStandardMaterial color="#2d3436" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.72, 0.56]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[1.3, 0.42, 0.04]} />
        <meshStandardMaterial color="#74b9ff" transparent opacity={0.35} metalness={0} roughness={0} />
      </mesh>
      {/* Wheels */}
      {[[-0.82, 0.05, 0.95], [0.82, 0.05, 0.95], [-0.82, 0.05, -1.0], [0.82, 0.05, -1.0]].map(
        ([x, y, z], i) => (
          <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.22, 16]} />
              <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.9} />
            </mesh>
            {/* Rim */}
            <mesh>
              <cylinderGeometry args={[0.18, 0.18, 0.24, 12]} />
              <meshStandardMaterial color="#dfe6e9" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )
      )}
    </group>
  );
}

// ─── Main VehicleModel component ─────────────────────────────────────────────
export default function VehicleModel() {
  const groupRef = useRef();
  const {
    selectedSubsystem,
    selectedComponent,
    setSelectedComponent,
    selectSubsystem,
    isExploded,
    isIsolated,
    activeFaults,
    animationsEnabled,
  } = useAppStore();

  /** When a mesh is clicked, select the component and its parent subsystem. */
  const handleMeshClick = useCallback(
    (meshName) => {
      const comp = COMPONENTS[meshName];
      if (!comp) return;
      setSelectedComponent(meshName);
      selectSubsystem(comp.subsystemId);
    },
    [setSelectedComponent, selectSubsystem]
  );

  /** Compute per-subsystem render props based on current state. */
  const subsystemProps = useMemo(() => {
    const props = {};
    Object.values(SUBSYSTEMS).forEach((sys) => {
      const isSelected = selectedSubsystem === sys.id;
      const isOther = selectedSubsystem && !isSelected;

      // Detect any active fault that targets this subsystem
      const activeFaultForSys = Object.entries(activeFaults).find(
        ([fid, active]) => active && FAULTS[fid]?.subsystem === sys.id
      );

      let color = sys.color;
      let emissive = '#000000';
      let opacity = 1;

      if (activeFaultForSys) {
        // Fault active – use fault highlight colour
        color = sys.highlightColor;
        emissive = sys.highlightColor;
      } else if (isSelected) {
        color = sys.highlightColor;
        emissive = sys.color;
      } else if (isOther && isIsolated) {
        // Dim non-selected subsystems in isolate mode
        opacity = 0.1;
      } else if (isOther) {
        opacity = 0.55;
      }

      props[sys.id] = { color, emissive, opacity };
    });
    return props;
  }, [selectedSubsystem, activeFaults, isIsolated]);

  /** Compute per-subsystem position offsets for explode mode. */
  const explodeOffsets = useMemo(() => {
    const offsets = {};
    Object.values(SUBSYSTEMS).forEach((sys) => {
      if (isExploded && selectedSubsystem === sys.id) {
        offsets[sys.id] = sys.explodeOffset;
      } else {
        offsets[sys.id] = [0, 0, 0];
      }
    });
    return offsets;
  }, [isExploded, selectedSubsystem]);

  // Gentle auto-rotation when nothing is selected
  useFrame((_, delta) => {
    if (groupRef.current && !selectedSubsystem && animationsEnabled) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const sharedProps = { selectedComponent, onMeshClick: handleMeshClick };

  return (
    <group ref={groupRef}>
      <CarBody />

      {/* Engine – centred in engine bay */}
      <group position={[
        0 + explodeOffsets.engine[0],
        0.08 + explodeOffsets.engine[1],
        0.45 + explodeOffsets.engine[2],
      ]}>
        <EngineGroup {...subsystemProps.engine} {...sharedProps} />
      </group>

      {/* Cooling */}
      <group position={[
        0 + explodeOffsets.cooling[0],
        0.08 + explodeOffsets.cooling[1],
        0.45 + explodeOffsets.cooling[2],
      ]}>
        <CoolingGroup {...subsystemProps.cooling} {...sharedProps} />
      </group>

      {/* Electrical */}
      <group position={[
        0 + explodeOffsets.electrical[0],
        0.08 + explodeOffsets.electrical[1],
        0.45 + explodeOffsets.electrical[2],
      ]}>
        <ElectricalGroup {...subsystemProps.electrical} {...sharedProps} />
      </group>

      {/* Fuel */}
      <group position={[
        0 + explodeOffsets.fuel[0],
        0.08 + explodeOffsets.fuel[1],
        0.45 + explodeOffsets.fuel[2],
      ]}>
        <FuelGroup {...subsystemProps.fuel} {...sharedProps} />
      </group>

      {/* Exhaust */}
      <group position={[
        0 + explodeOffsets.exhaust[0],
        0.08 + explodeOffsets.exhaust[1],
        0.45 + explodeOffsets.exhaust[2],
      ]}>
        <ExhaustGroup {...subsystemProps.exhaust} {...sharedProps} />
      </group>

      {/* Suspension */}
      <group position={[
        0 + explodeOffsets.suspension[0],
        0.08 + explodeOffsets.suspension[1],
        0.45 + explodeOffsets.suspension[2],
      ]}>
        <SuspensionGroup {...subsystemProps.suspension} {...sharedProps} />
      </group>
    </group>
  );
}
