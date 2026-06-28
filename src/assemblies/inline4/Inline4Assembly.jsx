/**
 * Inline4Assembly — a procedurally-built turbocharged DOHC inline-four, the second
 * hero model and a deliberate visual contrast to the Small-Block V8: one upright
 * aluminium block instead of a 90° V, a black crinkle cam cover, a polished intake
 * on one side and a ceramic-coated 4-into-1 header feeding a turbo snail on the
 * other. Same composition rules as the V8 (selectable <Part>s, explode-aware,
 * crank-driven animation off simState), so it drops straight into the scene, the
 * builder, and the Battle Arena via the registry.
 *
 * Local frame: crank along X (front = +X), cylinders upright (Y), intake on +Z,
 * exhaust + turbo on -Z. Reads BuildContext/FailureContext defaults so it works in
 * the single-engine view and as either arena contestant unchanged.
 */
import { useRef, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Part, { Surface, RBox } from '../../components/scene/Part';
import { simState } from '../../lib/simState';
import { explodeState } from '../../lib/explodeState';
import { GeomContext } from '../../lib/engineInstance';

// Drawn at the base 2.0 turbo-four's bore/stroke (86 mm square); a custom built on
// this platform feeds its designed dimensions through GeomContext, normalised here.
const BASE_BORE_IN = 3.386;
const BASE_STROKE_IN = 3.386;
const boreFactorOf = (g) => (g?.boreIn ?? BASE_BORE_IN) / BASE_BORE_IN;
const strokeFactorOf = (g) => (g?.strokeIn ?? BASE_STROKE_IN) / BASE_STROKE_IN;

// Modern turbo-four palette: raw/satin aluminium, black plastic cover, ceramic
// header, polished charge pipes — nothing like the orange iron V8.
const C = {
  block: '#9fa6ad', // satin cast aluminium block
  blockDark: '#7d848c',
  deck: '#c6cbd2',
  bore: '#0e1012',
  head: '#a7adb4',
  cover: '#1a1c20', // black crinkle cam cover
  alu: '#c2c7ce', // polished intake
  poly: '#cdd2d8', // polished charge pipe
  ceramic: '#d8d4cc', // ceramic-coated header
  iron: '#4f5358',
  steel: '#aab0b8',
  black: '#15171b',
  red: '#c0392b',
};

// Four cylinders in a row along the crank (X). Front (+X) first.
const BORE_X = [-0.6, -0.2, 0.2, 0.6];
const DECK_Y = 0.55; // top of the block / piston TDC plane
const THROW = 0.12; // crank radius (½ stroke)
const ROD = 0.36; // rod length
// Even-fire 1-3-4-2: outer pair (1 & 4) rise together, inner pair (2 & 3) opposite.
const PHASE = [0, Math.PI, Math.PI, 0];

/** Slider-crank piston height drop from TDC for a cylinder at the live crank angle. */
function pistonDrop(i, a) {
  const t = a + PHASE[i];
  const y = THROW * Math.cos(t) + Math.sqrt(ROD * ROD - THROW * THROW * Math.sin(t) * Math.sin(t));
  return THROW + ROD - y; // 0 at TDC, 2·THROW at BDC
}

/** Spin children about the crank (X) axis at the live crank angle × rate. */
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

/** Lathe (revolved) Surface from a [radius, y] profile — pulleys, turbo housings. */
function Turned({ profile, segments = 48, ...props }) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return (
    <Surface {...props}>
      <latheGeometry args={[pts, segments]} />
    </Surface>
  );
}

/** A reciprocating piston + rod, shown when the assembly is exploded/cut away. */
function Piston({ i, x }) {
  const ref = useRef();
  const geom = useContext(GeomContext);
  const sf = strokeFactorOf(geom); // longer stroke → travels further
  const bf = boreFactorOf(geom); // bigger bore → wider piston
  useFrame(() => {
    if (ref.current) ref.current.position.y = DECK_Y - 0.12 - pistonDrop(i, simState.crankAngle) * sf;
  });
  return (
    <group ref={ref} position={[x, DECK_Y - 0.12, 0]} scale={[bf, 1, bf]}>
      {/* slug */}
      <Surface color={C.steel} metalness={0.8} roughness={0.3}>
        <cylinderGeometry args={[0.11, 0.11, 0.16, 20]} />
      </Surface>
      {/* rings */}
      <Surface color={C.black} metalness={0.6} roughness={0.5} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.114, 0.114, 0.02, 20]} />
      </Surface>
      {/* connecting rod */}
      <Surface color={C.steel} metalness={0.85} roughness={0.28} position={[0, -0.24, 0]}>
        <RBox args={[0.05, 0.34, 0.09]} />
      </Surface>
    </group>
  );
}

