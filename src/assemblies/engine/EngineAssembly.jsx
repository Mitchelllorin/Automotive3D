/**
 * EngineAssembly – a procedurally-built classic small-block V8 (Chevy-style),
 * the hero model. Modelled from the real SBC layout: a 90° V8 with a painted
 * orange block, two chrome valve covers, a valley intake manifold topped by a
 * carburettor and round air cleaner, a distributor at the rear of the valley,
 * tubular headers, a harmonic balancer up front, an oil pan below, and a bell
 * housing + transmission stub bolted to the back.
 *
 * Everything is composed from individually selectable <Part>s arranged as a
 * classic exploded diagram driven by `explodeFactor`. Part `name`s match
 * COMPONENTS keys and `system`s match SUBSYSTEMS keys, so clicks drive the
 * sidebar and the Systems tab can isolate whole sub-assemblies.
 *
 * Add more assemblies later = drop another file into src/assemblies and register
 * it in registry.js.
 */
import { useRef, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Part, { Surface, RBox } from '../../components/scene/Part';
import { HexBolt, HexNut } from '../../components/scene/fasteners';
import { boltRect } from '../../components/scene/boltLayout';
import { simState } from '../../lib/simState';
import { explodeState } from '../../lib/explodeState';
import { FailureContext, CamContext, GeomContext } from '../../lib/engineInstance';
import FailureEffects from '../../components/scene/FailureEffects';
import { cylinderPistonDrop, CRANK_THROW, STROKE, CYLINDERS, valveLift } from '../../data/engineSpec';
import { textTexture } from '../../lib/decals';

// Real Gen-I 350 casting number, baked once into a texture for the block stamp.
const CASTING_TEX = textTexture('GM 3970010', { color: '#36291f' });

/** A flat decal (e.g. a casting number) sitting just proud of a surface. */
function Decal({ tex, position, rotation, size = [0.62, 0.155] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        map={tex}
        transparent
        alphaTest={0.35}
        roughness={0.7}
        metalness={0.1}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

/**
 * Spin – rotates its children about the local X (crank) axis by the live crank
 * angle × `rate`. rate 1 = crank speed, 0.5 = camshaft, etc. Reads simState in
 * useFrame so it animates without re-rendering.
 */
function Spin({ rate = 1, children, ...props }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = simState.crankAngle * rate;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

// Cylinder id layout matching engineSpec: +X is the front (balancer) end, so the
// driver bank (odd) runs 1,3,5,7 and passenger (even) 2,4,6,8 from +X to -X.
const BANK_IDS = { 1: [1, 3, 5, 7], '-1': [2, 4, 6, 8] };

/**
 * BankExplode – teardown helper for bank-mounted parts. Lifts its children along
 * the bank's own up-axis (the deck normal) rather than straight up, so during a
 * teardown they travel up AND out — the two banks diverging left/right from the
 * valley, the way an exploded-view diagram reads. It must live INSIDE the rotated
 * bank <group>, where a local +Y translation already points up-and-out in world
 * space. `amount` is the scene-unit travel at full explode (factor = 1); stacking
 * amounts orders the layers (pistons < head < bolts < valvetrain < cover).
 */
function BankExplode({ amount, children }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.position.y = explodeState.factor * amount;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Turned – a lathe (revolved) Surface built from a [radius, y] profile. The
 * lathe axis is local Y; rotate the part to orient it. Real turned silhouettes
 * (tapered end bells, domed canisters, V-belt grooves) instead of stacked
 * cylinders are the single biggest step away from the "LEGO" look.
 */
function Turned({ profile, segments = 56, ...props }) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return (
    <Surface {...props}>
      <latheGeometry args={[pts, segments]} />
    </Surface>
  );
}

// Classic American V8 palette: Chevy-orange block, chrome dress-up, cast alloy.
// Tuned to read as real materials (less saturated paint, darker iron, brighter
// chrome) under the studio rig.
const C = {
  block: '#bf4a1e', // Chevy orange (slightly de-saturated for paint, not plastic)
  blockDark: '#9c3b13',
  deck: '#c6cbd2', // machined deck
  bore: '#0f1113',
  head: '#c6491d',
  chrome: '#eef2f6', // valve covers / air cleaner
  alu: '#b4b9c1', // intake / cast aluminium
  steel: '#a9afb8',
  iron: '#56595e', // headers / cast iron
  black: '#17191e',
};

const BANK_ANGLE = Math.PI / 4; // 45° each side → 90° included V
const BANK_X = [-0.78, -0.26, 0.26, 0.78]; // four cylinders per bank along the crank axis
const VALLEY = [0, 0.2, 0]; // pivot the banks splay around

// This assembly is drawn at the Small-Block 350's bore/stroke; the active engine's
// designed dimensions (from GeomContext) are normalised against these references so
// a bigger bore widens the cylinders and a longer stroke lengthens the piston travel
// + crank throw. (See lib/engineInstance GeomContext.)
const BASE_BORE_IN = 4.0;
const BASE_STROKE_IN = 3.48;
const boreFactorOf = (geom) => (geom?.boreIn ?? BASE_BORE_IN) / BASE_BORE_IN;
const strokeFactorOf = (geom) => (geom?.strokeIn ?? BASE_STROKE_IN) / BASE_STROKE_IN;

/** Transform props for a cylinder bank. side = +1 (front/+Z) or -1 (rear/-Z). */
function bankProps(side) {
  return { position: VALLEY, rotation: [side * BANK_ANGLE, 0, 0] };
}

/**
 * Maps a point in a bank's local frame into engine-assembly coordinates, so
 * wires/plugs that live outside a <group> can still land exactly on a bank
 * (same rotation+translation the bank casting uses).
 */
function bankToEngine([lx, ly, lz], side) {
  const t = side * BANK_ANGLE;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [
    VALLEY[0] + lx,
    VALLEY[1] + ly * c - lz * s,
    VALLEY[2] + ly * s + lz * c,
  ];
}

/**
 * Hose – a swept tube along a Catmull-Rom path through `points`. Used for
 * radiator hoses, plug wires, fuel lines, and the drive belt. Picks up the
 * enclosing Part's highlight via <Surface>.
 */
function Hose({
  points,
  radius = 0.05,
  color = C.black,
  metalness = 0.2,
  roughness = 0.7,
  closed = false,
  segments = 40,
  finish = 'rubber',
  swap = false,
}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    closed
  );
  return (
    <Surface color={color} metalness={metalness} roughness={roughness} finish={finish} swap={swap}>
      <tubeGeometry args={[curve, segments, radius, 10, closed]} />
    </Surface>
  );
}

/** Grooved V-belt accessory pulley, axis along the crank (X) line. */
function Pulley({ position, r = 0.2, color = C.steel }) {
  // Cross-section: hub → outer flange → V-groove valley → outer flange → hub.
  const profile = [
    [0, -0.055],
    [r * 0.28, -0.055],
    [r, -0.05],
    [r, -0.024],
    [r * 0.64, 0], // groove valley
    [r, 0.024],
    [r, 0.05],
    [r * 0.28, 0.055],
    [0, 0.055],
  ];
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <Turned profile={profile} color={color} metalness={0.82} roughness={0.32} finish="machined" />
    </group>
  );
}

// ── Block (V) ──────────────────────────────────────────────────────────────────
/**
 * Bore – a machined opening (bolt hole, lifter bore, cam tunnel, freeze-plug
 * counterbore). A near-black recessed cavity with a subtle cast chamfer at the
 * mouth, so it reads as a real drilled hole — NOT a bright stud. The mouth sits
 * at the group origin and the cavity drills toward local −Y, so the caller orients
 * −Y *into* the casting (no rotation = straight down; ±90° about z/x for a
 * front/rear/side face).
 */
function Bore({ position, rotation = [0, 0, 0], r = 0.03, depth = 0.07, seg = 12 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* faint machined chamfer ring at the mouth (matte, not mirror) */}
      <Surface mat="castIronRaw" position={[0, -0.004, 0]}>
        <cylinderGeometry args={[r * 1.35, r, 0.016, seg, 1, true]} />
      </Surface>
      {/* dark recessed cavity drilling into the iron */}
      <mesh position={[0, -depth / 2 - 0.012, 0]}>
        <cylinderGeometry args={[r, r * 0.82, depth, seg]} />
        <meshStandardMaterial color="#070809" metalness={0.15} roughness={0.98} />
      </mesh>
    </group>
  );
}

function CylinderBlock() {
  const bf = boreFactorOf(useContext(GeomContext)); // widen the bores for a bigger bore
  return (
    <Part name="engine_block" system="block" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {/* ── Crankcase ───────────────────────────────────────────── */}
      <Surface mat="paintedBlock" position={[0, -0.15, 0]}>
        <RBox args={[2.24, 0.58, 0.84]} />
      </Surface>
      {/* Skirt flares out toward the pan rail (darker in the shadowed belly) */}
      <Surface mat="paintedBlockDk" position={[0, -0.36, 0]}>
        <RBox args={[2.28, 0.18, 0.96]} />
      </Surface>
      {/* Oil-pan rail flange */}
      <Surface mat="paintedBlockDk" position={[0, -0.47, 0]}>
        <RBox args={[2.34, 0.05, 1.04]} />
      </Surface>

      {/* The two cylinder banks splayed into a V */}
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          {/* Bank casting */}
          <Surface mat="paintedBlock" position={[0, 0.3, 0]}>
            <RBox args={[2.18, 0.55, 0.46]} />
          </Surface>
          {/* Machined deck — bright machined face the head bolts to */}
          <Surface mat="machinedSteel" finish="machined" position={[0, 0.58, 0]}>
            <RBox args={[2.22, 0.05, 0.5]} />
          </Surface>
          {/* Head-bolt holes drilled down each side of the bores */}
          {[-0.85, -0.3, 0.3, 0.85].map((x) =>
            [-0.2, 0.2].map((z) => (
              <Bore key={`${x}-${z}`} position={[x, 0.59, z]} r={0.026} depth={0.08} />
            ))
          )}
          {/* Open bores through the deck — honed cylinder wall + dark opening */}
          {BANK_X.map((x) => (
            <group key={`bore${x}`} position={[x, 0, 0]} scale={[bf, 1, bf]}>
              <Surface mat="machinedSteel" finish="machined" position={[0, 0.56, 0]}>
                <cylinderGeometry args={[0.122, 0.122, 0.1, 30, 1, true]} />
              </Surface>
              <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.02, 30]} />
                <meshStandardMaterial color="#08090b" metalness={0.3} roughness={0.92} />
              </mesh>
            </group>
          ))}
          {/* Cylinder bores */}
          {BANK_X.map((x) => (
            <group key={x} position={[x, 0.42, 0]} scale={[bf, 1, bf]}>
              <mesh>
                <cylinderGeometry args={[0.13, 0.13, 0.34, 28, 1, true]} />
                <meshStandardMaterial color={C.deck} metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.118, 0.118, 0.02, 28]} />
                <meshStandardMaterial color={C.bore} metalness={0.4} roughness={0.85} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* ── Lifter valley between the banks ──────────────────────── */}
      <Surface mat="paintedBlockDk" position={[0, 0.42, 0]}>
        <RBox args={[1.98, 0.07, 0.42]} />
      </Surface>
      {/* 16 lifter bores — two rows of 8 (one pair per cylinder) down the valley */}
      {[-0.12, 0.12].map((z) =>
        [-0.84, -0.6, -0.36, -0.12, 0.12, 0.36, 0.6, 0.84].map((x) => (
          <Bore key={`lift${x}${z}`} position={[x, 0.45, z]} r={0.032} depth={0.07} />
        ))
      )}
      {/* Distributor bore at the rear of the valley */}
      <Bore position={[-0.97, 0.36, 0]} rotation={[0.45, 0, 0]} r={0.075} depth={0.14} seg={18} />

      {/* ── Front face / timing-cover mounting ───────────────────── */}
      <Surface mat="paintedBlock" position={[1.16, -0.02, 0]}>
        <RBox args={[0.06, 0.74, 0.8]} />
      </Surface>
      {/* Cam tunnel + crank-snout bores through the front */}
      <Bore position={[1.21, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} r={0.075} depth={0.12} seg={20} />
      <Bore position={[1.21, -0.18, 0]} rotation={[0, 0, Math.PI / 2]} r={0.06} depth={0.12} seg={18} />
      {/* Timing-cover bolt holes ringing the front */}
      {[[0, 0.3], [0.3, 0.16], [0.3, -0.22], [0, -0.34], [-0.3, -0.22], [-0.3, 0.16]].map(([z, y], i) => (
        <Bore key={`tc${i}`} position={[1.21, y, z]} rotation={[0, 0, Math.PI / 2]} r={0.018} depth={0.05} seg={8} />
      ))}

      {/* ── Rear: bellhousing flange + bolt pattern ──────────────── */}
      <Surface mat="castIronRaw" position={[-1.16, -0.04, 0]}>
        <RBox args={[0.06, 0.86, 0.98]} />
      </Surface>
      {[[0.34, 0.42], [0.34, -0.42], [-0.34, 0.44], [-0.34, -0.44], [0.36, 0], [-0.36, 0]].map(([y, z], i) => (
        <Bore key={`bf${i}`} position={[-1.21, y - 0.04, z]} rotation={[0, 0, Math.PI / 2]} r={0.028} depth={0.05} seg={10} />
      ))}

      {/* ── Side details ─────────────────────────────────────────── */}
      {/* Motor-mount pads — proud cast bosses with a machined mating face */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Surface mat="paintedBlock" position={[s * 0.55, -0.24, s * 0.5]}>
            <RBox args={[0.42, 0.34, 0.16]} />
          </Surface>
          <Surface mat="castIronRaw" finish="machined" position={[s * 0.55, -0.24, s * 0.585]}>
            <RBox args={[0.34, 0.27, 0.02]} />
          </Surface>
        </group>
      ))}
      {/* A recessed (darker) core-plug band with the freeze plugs sunk into it */}
      {[1, -1].map((side) => (
        <Surface key={`band${side}`} mat="paintedBlockDk" position={[0.05, -0.11, side * 0.45]}>
          <RBox args={[1.55, 0.17, 0.035]} />
        </Surface>
      ))}
      {[1, -1].map((side) =>
        [-0.62, -0.05, 0.52].map((x) => (
          <Surface key={`fp${side}${x}`} mat="steel" finish="machined" position={[x + 0.05, -0.11, side * 0.47]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.03, 18]} />
          </Surface>
        ))
      )}
      {/* Cast strengthening ribs + a horizontal web — what turns the flat slab
          into a ribbed iron casting */}
      {[1, -1].map((side) => (
        <group key={`ribs${side}`}>
          <Surface mat="paintedBlock" position={[0.02, -0.33, side * 0.45]}>
            <RBox args={[1.96, 0.05, 0.07]} />
          </Surface>
          {[-0.86, -0.52, -0.18, 0.18, 0.52, 0.86].map((x) => (
            <Surface key={x} mat="paintedBlock" position={[x, -0.3, side * 0.45]}>
              <RBox args={[0.07, 0.36, 0.08]} />
            </Surface>
          ))}
        </group>
      ))}
      {/* Oil-filter mounting boss, lower driver side */}
      <Surface mat="paintedBlock" position={[-0.95, -0.3, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.1, 20]} />
      </Surface>
      {/* Fuel-pump pad + pushrod hole, front passenger side */}
      <Surface mat="paintedBlock" position={[1.0, -0.3, -0.44]}>
        <RBox args={[0.22, 0.24, 0.06]} />
      </Surface>
      <Bore position={[1.0, -0.3, -0.49]} rotation={[Math.PI / 2, 0, 0]} r={0.028} depth={0.05} seg={10} />
      {/* Dipstick tube hole, driver side */}
      <Bore position={[0.66, -0.34, 0.43]} rotation={[Math.PI / 2, 0, 0]} r={0.02} depth={0.05} seg={8} />

      {/* ── Casting number — raised bare-iron pad so the stamp reads ─ */}
      <Surface mat="castIronRaw" position={[-0.32, -0.26, 0.45]}>
        <RBox args={[0.7, 0.22, 0.02]} />
      </Surface>
      <Decal tex={CASTING_TEX} position={[-0.32, -0.26, 0.463]} size={[0.64, 0.16]} />
    </Part>
  );
}

