/**
 * ============================================================================
 *  F.U.S.E.™ — Failure Understanding Simulation Engine  (mechanical domain)
 *  Copyright © 2025–2026 Mitchell Lorin / CircuiTry3D.  All Rights Reserved.
 *
 *  FUSE™ is a proprietary, registered trademark of CircuiTry3D. This is a
 *  faithful port of the CircuiTry3D engine (public/js/component-failure-engine.js,
 *  v2.0.0) into the mechanical domain for Automotive3D — same architecture, same
 *  severity model, same single-source-of-truth philosophy, with electrical
 *  families swapped for engine families. One engine, badged across the app series.
 * ============================================================================
 *
 *  WHAT IT DOES
 *  ------------
 *  Every component is resolved to a canonical *family*. Each family has a set of
 *  failure *modes*, and each mode is a pair of pure functions:
 *
 *      trigger(metrics, props)  → boolean   — are we in this failure regime?
 *      severity(metrics, props) → 0 … 3     — how far gone? (continuous)
 *
 *  `detectFailure(component, metrics)` evaluates every mode and returns the worst
 *  one, with a severity score, a human-readable name, a renderer effect key, and a
 *  physics-accurate description of what is happening inside the part:
 *
 *      0 = OK   ·   1 = Stressed   ·   2 = Critical (failed)   ·   3 = Destroyed
 *
 *  It has NO Three.js or DOM dependencies — pure data + functions, so it runs the
 *  same in the 3D view, a unit test, or a server grader. The numbers are judged by
 *  a professional mechanic: every trigger keys off a real spec (cam rpm ceiling,
 *  compression ratio, fuel octane, cooling capacity), never a fudge.
 */

export const FUSE_VERSION = '2.0.0-mech';

/** Severity bands, shared by the UI and the renderer. */
export const SEVERITY = {
  OK: 0,
  STRESSED: 1,
  CRITICAL: 2, // == failed
  DESTROYED: 3,
};

export const SEVERITY_LABELS = ['OK', 'Stressed', 'Critical', 'Destroyed'];

/** Renderer effect keys a failure can request (mirrors the CircuiTry3D set, mechanical). */
export const VISUALS = ['float', 'bent', 'knock', 'holed', 'steam', 'boilover', 'grenade', 'glow', 'smoke'];

const min = (v, hi = 3) => Math.min(v, hi);

// ── Family resolution ─────────────────────────────────────────────────────────
// Map a raw part/system type to a canonical physics family. Same precedence as the
// electrical engine: alias map → exact profile key → prefix scan → prop signature.
const FAMILY_MAP = {
  cam: 'valvetrain',
  camshaft: 'valvetrain',
  valves: 'valvetrain',
  valvetrain: 'valvetrain',
  springs: 'valvetrain',
  piston: 'pistons',
  pistons: 'pistons',
  combustion: 'pistons',
  rings: 'pistons',
  rod: 'bottom_end',
  rods: 'bottom_end',
  crank: 'bottom_end',
  bearings: 'bottom_end',
  bottom_end: 'bottom_end',
  cooling: 'cooling',
  water_pump: 'cooling',
  radiator: 'cooling',
};

export function resolveFamily(rawType, props) {
  if (!rawType || typeof rawType !== 'string') return 'generic';
  const t = rawType.toLowerCase().trim().replace(/\s+/g, '_');
  if (FAMILY_MAP[t]) return FAMILY_MAP[t];
  if (FAILURE_PROFILES[t]) return t;
  for (const [kw, fam] of Object.entries(FAMILY_MAP)) {
    if (kw.length < 3) continue;
    if (t.startsWith(kw)) return fam;
  }
  if (props && typeof props === 'object') {
    if (typeof props.redline === 'number') return 'valvetrain';
    if (typeof props.compressionRatio === 'number') return 'pistons';
    if (typeof props.coolingCapacity === 'number') return 'cooling';
  }
  return 'generic';
}

// ── Mechanical failure profiles ───────────────────────────────────────────────
// Each mode: { name, visual, physicalDescription, trigger(metrics,props), severity(metrics,props) }.
// Severity scales continuously: 1 ≈ first warning, 2 = failed, 3 = destroyed.

/** Octane the charge actually demands, from compression + load + intake-air heat. */
export function requiredOctane(m) {
  const cr = m.compressionRatio ?? 9;
  const load = m.loadFraction ?? 1;
  const heat = Math.max(0, (m.ambientF ?? 75) - 75);
  // ~87 at 8.5:1, ~91 at 9.5, ~95 at 10.5 — matching pump-gas reality — plus a
  // little more under heavy load and on a hot day.
  return 87 + (cr - 8.5) * 4 + load * 2 + heat / 10;
}

