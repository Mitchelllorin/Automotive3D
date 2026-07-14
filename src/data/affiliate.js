/**
 * affiliate.js — the single switch for shoppable commerce.
 *
 * All buy links point to RockAuto. Until you're approved for the RockAuto
 * affiliate program and drop your referral ID below, every price tag and Buy
 * button stays HIDDEN across the app — the build, dyno, F.U.S.E. and arena all
 * work, there's just no "buy" surface.  The day your ID arrives, set it here and
 * the whole commerce layer turns on at once, with every link auto-tagged.
 *
 * To apply: https://www.rockauto.com/en/affiliate/
 */
export const AFFILIATE = {
  // ↓↓↓ Drop your RockAuto referral ID here to switch commerce ON. ↓↓↓
  rockAutoId: '',
};

/** True once a RockAuto ID is set — gates all price tags + Buy buttons app-wide. */
export function commerceEnabled() {
  return AFFILIATE.rockAutoId.trim().length > 0;
}

/** Append the RockAuto affiliate referral param to a buy link (no-op until an ID is set). */
export function buyLink(url) {
  const id = AFFILIATE.rockAutoId.trim();
  if (!url || !id) return url;
  return url + (url.includes('?') ? '&' : '?') + `refer=${encodeURIComponent(id)}`;
}