function OilPan() {
  return (
    <Part name="oil_pan" system="block" position={[0, -0.72, 0.05]} explode={[0, -2.0, 0]}>
      <Surface color={C.steel} metalness={0.65} roughness={0.4}>
        <RBox args={[1.9, 0.4, 0.86]} />
      </Surface>
      {/* Sump kick-out + drain plug */}
      <Surface color={C.steel} metalness={0.65} roughness={0.4} position={[-0.5, -0.24, 0]}>
        <RBox args={[0.7, 0.18, 0.74]} />
      </Surface>
      <Surface color={C.black} metalness={0.7} roughness={0.4} position={[-0.5, -0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.06, 6]} />
      </Surface>
    </Part>
  );
}

function PanBolts() {
  const ring = [
    ...boltRect(0.82, 0.36, 0).map(([x, , z]) => [x, 0, z]),
    [-0.82, 0, 0],
    [0.82, 0, 0],
  ];
  return (
    <Part name="pan_bolts" system="fasteners" position={[0, -0.52, 0.05]} explode={[0, -2.6, 0]}>
      {ring.map(([x, y, z], i) => (
        <HexBolt key={i} position={[x, y, z]} rotation={[Math.PI, 0, 0]} len={0.12} scale={0.72} washer />
      ))}
    </Part>
  );
}

