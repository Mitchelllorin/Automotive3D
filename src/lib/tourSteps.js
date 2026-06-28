/**
 * tourSteps — the guided, interactive walkthrough. Each step optionally declares a
 * `setup` (UI state the step needs: which tab, panel open/closed) which the Tour
 * applies before measuring its `target`. `target` is a CSS selector to spotlight,
 * or null for a centred message. `place` hints where the tooltip sits.
 *
 * Setup keys:
 *   sidebar: 'open' | 'closed'   — expand/collapse the side panel
 *   tab:     <tab id>            — switch the sidebar tab (implies sidebar open)
 *   controls:'open' | 'closed'   — the floating engine/dyno panel
 */
export const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to AutoMotive3D',
    body: "Let's take a quick lap: explore the engine, build a custom motor, then send it into the Battle Arena. Use Next / Back, or Skip anytime.",
    setup: { sidebar: 'closed', controls: 'open' },
  },
  {
    id: 'scene',
    target: null,
    interactive: true, // invite the user to actually orbit/zoom/tap right now
    title: 'Your engine, in 3D',
    body: 'The whole view is a live 3D engine. Go ahead — drag to orbit, pinch or scroll to zoom, and tap any part to inspect it. The tour waits for you.',
    setup: { sidebar: 'closed', controls: 'open' },
  },
  {
    id: 'dyno',
    target: '.engine-control',
    title: 'Run it & read the dyno',
    body: 'START the engine, roll on the throttle, and watch the live HP/TQ dyno curve. The ⟨ arrow tucks this away; the ⚙ DYNO tab brings it back.',
    place: 'right',
    setup: { sidebar: 'closed', controls: 'open' },
  },
  {
    id: 'open-panel',
    target: '.tab-bar',
    title: 'The build & battle panel',
    body: 'These tabs are where you build, shop parts, trigger faults, and enter the Arena. Open the Build tab to start a motor.',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'pick-motor',
    target: '.build-engine',
    title: '1. Pick your motor',
    body: 'Choose a platform — small-block V8, 383 stroker, 400, or the turbo inline-4. The 3D model and the whole build swap to match. (Locked tiles are coming soon.)',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'swap-parts',
    target: '.build-list',
    title: '2. Swap parts',
    body: 'Tap any system and pick a real branded part. Press-and-hold to preview it on the engine before you commit.',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'live-numbers',
    target: '.build-summary',
    title: '3. Watch the numbers move',
    body: 'Horsepower, torque, displacement and idle character update live as you build — so you can see exactly what each part is worth.',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'fuse',
    target: '.build-fuse',
    title: 'F.U.S.E. build check',
    body: "Before you ever run it, F.U.S.E. flags what's likely to break with this combo — a weak bottom end, valve float, detonation risk.",
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'save',
    target: '.build-saved',
    title: '4. Save your build',
    body: 'Name the build and save it. Saved builds remember their motor and parts, and become contenders you can take into the Arena.',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'to-arena',
    target: '.build-to-arena',
    title: '5. Take it to the Arena',
    body: 'This jumps you to the Arena with your current build loaded — ready to fight.',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'build' },
  },
  {
    id: 'arena-tab',
    target: '.tab-panel',
    title: 'The Arena: shootouts & face-offs',
    body: 'Rank every branded part for a category in your build and weather, or face your build off against preset rivals across drag, roll-on and tow metrics.',
    place: 'auto',
    setup: { sidebar: 'open', tab: 'arena' },
  },
  {
    id: 'arena-3d',
    target: '[data-tour="arena-enter"]',
    title: 'The 3D Battle Arena',
    body: 'Hit ⚔ Arena to stage two full engines head-to-head. Pick a rival (another motor or a saved build), BATTLE, and they rev to the moon until one grenades. Last one running wins.',
    place: 'auto',
    setup: { sidebar: 'closed', controls: 'open' },
  },
  {
    id: 'done',
    target: null,
    title: "You're ready to build",
    body: 'Build a motor, prove it on the dyno, and win in the Arena. Replay this tour anytime from the ? button, top-right.',
    setup: { sidebar: 'closed', controls: 'open' },
  },
];