/** Lift children straight up by `amount` at full explode (teardown). */
function Lift({ amount, children }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.position.y = explodeState.factor * amount;
  });
  return <group ref={ref}>{children}</group>;
}

export default function Inline4Assembly() {
  return (
    <group name="inline4-assembly" position={[0, 0.15, 0]}>
      {/* ── Cylinder block — one upright aluminium casting with four bores ── */}
      <Part name="engine_block" system="block" position={[0, 0, 0]} explode={[0, 0, 0]}>
        <Surface color={C.block} metalness={0.55} roughness={0.5} finish="matte" position={[0, 0.08, 0]}>
          <RBox args={[1.62, 0.92, 0.66]} />
        </Surface>
        {/* machined deck */}
        <Surface color={C.deck} metalness={0.85} roughness={0.22} position={[0, DECK_Y, 0]}>
          <RBox args={[1.62, 0.05, 0.66]} />
        </Surface>
        {/* four bore openings in the deck */}
        {BORE_X.map((x) => (
          <Surface key={x} color={C.bore} metalness={0.3} roughness={0.7} position={[x, DECK_Y + 0.005, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 24]} />
          </Surface>
        ))}
        {/* cast side ribs (water jacket) on the intake face */}
        {[-0.4, 0, 0.4].map((x) => (
          <Surface key={x} color={C.blockDark} metalness={0.5} roughness={0.6} position={[x, 0.1, 0.34]}>
            <RBox args={[0.06, 0.7, 0.03]} />
          </Surface>
        ))}
      </Part>

      {/* ── Crankshaft (spins) + counterweights ── */}
      <Part name="crankshaft" system="block" position={[0, -0.15, 0]} explode={[0, -1.2, 0]}>
        <Spin rate={1}>
          <Surface color={C.steel} metalness={0.88} roughness={0.28} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 1.7, 18]} />
          </Surface>
          {BORE_X.map((x, i) => (
            <group key={x} rotation={[PHASE[i], 0, 0]}>
              <Surface color={C.iron} metalness={0.7} roughness={0.4} position={[x, -0.12, 0]}>
                <cylinderGeometry args={[0.17, 0.17, 0.08, 18]} />
              </Surface>
            </group>
          ))}
        </Spin>
      </Part>

      {/* ── Pistons + rods (revealed on teardown/cutaway) ── */}
      <Part name="pistons" system="block" position={[0, 0, 0]} explode={[0, 0, 0]}>
        <Lift amount={1.5}>
          {BORE_X.map((x, i) => (
            <Piston key={x} i={i} x={x} />
          ))}
        </Lift>
      </Part>

      {/* ── Cylinder head ── */}
      <Part name="cylinder_head" system="head" position={[0, DECK_Y + 0.16, 0]} explode={[0, 1.4, 0]}>
        <Surface color={C.head} metalness={0.55} roughness={0.5} finish="matte">
          <RBox args={[1.6, 0.26, 0.64]} />
        </Surface>
        {/* intake & exhaust port flanges */}
        <Surface color={C.blockDark} metalness={0.5} roughness={0.55} position={[0, 0, 0.34]}>
          <RBox args={[1.5, 0.16, 0.06]} />
        </Surface>
        <Surface color={C.iron} metalness={0.6} roughness={0.5} position={[0, 0, -0.34]}>
          <RBox args={[1.5, 0.16, 0.06]} />
        </Surface>
      </Part>

      {/* ── Cam cover — black crinkle DOHC cover + coil pack ── */}
      <Part name="valve_cover" system="head" position={[0, DECK_Y + 0.42, 0]} explode={[0, 2.1, 0]}>
        <Surface color={C.cover} metalness={0.2} roughness={0.8} finish="painted">
          <RBox args={[1.56, 0.2, 0.6]} />
        </Surface>
        {/* raised rib lettering strip */}
        <Surface color={C.block} metalness={0.6} roughness={0.4} position={[0, 0.11, 0]}>
          <RBox args={[1.2, 0.04, 0.14]} />
        </Surface>
        {/* coil-pack towers over each plug */}
        {BORE_X.map((x) => (
          <Surface key={x} name="spark_plugs" color={C.black} metalness={0.3} roughness={0.7} position={[x, 0.16, 0]}>
            <RBox args={[0.12, 0.1, 0.16]} />
          </Surface>
        ))}
      </Part>

      {/* ── Intake manifold (+Z): polished plenum, four runners, throttle body ── */}
      <Part name="intake_manifold" system="induction" position={[0, DECK_Y + 0.12, 0.62]} explode={[0, 0.4, 1.3]}>
        <Surface color={C.alu} metalness={0.8} roughness={0.25} position={[0, 0.12, 0.06]}>
          <RBox args={[1.4, 0.28, 0.3]} />
        </Surface>
        {/* curved runners down to the head intake flange */}
        {BORE_X.map((x) => (
          <Surface key={x} color={C.alu} metalness={0.78} roughness={0.28} position={[x, -0.05, -0.12]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.34, 16]} />
          </Surface>
        ))}
        {/* throttle body on the front face */}
        <Turned
          name="air_cleaner"
          color={C.poly}
          metalness={0.85}
          roughness={0.2}
          position={[0.78, 0.12, 0.06]}
          rotation={[0, 0, Math.PI / 2]}
          profile={[
            [0, 0], [0.1, 0], [0.1, 0.06], [0.12, 0.06], [0.12, 0.14], [0.1, 0.14], [0.1, 0.2], [0, 0.2],
          ]}
        />
      </Part>

      {/* ── 4-into-1 ceramic header (-Z) ── */}
      <Part name="exhaust_manifold" system="exhaust" position={[0, DECK_Y + 0.02, -0.48]} explode={[0, -0.2, -1.2]}>
        {BORE_X.map((x) => (
          <Surface key={x} color={C.ceramic} metalness={0.5} roughness={0.45} position={[x, 0, 0.06]} rotation={[-0.7, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.4, 14]} />
          </Surface>
        ))}
        {/* collector funnelling to the turbo */}
        <Surface color={C.ceramic} metalness={0.5} roughness={0.45} position={[0.55, -0.28, -0.16]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.13, 0.6, 16]} />
        </Surface>
      </Part>

      {/* ── Turbocharger (-Z, low): turbine snail + compressor + plumbing ── */}
      <Part name="oil_filter" system="exhaust" position={[0.95, DECK_Y - 0.42, -0.5]} explode={[1.2, -0.4, -1.0]}>
        {/* turbine housing (snail) */}
        <Turned
          color={C.iron}
          metalness={0.6}
          roughness={0.4}
          rotation={[Math.PI / 2, 0, 0]}
          profile={[
            [0, -0.12], [0.18, -0.12], [0.22, -0.04], [0.22, 0.04], [0.18, 0.12], [0, 0.12],
          ]}
        />
        {/* center cartridge */}
        <Surface color={C.steel} metalness={0.85} roughness={0.3} position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.16, 16]} />
        </Surface>
        {/* compressor housing */}
        <Turned
          color={C.poly}
          metalness={0.85}
          roughness={0.2}
          position={[0, 0, -0.36]}
          rotation={[Math.PI / 2, 0, 0]}
          profile={[
            [0, -0.1], [0.16, -0.1], [0.2, -0.02], [0.2, 0.06], [0.14, 0.12], [0, 0.12],
          ]}
        />
        {/* compressor outlet pipe up toward the intake */}
        <Surface color={C.poly} metalness={0.85} roughness={0.2} position={[-0.1, 0.3, -0.36]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 14]} />
        </Surface>
      </Part>

      {/* ── Oil pan ── */}
      <Part name="oil_pan" system="block" position={[0, -0.5, 0]} explode={[0, -1.8, 0]}>
        <Surface color={C.steel} metalness={0.7} roughness={0.4} position={[0, -0.04, 0]}>
          <RBox args={[1.4, 0.34, 0.56]} />
        </Surface>
        <Surface color={C.steel} metalness={0.7} roughness={0.4} position={[0.4, -0.26, 0]}>
          <RBox args={[0.5, 0.14, 0.44]} />
        </Surface>
      </Part>

      {/* ── Front accessory drive: crank pulley + belt + cam-drive pulley ── */}
      <Part name="drive_belt" system="accessory" position={[0.86, 0, 0]} explode={[1.6, 0, 0]}>
        {/* crank pulley (spins) */}
        <Spin rate={1} position={[0, -0.15, 0]}>
          <Turned
            color={C.iron}
            metalness={0.7}
            roughness={0.35}
            rotation={[0, 0, Math.PI / 2]}
            profile={[
              [0, 0], [0.16, 0], [0.16, 0.03], [0.12, 0.05], [0.16, 0.07], [0.16, 0.1], [0, 0.1],
            ]}
          />
        </Spin>
        {/* cam-drive pulley up top (half crank speed) */}
        <Spin rate={0.5} position={[0, DECK_Y + 0.3, 0]}>
          <Surface color={C.alu} metalness={0.8} roughness={0.3} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.05, 20]} />
          </Surface>
        </Spin>
        {/* timing belt loop */}
        <Surface color={C.black} metalness={0.2} roughness={0.8} position={[0, 0.2, 0]}>
          <RBox args={[0.04, 0.95, 0.04]} />
        </Surface>
      </Part>
    </group>
  );
}
