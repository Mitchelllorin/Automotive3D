/**
 * Shared, frame-advanced engine simulation state.
 *
 * Like explodeState, this is a module-level mutable so dozens of moving meshes
 * (crank, pistons, valvetrain, fan, pulleys, belt) can read the live crank angle
 * inside their own useFrame without triggering React re-renders. The zustand
 * store holds only the *targets* the UI sets (running, target RPM, slow-mo).
 */
export const simState = {
  crankAngle: 0, // radians, ever-increasing
  rpm: 0, // current (eased) crank RPM
};

/**
 * Advance the simulation one frame.
 * @param dt        seconds since last frame
 * @param targetRpm RPM to spin up/down toward (0 when not running)
 * @param timeScale slow-motion factor (1 = real time)
 */
export function advanceSim(dt, targetRpm, timeScale = 1) {
  // Spin up / spool down toward the target like real rotating inertia.
  simState.rpm += (targetRpm - simState.rpm) * Math.min(1, dt * 2.2);
  if (simState.rpm < 0.5 && targetRpm === 0) simState.rpm = 0;
  const omega = (simState.rpm / 60) * Math.PI * 2; // rad/s
  simState.crankAngle += omega * dt * timeScale;
}