function Crankshaft() {
  // Four rod journals offset from the axis at 90° intervals — these make the
  // rotation visible and carry the (paired) connecting rods.
  const journals = [
    { x: 0.6, a: 0 },
    { x: 0.2, a: 90 },
    { x: -0.2, a: 180 },
    { x: -0.6, a: 270 },
  ];
  const geom = useContext(GeomContext);
  const r = CRANK_THROW * strokeFactorOf(geom); // a stroker swings the throws wider
  return (
    <Part name="crankshaft" system="block" position={[0, -0.18, 0]} explode={[0, -1.5, 0]}>
      <Spin rate={1}>
        {/* Main journal shaft */}
        <Surface color={C.steel} metalness={0.85} roughness={0.3} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 20]} />
        </Surface>
        {/* Main bearing webs (concentric) */}
        {[-0.6, -0.2, 0.2, 0.6].map((x) => (
          <Surface key={`m${x}`} color={C.steel} metalness={0.8} roughness={0.32} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.17, 0.17, 0.08, 20]} />
          </Surface>
        ))}
        {/* Offset rod journals + counterweight lobes */}
        {journals.map(({ x, a }, i) => {
          const ar = (a * Math.PI) / 180;
          const py = r * Math.cos(ar);
          const pz = r * Math.sin(ar);
          return (
            <group key={`j${i}`} position={[x, 0, 0]}>
              <Surface color={C.steel} metalness={0.88} roughness={0.26} position={[0, py, pz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.07, 0.07, 0.2, 18]} />
              </Surface>
              <Surface color={C.iron} metalness={0.55} roughness={0.5} position={[0, -py * 0.85, -pz * 0.85]} rotation={[ar, 0, 0]}>
                <RBox args={[0.12, 0.34, 0.1]} />
              </Surface>
            </group>
          );
        })}
        {/* Harmonic balancer + crank pulley at the front */}
        <Surface color={C.black} metalness={0.55} roughness={0.45} position={[1.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 30]} />
        </Surface>
        {/* Timing-mark notch so the balancer's rotation reads */}
        <Surface color="#e6e6e6" metalness={0.55} roughness={0.35} position={[1.26, 0.24, 0]}>
          <RBox args={[0.03, 0.06, 0.02]} />
        </Surface>
        <Surface color={C.steel} metalness={0.8} roughness={0.3} position={[1.29, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.07, 26]} />
        </Surface>
        {/* Snout + lower crank pulley in the belt-drive plane */}
        <Surface mat="steel" position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.22, 18]} />
        </Surface>
        <Pulley position={[BELT_PLANE_X, 0, 0]} r={0.2} />
      </Spin>
    </Part>
  );
}

/** One piston + rod that reciprocates along its bore from the slider-crank. */
function AnimatedPiston({ id, x }) {
  const ref = useRef();
  const geom = useContext(GeomContext);
  const sf = strokeFactorOf(geom); // longer stroke → travels further
  const bf = boreFactorOf(geom); // bigger bore → wider piston
  useFrame(() => {
    if (ref.current) {
      // TDC stays at the deck (drop = 0); a longer stroke just reaches deeper at BDC.
      ref.current.position.y = 0.48 - cylinderPistonDrop(id, simState.crankAngle) * sf;
    }
  });
  return (
    // Scale the cross-section (x/z) by the bore factor; the group's own position +
    // vertical travel are unaffected, so only the piston *diameter* changes.
    <group ref={ref} position={[x, 0.48, 0]} scale={[bf, 1, bf]}>
      {/* Crown */}
      <Surface color={C.steel} metalness={0.78} roughness={0.34} finish="machined">
        <cylinderGeometry args={[0.118, 0.118, 0.12, 28]} />
      </Surface>
      {/* Compression-ring lands */}
      {[0.035, 0.012, -0.011].map((yy, i) => (
        <Surface key={i} color={C.iron} metalness={0.5} roughness={0.55} position={[0, yy, 0]}>
          <cylinderGeometry args={[0.121, 0.121, 0.012, 28]} />
        </Surface>
      ))}
      {/* Skirt */}
      <Surface color={C.steel} metalness={0.82} roughness={0.3} position={[0, -0.11, 0]}>
        <cylinderGeometry args={[0.112, 0.116, 0.13, 24]} />
      </Surface>
      {/* Connecting-rod stub toward the crank */}
      <Surface color={C.steel} metalness={0.85} roughness={0.3} position={[0, -0.26, 0]}>
        <RBox args={[0.05, 0.24, 0.07]} />
      </Surface>
    </group>
  );
}

function Pistons() {
  return (
    <Part name="pistons" system="block" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          <BankExplode amount={1.6}>
            {BANK_X.map((x, i) => (
              <AnimatedPiston key={x} id={BANK_IDS[side][3 - i]} x={x} />
            ))}
          </BankExplode>
        </group>
      ))}
    </Part>
  );
}

/** A single cylinder's combustion glow — pulses at the start of its power
 *  stroke, so the 8 chambers flash in firing order while the engine runs. */