export const FAILURE_PROFILES = {
  valvetrain: {
    modes: {
      valve_float: {
        name: 'Valve Float',
        visual: 'float',
        physicalDescription:
          "Past the cam's safe rpm the valve springs can't close the valves in time — the valvetrain loses control and the valves 'float', bouncing off their seats instead of sealing. Power falls off a cliff and the engine goes flat and noisy.",
        trigger: (m, p) => m.rpm > (p.redline ?? 5200),
        severity: (m, p) => min((m.rpm / (p.redline ?? 5200) - 1) * 7),
      },
      dropped_valve: {
        name: 'Dropped / Bent Valve',
        visual: 'bent',
        physicalDescription:
          'Sustained float lets a valve hang open and kiss a piston. The valve bends, or a keeper lets go and the valve drops into the cylinder — the piston smashes it and the engine destroys itself in an instant.',
        trigger: (m, p) => m.rpm > (p.redline ?? 5200) * 1.18,
        severity: (m, p) => min((m.rpm / ((p.redline ?? 5200) * 1.18) - 1) * 10),
      },
    },
  },

  pistons: {
    modes: {
      detonation: {
        name: 'Detonation (Knock)',
        visual: 'knock',
        physicalDescription:
          'Cylinder pressure and heat ignite the charge before the spark — two flame fronts collide and hammer the piston with a sound like marbles in a can. On this much compression and this fuel, the knock will crack a ring land or punch a hole in a piston.',
        trigger: (m) => (m.octane ?? 91) < requiredOctane(m) && (m.loadFraction ?? 1) > 0.4,
        severity: (m) => min((requiredOctane(m) - (m.octane ?? 91)) / 4),
      },
      holed_piston: {
        name: 'Holed Piston',
        visual: 'holed',
        physicalDescription:
          'Heavy, sustained detonation burns through the piston crown. Compression in that cylinder is gone, oil burns, and the engine misfires hard — a teardown is the only fix.',
        trigger: (m) => (m.octane ?? 91) < requiredOctane(m) - 8 && (m.loadFraction ?? 1) > 0.6,
        severity: (m) => min((requiredOctane(m) - 8 - (m.octane ?? 91)) / 5),
      },
    },
  },

  cooling: {
    modes: {
      overheat: {
        name: 'Overheating',
        visual: 'steam',
        physicalDescription:
          "Coolant temperature is past the safe zone. The thermostat is wide open and the system can't shed the heat fast enough — detonation risk climbs and the head gasket is living on borrowed time.",
        trigger: (m) => (m.coolantF ?? 195) > 235,
        severity: (m) => min(((m.coolantF ?? 195) - 235) / 25),
      },
      head_gasket: {
        name: 'Blown Head Gasket',
        visual: 'boilover',
        physicalDescription:
          'Sustained overheating warps the head and the head gasket lets go — coolant pushes into the cylinders, white smoke pours out the pipes, and compression bleeds between cylinders. The engine is down until it comes apart.',
        trigger: (m) => (m.coolantF ?? 195) > 265,
        severity: (m) => min(((m.coolantF ?? 195) - 265) / 20),
      },
    },
  },

  bottom_end: {
    modes: {
      thrown_rod: {
        name: 'Thrown Rod (Over-Rev)',
        visual: 'grenade',
        physicalDescription:
          'The money shift. Spun well past redline, the rod bolts stretch and a connecting rod lets go at the big end — it punches straight through the block. Oil and shrapnel everywhere. Catastrophic and instant. A stronger block (4-bolt / splayed mains) holds on longer.',
        // A stronger block raises the rpm the bottom end tolerates before it grenades.
        trigger: (m, p) => m.rpm > (p.redline ?? 5200) * 1.22 * (m.blockStrength ?? 1),
        severity: (m, p) => min((m.rpm / ((p.redline ?? 5200) * 1.22 * (m.blockStrength ?? 1)) - 1) * 12),
      },
    },
  },

  generic: { modes: {} },
};

// ── detectFailure — the heart of the engine (faithful to v2.0) ────────────────
/**
 * Evaluate a component's operating metrics against its failure profile.
 * @returns {failed, severity, family, mode, name, visual, description}
 */
export function detectFailure(component, metrics) {
  const empty = { failed: false, severity: 0, family: null, mode: null, name: null, visual: null, description: null };
  if (!component || !metrics) return empty;

  const family = resolveFamily(component.type, component.properties);
  const profile = FAILURE_PROFILES[component.type] || FAILURE_PROFILES[family] || FAILURE_PROFILES.generic;
  if (!profile) return empty;

  const props = component.properties || {};
  let worstSeverity = 0;
  let worstMode = null;

  for (const [, modeData] of Object.entries(profile.modes)) {
    try {
      if (modeData.trigger(metrics, props)) {
        const sev = modeData.severity ? Math.max(0, modeData.severity(metrics, props)) : 1;
        if (sev > worstSeverity) {
          worstSeverity = sev;
          worstMode = modeData;
        }
      }
    } catch {
      /* skip malformed modes */
    }
  }

  if (worstSeverity <= 0) return { ...empty, family };
  return {
    failed: worstSeverity >= 2,
    severity: worstSeverity,
    family,
    mode: worstMode,
    name: worstMode.name,
    visual: worstMode.visual,
    description: worstMode.physicalDescription,
  };
}
