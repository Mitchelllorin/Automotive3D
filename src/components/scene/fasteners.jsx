/**
 * Procedural fasteners – hex bolts, hex nuts, and washers.
 *
 * Each fastener models its head pointing along its local +Y axis with the
 * shank running down −Y (i.e. threaded into the surface the group is placed on).
 * Callers position/rotate the fastener so +Y aligns with the mounting surface
 * normal. Fasteners use <Surface> so they pick up the enclosing Part's
 * selection / hover / isolate highlighting, and they are carried apart during
 * teardown by their parent Part's explode vector.
 */
import { Surface } from './Part';

const STEEL = '#b9c0c9';
const STEEL_DARK = '#3a3f47';

/** Hex-head bolt. `len` is shank length below the head; `washer` adds one under it. */
export function HexBolt({ position = [0, 0, 0], rotation, scale = 1, len = 0.2, color = STEEL, washer = false }) {
  const headH = 0.055;
  const headR = 0.075;
  const shankR = 0.028;
  const lift = washer ? 0.026 : 0; // raise the head so it rests on the washer
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Flat washer seated under the head */}
      {washer && (
        <Surface color={STEEL_DARK} metalness={0.72} roughness={0.5} position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[headR * 0.92, 0.017, 8, 22]} />
        </Surface>
      )}
      {/* Hex head – a 6-sided cylinder sitting on the surface */}
      <Surface
        color={color}
        metalness={0.85}
        roughness={0.35}
        position={[0, lift + headH / 2, 0]}
      >
        <cylinderGeometry args={[headR, headR, headH, 6]} />
      </Surface>
      {/* Shank threaded down into the part */}
      <Surface
        color={color}
        metalness={0.8}
        roughness={0.4}
        position={[0, -len / 2, 0]}
      >
        <cylinderGeometry args={[shankR, shankR, len, 12]} />
      </Surface>
    </group>
  );
}

/** Hex nut – a 6-sided prism with a dark threaded bore; `washer` adds one under it. */
export function HexNut({ position = [0, 0, 0], rotation, scale = 1, color = STEEL, washer = false }) {
  const h = 0.06;
  const r = 0.078;
  const lift = washer ? 0.022 : 0;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {washer && (
        <Surface color={STEEL_DARK} metalness={0.72} roughness={0.5} position={[0, -h / 2 + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r * 0.95, 0.017, 8, 22]} />
        </Surface>
      )}
      <Surface color={color} metalness={0.85} roughness={0.35} position={[0, lift, 0]}>
        <cylinderGeometry args={[r, r, h, 6]} />
      </Surface>
      {/* Threaded bore – slightly proud so it reads as a hole from any angle */}
      <mesh position={[0, lift, 0]}>
        <cylinderGeometry args={[0.03, 0.03, h * 1.2, 12]} />
        <meshStandardMaterial color={STEEL_DARK} metalness={0.5} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Flat washer – thin ring placed under a bolt head. */
export function Washer({ position = [0, 0, 0], rotation, scale = 1, color = STEEL_DARK }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Surface color={color} metalness={0.7} roughness={0.5} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.014, 8, 18]} />
      </Surface>
    </group>
  );
}