function Flash({ id, position }) {
  const ref = useRef();
  const fs = useContext(FailureContext);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    if (simState.rpm < 1) {
      m.visible = false;
      return;
    }
    // A holed piston misfires — that cylinder stops firing entirely.
    if (fs.holed && id === 1) {
      m.visible = false;
      return;
    }
    const deg = (((simState.crankAngle * 180) / Math.PI) % 720 + 720) % 720;
    const local = (deg - CYLINDERS[id].powerStrokeDeg + 720) % 720;
    const f = local < 70 ? Math.pow(1 - local / 70, 1.5) : 0;
    m.visible = f > 0.02;
    if (fs.detonation && f > 0.01) {
      // Knock: hotter, brighter, erratic flash — combustion light off before the spark.
      const knock = 0.7 + Math.random() * 1.1;
      m.material.emissive.setHex(0xfff1d6);
      m.material.color.setHex(0xfff1d6);
      m.material.emissiveIntensity = f * 7 * knock;
      m.scale.setScalar((0.07 + f * 0.22) * 1.2);
    } else {
      m.material.emissive.setHex(0xff7a1a);
      m.material.color.setHex(0xff7a1a);
      m.material.emissiveIntensity = f * 5;
      m.scale.setScalar(0.07 + f * 0.2);
    }
    m.material.opacity = 0.55 + f * 0.4;
  });
  return (
    <mesh ref={ref} position={position} visible={false}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial
        color="#ff7a1a"
        emissive="#ff7a1a"
        emissiveIntensity={0}
        transparent
        opacity={0.85}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** All 8 combustion flashes, positioned at the top of each bore. */
function CombustionFlash() {
  return (
    <group name="combustion">
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          {BANK_X.map((x, i) => (
            <Flash key={x} id={BANK_IDS[side][3 - i]} position={[x, 0.58, 0]} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Camshaft() {
  // OHV V8 cam lives in the block valley, above the crank; turns at half crank
  // speed (one cam revolution per 4-stroke cycle).
  return (
    <Part name="camshaft" system="head" position={[0, 0.12, 0]} explode={[0, 2.0, 0]}>
      <Spin rate={0.5}>
        <Surface color={C.steel} metalness={0.85} roughness={0.3} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 2.0, 16]} />
        </Surface>
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <group key={x} position={[x, 0, 0]} rotation={[(i * Math.PI) / 2, 0, 0]}>
            {/* Bearing journal */}
            <Surface color={C.steel} metalness={0.85} roughness={0.3} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.07, 16]} />
            </Surface>
            {/* Eccentric lobe – shows the cam turning */}
            <Surface color={C.steel} metalness={0.86} roughness={0.28} position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.09, 16]} />
            </Surface>
          </group>
        ))}
      </Spin>
    </Part>
  );
}

// ── Heads + valve covers ────────────────────────────────────────────────────────
function CylinderHeads() {
  return (
    <Part name="cylinder_head" system="head" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          <BankExplode amount={2.2}>
            <Surface color={C.head} metalness={0.35} roughness={0.5} position={[0, 0.74, 0]}>
              <RBox args={[2.16, 0.3, 0.52]} />
            </Surface>
            {/* Exhaust port stubs on the outboard face */}
            {BANK_X.map((x) => (
              <Surface key={x} color={C.head} metalness={0.35} roughness={0.5} position={[x, 0.72, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
              </Surface>
            ))}
          </BankExplode>
        </group>
      ))}
    </Part>
  );
}

function ValveCovers() {
  return (
    <Part name="valve_cover" system="head" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          <BankExplode amount={3.9}>
            {/* Chrome valve cover (swappable: chrome / black crinkle / polished / orange) */}
            <Surface swap color={C.chrome} metalness={0.92} roughness={0.12} position={[0, 0.96, 0]} finish="smooth">
              <RBox args={[2.0, 0.24, 0.46]} />
            </Surface>
            <Surface swap color={C.chrome} metalness={0.92} roughness={0.12} position={[0, 1.1, 0]} finish="smooth">
              <RBox args={[1.9, 0.06, 0.36]} />
            </Surface>
            {/* Oil cap on the front cover */}
            <Surface swap color={C.chrome} metalness={0.9} roughness={0.15} position={[0.85, 1.12, 0]} finish="smooth">
              <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
            </Surface>
          </BankExplode>
        </group>
      ))}
    </Part>
  );
}

function CoverBolts() {
  return (
    <Part name="cover_bolts" system="fasteners" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          <BankExplode amount={4.6}>
            {[-0.8, -0.27, 0.27, 0.8].map((x) =>
              [-0.18, 0.18].map((z) => (
                <HexBolt key={`${x}-${z}`} position={[x, 1.08, z]} len={0.12} scale={0.66} color={C.chrome} washer />
              ))
            )}
          </BankExplode>
        </group>
      ))}
    </Part>
  );
}

function HeadBolts() {
  return (
    <Part name="head_bolts" system="fasteners" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          <BankExplode amount={2.7}>
            {[-0.85, -0.3, 0.3, 0.85].map((x) =>
              [-0.2, 0.2].map((z) => (
                <HexBolt key={`${x}-${z}`} position={[x, 0.9, z]} len={0.2} scale={0.7} washer />
              ))
            )}
          </BankExplode>
        </group>
      ))}
    </Part>
  );
}

// ── Induction (valley) ──────────────────────────────────────────────────────────
function IntakeManifold() {
  return (
    <Part name="intake_manifold" system="intake" position={[0, 0.55, 0]} explode={[0, 1.5, 0]}>
      {/* Valley body, tapering up to the carb pad
          (swappable: cast / Edelbrock Performer / polished RPM Air-Gap) */}
      <Surface swap color={C.alu} metalness={0.5} roughness={0.5} position={[0, 0, 0]}>
        <RBox args={[1.85, 0.34, 0.66]} />
      </Surface>
      <Surface swap color={C.alu} metalness={0.5} roughness={0.5} position={[0, 0.2, 0]}>
        <RBox args={[0.6, 0.12, 0.5]} />
      </Surface>
      {/* Runners reaching out to each bank */}
      {[1, -1].map((side) =>
        [-0.6, 0.6].map((x) => (
          <Surface swap key={`${side}-${x}`} color={C.alu} metalness={0.5} roughness={0.55} position={[x, 0.0, side * 0.34]} rotation={[side * 0.6, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.34, 12]} />
          </Surface>
        ))
      )}
    </Part>
  );
}

function Carburettor() {
  return (
    <Part name="carburetor" system="intake" position={[0, 0.86, 0]} explode={[0, 2.4, 0]}>
      {/* Carb body (swappable: Edelbrock satin / Holley gold / Sniper EFI black) */}
      <Surface swap color={C.alu} metalness={0.7} roughness={0.3}>
        <RBox args={[0.34, 0.24, 0.34]} />
      </Surface>
      {/* Float bowls + fuel inlet */}
      <Surface swap color={C.alu} metalness={0.7} roughness={0.3} position={[0.22, -0.02, 0]}>
        <RBox args={[0.12, 0.16, 0.24]} />
      </Surface>
      {/* Air horn */}
      <Surface swap color={C.alu} metalness={0.7} roughness={0.3} position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.08, 20]} />
      </Surface>
    </Part>
  );
}

function AirCleaner() {
  return (
    <Part name="air_cleaner" system="intake" position={[0, 1.08, 0]} explode={[0, 3.1, 0]}>
      {/* The iconic round chrome air cleaner — domed lid with a rolled rim
          (swappable: chrome / K&N / black powder-coat) */}
      <Turned
        swap
        profile={[
          [0, 0],
          [0.46, 0],
          [0.46, 0.045],
          [0.445, 0.085],
          [0.4, 0.13],
          [0.26, 0.17],
          [0, 0.185],
        ]}
        color={C.chrome}
        metalness={0.95}
        roughness={0.1}
        finish="smooth"
      />
      {/* Wing nut */}
      <Surface swap color={C.chrome} metalness={0.9} roughness={0.15} position={[0, 0.2, 0]} finish="smooth">
        <RBox args={[0.14, 0.04, 0.05]} />
      </Surface>
    </Part>
  );
}

function Distributor() {
  return (
    <Part name="distributor" system="intake" position={[-1.02, 0.62, 0]} explode={[-0.6, 2.2, 0]}>
      <Surface color={C.black} metalness={0.4} roughness={0.6}>
        <cylinderGeometry args={[0.12, 0.13, 0.26, 18]} />
      </Surface>
      {/* Domed cap */}
      <Turned
        profile={[
          [0, 0],
          [0.14, 0],
          [0.14, 0.05],
          [0.128, 0.085],
          [0.075, 0.115],
          [0, 0.12],
        ]}
        color="#2b2f36"
        metalness={0.35}
        roughness={0.6}
        position={[0, 0.17, 0]}
      />
      {/* Plug-wire towers */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <Surface key={i} color="#1d2025" metalness={0.3} roughness={0.7} position={[Math.cos(a) * 0.1, 0.23, Math.sin(a) * 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.05, 8]} />
          </Surface>
        );
      })}
    </Part>
  );
}

