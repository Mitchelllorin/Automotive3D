/**
 * scenarios.js — turns a dyno result into the metrics a battle is won on.
 *
 * Different arenas reward different engines, the way they do in real life:
 *   • Drag strip  — peak horsepower against weight (ET & trap speed).
 *   • Street/roll — area under the torque curve (how hard it pulls in the meat
 *                   of the rev range, where you actually drive).
 *   • Grade/tow   — low-end torque under load.
 *
 * The drag numbers use the estimators racers actually trust — Roger Huntington's
 * weight/power equations — so an ET or trap speed here reads the way a timeslip
 * would. Everything keys off the *environment-corrected* dyno, so the same part
 * can win at sea level and lose at altitude.
 */

/** A typical muscle-car curb weight (lb), with driver. Tunable per matchup. */
export const DEFAULT_WEIGHT_LB = 3400;

/** Quarter-mile elapsed time (s) and trap speed (mph) from peak HP and weight. */
export function dragStats(peakHp, weightLb = DEFAULT_WEIGHT_LB) {
  const hp = Math.max(1, peakHp);
  const et = 5.825 * Math.cbrt(weightLb / hp); // Huntington ET
  const trap = 234 * Math.cbrt(hp / weightLb); // Huntington trap speed
  return { et, trap };
}

/** 0–60 mph estimate (s) from peak HP and weight — calibrated to street numbers. */
export function zeroToSixty(peakHp, weightLb = DEFAULT_WEIGHT_LB) {
  const hp = Math.max(1, peakHp);
  return 0.95 * Math.pow(weightLb / hp, 0.75);
}

/**
 * "Pulling power" for street/roll-on battles: the average torque across the meat
 * of the rev range (1500 rpm → redline), so a broad, fat curve beats a peaky one
 * even when their dyno peaks match. Returns lb-ft.
 */
export function rollOnTorque(dyno) {
  const band = dyno.curve.filter((p) => p.rpm >= 1500);
  if (!band.length) return 0;
  return band.reduce((s, p) => s + p.tq, 0) / band.length;
}

/** Low-end grunt for towing/grade battles: average torque below 3000 rpm (lb-ft). */
export function lowEndTorque(dyno) {
  const band = dyno.curve.filter((p) => p.rpm <= 3000);
  if (!band.length) return dyno.peakTq.value;
  return band.reduce((s, p) => s + p.tq, 0) / band.length;
}

/** The full scorecard for one build+environment, used across the arena. */
export function scoreBuild(dyno, weightLb = DEFAULT_WEIGHT_LB) {
  const { et, trap } = dragStats(dyno.peakHp.value, weightLb);
  return {
    peakHp: dyno.peakHp.value,
    peakHpRpm: dyno.peakHp.rpm,
    peakTq: dyno.peakTq.value,
    peakTqRpm: dyno.peakTq.rpm,
    et,
    trap,
    zeroSixty: zeroToSixty(dyno.peakHp.value, weightLb),
    rollOn: rollOnTorque(dyno),
    lowEnd: lowEndTorque(dyno),
    densityRatio: dyno.densityRatio ?? 1,
  };
}

/**
 * The arenas a battle can be fought in. `metric` is the scorecard key that wins,
 * `dir` is which way is better (−1 = lower wins, e.g. ET / 0–60).
 */
export const ARENAS = [
  { id: 'dyno', label: 'Dyno Pull', unit: 'hp', metric: 'peakHp', dir: 1, blurb: 'Peak horsepower, no excuses.' },
  { id: 'drag', label: 'Drag Strip', unit: 's', metric: 'et', dir: -1, blurb: 'Quarter-mile elapsed time.' },
  { id: 'rollon', label: 'Roll-On', unit: 'lb-ft', metric: 'rollOn', dir: 1, blurb: 'Average pull, 1500→redline.' },
  { id: 'grade', label: 'Tow / Grade', unit: 'lb-ft', metric: 'lowEnd', dir: 1, blurb: 'Low-end grunt under 3000 rpm.' },
];