function IntakeBolts() {
  return (
    <Part name="intake_bolts" system="fasteners" position={[0, 0.7, 0]} explode={[0, 2.0, 0]}>
      {[-0.8, 0.8].map((x) =>
        [1, -1].map((side) => (
          <HexBolt key={`${x}-${side}`} position={[x, 0, side * 0.32]} rotation={[side * 0.6, 0, 0]} len={0.14} scale={0.66} washer />
        ))
      )}
    </Part>
  );
}

// ── Exhaust (headers) ────────────────────────────────────────────────────────────
function Headers() {
  return (
    <Part name="exhaust_manifold" system="exhaust" position={[0, 0, 0]} explode={[0, -1.8, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          {BANK_X.map((x) => (
            <group key={x}>
              {/* Cast flange bolting the port to the head
                  (swappable: cast iron / ceramic / chrome / black-coated) */}
              <Surface swap mat="castIron" position={[x, 0.72, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
                <RBox args={[0.15, 0.05, 0.2]} />
              </Surface>
              {/* Two bolts per port — the classic buried-behind-everything pair */}
              {[-0.085, 0.085].map((dy) => (
                <HexBolt key={dy} position={[x, 0.72 + dy, 0.37]} rotation={[-Math.PI / 2, 0, 0]} len={0.12} scale={0.55} washer />
              ))}
              {/* Primary tube sweeping down/out from the port */}
              <Surface swap mat="castIron" finish="rough" position={[x, 0.6, 0.46]} rotation={[-0.7, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.5, 14]} />
              </Surface>
            </group>
          ))}
          {/* Collector running along the bank */}
          <Surface swap mat="castIron" finish="rough" position={[0, 0.42, 0.66]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 1.9, 16]} />
          </Surface>
        </group>
      ))}
    </Part>
  );
}

// ── Driveline (bell housing + transmission) ──────────────────────────────────────
function BellHousing() {
  return (
    <Part name="bell_housing" system="driveline" position={[-1.42, -0.05, 0]} explode={[-2.4, 0, 0]}>
      {/* Bell flaring out from the block rear */}
      <Surface color={C.iron} metalness={0.5} roughness={0.5} position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.48, 0.36, 32]} />
      </Surface>
      {/* Round bell face the transmission bolts to */}
      <Surface color={C.iron} metalness={0.5} roughness={0.5} position={[-0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 32]} />
      </Surface>
      {/* Transmission stub */}
      <Surface color={C.steel} metalness={0.5} roughness={0.45} position={[-0.45, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.34, 0.42, 0.55, 28]} />
      </Surface>
      <Surface color={C.steel} metalness={0.5} roughness={0.45} position={[-0.78, -0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <RBox args={[0.22, 0.5, 0.5]} />
      </Surface>
    </Part>
  );
}

function Flywheel() {
  return (
    <Part name="flywheel" system="driveline" position={[-1.18, -0.05, 0]} explode={[-1.7, 0, 0]}>
      <Surface color={C.steel} metalness={0.75} roughness={0.35} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 36]} />
      </Surface>
      {/* Ring-gear teeth hint */}
      <Surface color={C.iron} metalness={0.7} roughness={0.4} position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.52, 0.52, 0.04, 48]} />
      </Surface>
    </Part>
  );
}

function BellhousingBolts() {
  return (
    <Part name="bellhousing_bolts" system="fasteners" position={[-1.46, -0.05, 0]} explode={[-3.0, 0, 0]}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <HexNut key={i} position={[0, Math.cos(a) * 0.55, Math.sin(a) * 0.55]} rotation={[0, 0, Math.PI / 2]} scale={0.78} washer />
        );
      })}
    </Part>
  );
}

// ── Cooling & front accessory drive ──────────────────────────────────────────────
function WaterPump() {
  return (
    <Part name="water_pump" system="cooling" position={[0, 0, 0]} explode={[2.4, 0, 0]}>
      {/* Cast housing bolted to the front of the block
          (swappable: cast / polished aluminum / chrome) */}
      <Surface swap color={C.alu} metalness={0.5} roughness={0.5} position={[1.42, 0.28, 0]}>
        <RBox args={[0.22, 0.5, 0.74]} />
      </Surface>
      {/* Shaft snout the pulley + fan ride on */}
      <Surface swap color={C.alu} metalness={0.55} roughness={0.45} position={[1.58, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.14, 0.16, 24]} />
      </Surface>
      <Pulley position={[BELT_PLANE_X, 0.28, 0]} r={0.2} />
      {/* Lower radiator-hose neck sweeping down to one side */}
      <Surface color={C.black} metalness={0.2} roughness={0.7} position={[1.44, -0.04, 0.36]} rotation={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.34, 16]} />
      </Surface>
      {/* Four mounting bolts on the housing face */}
      {[[0.18, 0.28], [0.18, -0.28], [-0.18, 0.28], [-0.18, -0.28]].map(([dy, dz], i) => (
        <HexBolt key={i} position={[1.54, 0.28 + dy, dz]} rotation={[0, 0, -Math.PI / 2]} len={0.1} scale={0.6} washer />
      ))}
    </Part>
  );
}

function CoolingFan() {
  return (
    <Part name="cooling_fan" system="cooling" position={[0, 0, 0]} explode={[3.4, 0, 0]}>
      {/* Whole fan + hub spins with the belt drive */}
      <Spin rate={1} position={[1.85, 0.28, 0]}>
        <Surface color={C.steel} metalness={0.7} roughness={0.4} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 20]} />
        </Surface>
        <Surface color={C.black} metalness={0.5} roughness={0.5} position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.05, 22]} />
        </Surface>
        {/* Six pitched blades radiating around the X (crank) axis */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <group key={i} rotation={[a, 0, 0]}>
              {/* Blade (swappable: steel / flex fan / black clutch fan) */}
              <Surface swap color="#26292f" metalness={0.4} roughness={0.6} position={[0.06, 0.34, 0]} rotation={[0.4, 0, 0]}>
                <RBox args={[0.04, 0.46, 0.2]} />
              </Surface>
            </group>
          );
        })}
      </Spin>
    </Part>
  );
}

function Alternator() {
  return (
    <Part name="alternator" system="charging" position={[0, 0, 0]} explode={[2.0, 1.4, 0.4]}>
      {/* Cylindrical case mounted high on the front, passenger side — turned with
          tapered end bells like a real cast alternator housing
          (swappable: cast Delco / chrome / black high-output) */}
      <Turned
        swap
        profile={[
          [0, 0],
          [0.1, 0],
          [0.15, 0.025],
          [0.17, 0.06],
          [0.17, 0.38],
          [0.15, 0.415],
          [0.1, 0.44],
          [0, 0.44],
        ]}
        color={C.alu}
        metalness={0.62}
        roughness={0.42}
        position={[0.94, 0.62, 0.52]}
        rotation={[0, 0, -Math.PI / 2]}
      />
      {/* Drive-end plate + shaft + V-belt pulley (in the belt plane) */}
      <Surface mat="steel" position={[1.39, 0.62, 0.52]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 26]} />
      </Surface>
      <Surface mat="steel" position={[1.45, 0.62, 0.52]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 14]} />
      </Surface>
      <Pulley position={[BELT_PLANE_X, 0.62, 0.52]} r={0.15} />

      {/* B+ output stud + the charge wire */}
      <Surface mat="brass" position={[1.0, 0.5, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.06, 10]} />
      </Surface>

      {/* ── Mounting (real layout): 1 pivot bolt at the BOTTOM, 2 bolts up TOP
            on the slotted adjuster bracket ─────────────────────────────────── */}
      {/* Bottom cast pivot ear + long pivot bolt into the block */}
      <Surface mat="castIron" position={[1.02, 0.44, 0.42]}>
        <RBox args={[0.09, 0.18, 0.12]} />
      </Surface>
      <HexBolt position={[1.02, 0.44, 0.28]} rotation={[Math.PI / 2, 0, 0]} len={0.3} scale={0.72} washer />

      {/* Top slotted adjuster bracket spanning alternator → intake */}
      <Surface mat="steel" position={[0.86, 0.85, 0.34]} rotation={[0.4, -0.5, 0]}>
        <RBox args={[0.44, 0.06, 0.05]} />
      </Surface>
      {/* Top bolt 1 — into the alternator's upper ear */}
      <HexBolt position={[1.07, 0.83, 0.46]} rotation={[Math.PI / 2, 0, 0]} len={0.12} scale={0.6} washer />
      {/* Top bolt 2 — anchoring the bracket to the block/intake */}
      <HexBolt position={[0.72, 0.87, 0.22]} rotation={[Math.PI / 2, 0, 0]} len={0.12} scale={0.6} washer />
    </Part>
  );
}

/** 2D convex hull (monotone chain), CCW. Used to route the belt as a rubber
 *  band around the pulley circles in the belt plane. */
function convexHull(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// All three accessory pulleys live in this single belt plane (X), like a real
// front accessory drive — otherwise a flat V-belt could never wrap them.
export const BELT_PLANE_X = 1.5;
export const BELT_PULLEYS = [
  { y: -0.18, z: 0, r: 0.215 }, // crank (lower)
  { y: 0.28, z: 0, r: 0.215 }, // water pump
  { y: 0.62, z: 0.52, r: 0.15 }, // alternator (upper)
];

function DriveBelt() {
  // The belt is the rubber-band (convex hull) wrapping all three pulleys:
  // straight tangents between them, arcs around each. Sampled then hulled.
  const samples = [];
  for (const p of BELT_PULLEYS) {
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      samples.push([p.y + Math.cos(a) * p.r, p.z + Math.sin(a) * p.r]);
    }
  }
  const loop = convexHull(samples).map(([y, z]) => [BELT_PLANE_X, y, z]);
  return (
    <Part name="drive_belt" system="cooling" position={[0, 0, 0]} explode={[2.9, 0.4, 0.1]}>
      <Hose swap points={loop} radius={0.026} color="#15171a" metalness={0.15} roughness={0.88} closed segments={150} />
    </Part>
  );
}

// ── Ignition (plug wires + boots) ────────────────────────────────────────────────
function SparkPlugs() {
  const cap = [-1.02, 0.92, 0]; // top of the distributor cap
  const wireColors = ['#c0392b', '#e67e22', '#9b59b6', '#16a085'];
  return (
    <Part name="spark_plugs" system="ignition" position={[0, 0, 0]} explode={[0, 2.6, 0]}>
      {[1, -1].map((side) => (
        <group key={side}>
          {/* Plugs thread into the outboard face of each head, in the bank frame.
              Built pointing outward (+z) so the white ceramic is clearly visible. */}
          <group position={VALLEY} rotation={[side * BANK_ANGLE, 0, 0]}>
            {BANK_X.map((x) => (
              <group key={x} position={[x, 0.62, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
                {/* Hex shell where the spark-plug socket grips */}
                <Surface color={C.steel} metalness={0.85} roughness={0.32}>
                  <cylinderGeometry args={[0.055, 0.055, 0.09, 6]} />
                </Surface>
                {/* White ceramic insulator – the recognisable part */}
                <Surface color="#ece7da" metalness={0.05} roughness={0.45} position={[0, 0.15, 0]}>
                  <cylinderGeometry args={[0.04, 0.05, 0.2, 18]} />
                </Surface>
                {/* Ribs on the insulator */}
                {[0.1, 0.17, 0.24].map((yy) => (
                  <Surface key={yy} color="#e3ddcd" metalness={0.05} roughness={0.5} position={[0, yy, 0]}>
                    <cylinderGeometry args={[0.052, 0.052, 0.02, 18]} />
                  </Surface>
                ))}
                {/* Rubber boot + terminal at the tip */}
                <Surface color="#16181d" metalness={0.2} roughness={0.8} position={[0, 0.31, 0]} finish="rubber">
                  <cylinderGeometry args={[0.05, 0.045, 0.12, 14]} />
                </Surface>
              </group>
            ))}
          </group>
          {/* A wire arcs from the cap to the top of each boot */}
          {BANK_X.map((x, i) => {
            const a = (((side > 0 ? 0 : 4) + i) / 8) * Math.PI * 2;
            const start = [cap[0] + Math.cos(a) * 0.11, cap[1], cap[2] + Math.sin(a) * 0.11];
            const boot = bankToEngine([x, 0.62, 0.62], side);
            const mid = [
              (start[0] + boot[0]) / 2,
              Math.max(start[1], boot[1]) + 0.24,
              (start[2] + boot[2]) / 2,
            ];
            return (
              <Hose
                key={x}
                points={[start, mid, boot]}
                radius={0.018}
                color={wireColors[i % wireColors.length]}
                metalness={0.12}
                roughness={0.72}
              />
            );
          })}
        </group>
      ))}
    </Part>
  );
}

// ── Fuel delivery ────────────────────────────────────────────────────────────────
function FuelPump() {
  return (
    <Part name="fuel_pump" system="fuel" position={[0, 0, 0]} explode={[2.0, -1.0, -0.4]}>
      {/* Mechanical pump bolted low on the front of the block */}
      <Surface color={C.steel} metalness={0.6} roughness={0.45} position={[1.18, -0.32, -0.42]}>
        <RBox args={[0.18, 0.22, 0.22]} />
      </Surface>
      {/* Domed diaphragm housing */}
      <Surface color={C.alu} metalness={0.55} roughness={0.45} position={[1.18, -0.18, -0.42]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 20]} />
      </Surface>
      {/* Steel fuel line running up to the carb inlet */}
      <Hose
        points={[
          [1.2, -0.2, -0.42],
          [1.0, 0.32, -0.32],
          [0.5, 0.72, -0.12],
          [0.26, 0.84, 0],
        ]}
        radius={0.022}
        color={C.steel}
        metalness={0.7}
        roughness={0.35}
        finish="machined"
      />
    </Part>
  );
}

// ── Valvetrain (under the covers) ────────────────────────────────────────────────
// Valve travel in scene units at full lift. Read live from activeCam each frame so
// swapping to a higher-lift camshaft in the Garage actually opens the valves further.

/**
 * One intake or exhaust valve and the gear that works it. Everything is driven
 * imperatively each frame from valveLift(id, crankAngle, which) — the same cam
 * timing the simulation uses — so the rocker rocks, the spring compresses, the
 * pushrod lifts, and the valve cracks open exactly when that cylinder's cam lobe
 * comes up. With the engine stopped the valve seats (lift forced to 0).
 *
 * Local frame: origin at the rocker pivot, +x toward the valve / −x toward the
 * pushrod, −y down into the head. The valve axis sits at x≈0.075.
 */
function ValveGear({ id, which }) {
  const valveRef = useRef(); // stem + head + retainer; slides down to open
  const springRef = useRef(); // anchored at the head seat, scales in y to compress
  const rockerRef = useRef(); // pivots about the stud, valve end dips as it opens
  const pushRef = useRef(); // rises with the cam lobe
  const fs = useContext(FailureContext);
  // The cam this engine runs on. Default (single-engine view) is the global
  // activeCam; in the arena each engine gets its own via CamContext, so a hot cam
  // and a stock cam visibly open their valves on different timing and lift.
  const cam = useContext(CamContext);
  const SPRING_FREE = 0.28; // seat→retainer length used to normalise compression
  useFrame(() => {
    const L = simState.rpm < 1 ? 0 : valveLift(id, simState.crankAngle, which, cam); // 0..1
    let drop = L * cam.maxLift;
    if (fs.float && simState.rpm > 1) {
      // Valve float: the springs can't keep up, so the valve stops following the
      // cam — it hangs off its seat and bounces instead of sealing.
      const sev = Math.min(1, fs.valvetrain / 2);
      const bounce = Math.abs(Math.sin(simState.crankAngle * 9 + id * 1.7));
      drop = drop * (1 - 0.3 * sev) + sev * cam.maxLift * 0.4 * bounce;
    }
    if (valveRef.current) valveRef.current.position.y = -drop;
    if (springRef.current) springRef.current.scale.y = 1 - drop / SPRING_FREE;
    // valve-end (x≈0.085) dip ≈ rocker arm × sinθ; track the valve's drop.
    if (rockerRef.current) rockerRef.current.rotation.z = -Math.asin(Math.min(0.95, drop / 0.085));
    // pushrod travel = valve lift ÷ rocker ratio (~1.5).
    if (pushRef.current) pushRef.current.position.y = drop / 1.5;
  });
  return (
    <group>
      {/* Pivot stud (fixed) the rocker rides on */}
      <Surface color={C.steel} metalness={0.85} roughness={0.28}>
        <cylinderGeometry args={[0.018, 0.018, 0.12, 10]} />
      </Surface>
      {/* Rocker arm — pivots about the stud */}
      <group ref={rockerRef}>
        <Surface color={C.steel} metalness={0.82} roughness={0.3} position={[0, 0.04, 0]}>
          <RBox args={[0.17, 0.035, 0.05]} />
        </Surface>
      </group>
      {/* Pushrod angling down into the valley toward the cam */}
      <group ref={pushRef}>
        <Surface color={C.steel} metalness={0.8} roughness={0.35} position={[-0.08, -0.22, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.012, 0.012, 0.42, 8]} />
        </Surface>
      </group>
      {/* Valve spring — anchored at the head seat, compresses as the valve opens */}
      <group ref={springRef} position={[0.075, -0.28, 0]}>
        {[0, 1, 2, 3, 4].map((k) => (
          <Surface key={k} color="#9aa1aa" metalness={0.7} roughness={0.4} position={[0, 0.03 + k * 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.035, 0.008, 6, 14]} />
          </Surface>
        ))}
      </group>
      {/* Valve — retainer + stem + sealing head; intake runs a larger head than
          exhaust. Slides down off its seat to open. */}
      <group ref={valveRef} position={[0.075, 0, 0]}>
        <Surface color={C.steel} metalness={0.85} roughness={0.28} position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.025, 14]} />
        </Surface>
        <Surface color={C.steel} metalness={0.85} roughness={0.25} position={[0, -0.2, 0]} finish="machined">
          <cylinderGeometry args={[0.011, 0.011, 0.36, 12]} />
        </Surface>
        <Surface color={which === 'exhaust' ? C.iron : C.steel} metalness={0.7} roughness={0.4} position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.02, which === 'intake' ? 0.058 : 0.05, 0.03, 18]} />
        </Surface>
      </group>
    </group>
  );
}

function Valvetrain() {
  return (
    <Part name="valvetrain" system="head" position={[0, 0, 0]} explode={[0, 0, 0]}>
      {[1, -1].map((side) => (
        <group key={side} {...bankProps(side)}>
          <BankExplode amount={3.1}>
            {BANK_X.map((x, i) => {
              const id = BANK_IDS[side][3 - i];
              return (
                <group key={x} position={[x, 0.92, 0]}>
                  {/* intake valve inboard (toward the valley), exhaust outboard */}
                  <group position={[0, 0, -0.13]}>
                    <ValveGear id={id} which="intake" />
                  </group>
                  <group position={[0, 0, 0.13]}>
                    <ValveGear id={id} which="exhaust" />
                  </group>
                </group>
              );
            })}
          </BankExplode>
        </group>
      ))}
    </Part>
  );
}

// ── Cooling outlet ────────────────────────────────────────────────────────────────
function Thermostat() {
  return (
    <Part name="thermostat" system="cooling" position={[0, 0, 0]} explode={[1.6, 0.8, 0]}>
      {/* Housing on the front of the intake */}
      <Surface color={C.alu} metalness={0.55} roughness={0.45} position={[0.92, 0.66, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 20]} />
      </Surface>
      {/* Outlet neck */}
      <Surface color={C.alu} metalness={0.55} roughness={0.45} position={[1.04, 0.71, 0]} rotation={[0, 0, 0.7]}>
        <cylinderGeometry args={[0.08, 0.08, 0.16, 18]} />
      </Surface>
      {/* Two flange bolts */}
      {[-0.13, 0.13].map((z) => (
        <HexBolt key={z} position={[0.92, 0.77, z]} len={0.08} scale={0.55} washer />
      ))}
      {/* Upper radiator hose sweeping forward to the (implied) radiator */}
      <Hose
        points={[
          [1.1, 0.76, 0],
          [1.4, 0.66, 0],
          [1.72, 0.48, 0],
        ]}
        radius={0.075}
        color={C.black}
        metalness={0.2}
        roughness={0.7}
      />
    </Part>
  );
}

// ── Cranking ──────────────────────────────────────────────────────────────────────
function Starter() {
  return (
    <Part name="starter" system="driveline" position={[0, 0, 0]} explode={[-1.6, -1.2, 0.5]}>
      {/* Motor body, parallel to the crank, low on the bell housing */}
      <Surface color={C.iron} metalness={0.5} roughness={0.5} position={[-1.0, -0.46, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.52, 22]} />
      </Surface>
      {/* Solenoid riding on top */}
      <Surface color={C.steel} metalness={0.6} roughness={0.45} position={[-1.0, -0.29, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.36, 18]} />
      </Surface>
      {/* Drive nose toward the flywheel ring gear */}
      <Surface color={C.iron} metalness={0.5} roughness={0.5} position={[-1.27, -0.43, 0.42]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.12, 0.18, 20]} />
      </Surface>
      {/* Three mounting bolts into the block: two through the nose flange, one
          at the rear (the user's spec — and the hardest to start by feel) */}
      <HexBolt position={[-1.24, -0.52, 0.3]} rotation={[Math.PI / 2, 0, 0]} len={0.18} scale={0.66} washer />
      <HexBolt position={[-1.24, -0.4, 0.3]} rotation={[Math.PI / 2, 0, 0]} len={0.18} scale={0.66} washer />
      <HexBolt position={[-0.8, -0.48, 0.3]} rotation={[Math.PI / 2, 0, 0]} len={0.18} scale={0.66} washer />

      {/* Heavy braided ground strap — always lands on one starter bolt */}
      <Hose
        points={[
          [-0.8, -0.46, 0.36],
          [-0.74, -0.34, 0.3],
          [-0.7, -0.26, 0.2],
        ]}
        radius={0.022}
        color="#3c3f44"
        metalness={0.55}
        roughness={0.5}
        finish="machined"
      />
      {/* Battery cable to the solenoid (thick, insulated) */}
      <Hose
        points={[
          [-0.86, -0.22, 0.46],
          [-0.66, -0.02, 0.52],
          [-0.46, 0.12, 0.56],
        ]}
        radius={0.03}
        color="#171717"
        metalness={0.2}
        roughness={0.72}
      />
      {/* Solenoid battery post */}
      <Surface mat="brass" position={[-0.86, -0.22, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.06, 10]} />
      </Surface>
    </Part>
  );
}

// ── Lubrication ─────────────────────────────────────────────────────────────────
function OilFilter() {
  // Classic blue spin-on canister: rolled base seam, straight body, domed top.
  const canister = [
    [0, 0],
    [0.1, 0],
    [0.13, 0.03],
    [0.13, 0.055],
    [0.118, 0.07], // rolled seam
    [0.13, 0.085],
    [0.13, 0.25],
    [0.116, 0.285],
    [0.07, 0.305],
    [0, 0.31],
  ];
  return (
    <Part name="oil_filter" system="block" position={[0, 0, 0]} explode={[-0.6, -1.4, 0.8]}>
      {/* Threaded mounting base off the side of the block */}
      <Surface color={C.steel} metalness={0.6} roughness={0.42} position={[-0.85, -0.42, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
      </Surface>
      {/* Spin-on canister (swappable: ACDelco / FRAM / Mobil 1 / K&N) */}
      <Turned
        swap
        profile={canister}
        color="#2b6cb0"
        metalness={0.5}
        roughness={0.46}
        position={[-0.85, -0.42, 0.37]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </Part>
  );
}

// ── Crankcase ventilation ────────────────────────────────────────────────────────
function Breather() {
  const filler = bankToEngine([0.6, 1.16, 0], 1); // breather on the front cover
  const pcv = bankToEngine([-0.6, 1.16, 0], -1); // PCV valve on the rear cover
  return (
    <Part name="pcv_breather" system="intake" position={[0, 0, 0]} explode={[0, 3.0, 0.3]}>
      <Surface color={C.chrome} metalness={0.9} roughness={0.15} position={filler}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
      </Surface>
      <Surface color="#3a3f47" metalness={0.5} roughness={0.5} position={pcv}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 14]} />
      </Surface>
      {/* Vacuum hose from the PCV valve back to the base of the carb */}
      <Hose
        points={[pcv, [-0.2, 1.0, -0.18], [0.02, 0.92, 0]]}
        radius={0.025}
        color={C.black}
        metalness={0.2}
        roughness={0.7}
      />
    </Part>
  );
}

// ── Mounting ─────────────────────────────────────────────────────────────────────
function MotorMounts() {
  return (
    <Part name="motor_mounts" system="mounting" position={[0, 0, 0]} explode={[0, -1.8, 0]}>
      {[1, -1].map((side) => (
        <group key={side}>
          {/* Block-side cast bracket bolted to the side of the block */}
          <Surface mat="castIron" position={[0.35, -0.34, side * 0.56]}>
            <RBox args={[0.24, 0.2, 0.12]} />
          </Surface>
          {/* Two bracket-to-block bolts */}
          {[-0.07, 0.07].map((dy) => (
            <HexBolt key={dy} position={[0.35, -0.3 + dy, side * 0.5]} rotation={[Math.PI / 2, 0, 0]} len={0.14} scale={0.6} washer />
          ))}
          {/* Rubber isolator puck */}
          <Surface mat="rubber" position={[0.35, -0.5, side * 0.62]}>
            <cylinderGeometry args={[0.1, 0.12, 0.16, 24]} />
          </Surface>
          {/* Frame-side foot */}
          <Surface mat="steel" position={[0.35, -0.62, side * 0.64]}>
            <RBox args={[0.32, 0.08, 0.28]} />
          </Surface>
          {/* The one long through-bolt clamping the isolator (head outboard,
              nut on the inboard side) — the bolt you actually wrench on */}
          <HexBolt
            position={[0.35, -0.5, side * 0.78]}
            rotation={[Math.PI / 2, 0, 0]}
            len={0.34}
            scale={0.85}
            washer
          />
          <HexNut position={[0.35, -0.5, side * 0.46]} rotation={[Math.PI / 2, 0, 0]} scale={0.85} washer />
        </group>
      ))}
    </Part>
  );
}

// ── Throttle linkage ──────────────────────────────────────────────────────────────
function ThrottleLinkage() {
  return (
    <Part name="throttle_linkage" system="intake" position={[0, 0, 0]} explode={[0, 2.6, 0.4]}>
      {/* Throttle lever on the carb */}
      <Surface color={C.steel} metalness={0.8} roughness={0.3} position={[0.2, 0.84, 0.18]} rotation={[0, 0, 0.4]}>
        <RBox args={[0.03, 0.14, 0.02]} />
      </Surface>
      {/* Throttle rod running back along the intake */}
      <Surface color={C.steel} metalness={0.82} roughness={0.3} position={[-0.1, 0.8, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 10]} />
      </Surface>
      {/* Return spring (coils) near the lever */}
      {[0, 1, 2, 3].map((k) => (
        <Surface key={k} color="#9aa1aa" metalness={0.7} roughness={0.4} position={[0.12 - k * 0.03, 0.78, 0.18]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.022, 0.006, 6, 12]} />
        </Surface>
      ))}
    </Part>
  );
}

// ── Ignition advance ──────────────────────────────────────────────────────────────
function VacuumAdvance() {
  return (
    <Part name="vacuum_advance" system="ignition" position={[0, 0, 0]} explode={[-0.6, 2.0, 0.3]}>
      {/* Round vacuum-advance canister clipped to the distributor */}
      <Surface color={C.steel} metalness={0.75} roughness={0.35} position={[-1.16, 0.66, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 20]} />
      </Surface>
      {/* Vacuum line to the base of the carb */}
      <Hose
        points={[
          [-1.16, 0.66, 0.16],
          [-0.7, 0.78, 0.1],
          [-0.1, 0.86, 0.05],
          [0.05, 0.88, 0],
        ]}
        radius={0.018}
        color="#2b2f36"
        metalness={0.2}
        roughness={0.7}
      />
    </Part>
  );
}

// ── Senders ───────────────────────────────────────────────────────────────────────
function Senders() {
  return (
    <Part name="senders" system="block" position={[0, 0, 0]} explode={[0, 1.2, -0.6]}>
      {/* Coolant-temp sender in the intake front */}
      <Surface color="#9a7b3f" metalness={0.7} roughness={0.4} position={[0.78, 0.6, 0.12]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.1, 12]} />
      </Surface>
      {/* Oil-pressure sender at the rear of the valley */}
      <Surface color="#9a7b3f" metalness={0.7} roughness={0.4} position={[-0.85, 0.4, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.12, 12]} />
      </Surface>
      {/* Signal wires up toward the harness */}
      <Hose points={[[0.78, 0.66, 0.12], [0.6, 0.82, 0.0], [0.2, 0.96, -0.1]]} radius={0.01} color="#c0392b" metalness={0.1} roughness={0.7} />
      <Hose points={[[-0.85, 0.47, 0], [-0.6, 0.72, -0.1], [-0.2, 0.96, -0.1]]} radius={0.01} color="#2980b9" metalness={0.1} roughness={0.7} />
    </Part>
  );
}

// ── Service detail ────────────────────────────────────────────────────────────────
function Dipstick() {
  return (
    <Part name="dipstick" system="block" position={[0, 0, 0]} explode={[0.4, 1.4, -0.2]}>
      <Surface color={C.steel} metalness={0.7} roughness={0.4} position={[0.62, 0.16, -0.52]} rotation={[0.18, 0, 0.16]}>
        <cylinderGeometry args={[0.02, 0.02, 0.72, 12]} />
      </Surface>
      {/* Yellow loop handle */}
      <Surface color="#e0c14a" metalness={0.55} roughness={0.45} position={[0.585, 0.55, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.014, 8, 18]} />
      </Surface>
    </Part>
  );
}

export default function EngineAssembly() {
  return (
    <group name="engine-assembly" position={[0, 0.15, 0]}>
      <CylinderBlock />
      <CombustionFlash />
      <OilPan />
      <PanBolts />
      <Crankshaft />
      <Pistons />
      <Camshaft />
      <CylinderHeads />
      <ValveCovers />
      <CoverBolts />
      <HeadBolts />
      <IntakeManifold />
      <Carburettor />
      <AirCleaner />
      <Distributor />
      <IntakeBolts />
      <Headers />
      <BellHousing />
      <Flywheel />
      <BellhousingBolts />
      <WaterPump />
      <CoolingFan />
      <Alternator />
      <DriveBelt />
      <SparkPlugs />
      <FuelPump />
      <Dipstick />
      <Valvetrain />
      <Thermostat />
      <Starter />
      <OilFilter />
      <Breather />
      <MotorMounts />
      <ThrottleLinkage />
      <VacuumAdvance />
      <Senders />
      <FailureEffects />
    </group>
  );
}
