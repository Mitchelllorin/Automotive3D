/**
 * affiliate.js — the single switch for shoppable commerce.
 *
 * Until you're approved for an affiliate program (Amazon Associates, Summit/
 * AvantLink, …) and drop your tag in below, every price tag and Buy button stays
 * HIDDEN across the app — the build, dyno, F.U.S.E. and arena all work, there's
 * just no "buy" surface implying you can sell it. The day your tag arrives, set it
 * here and the whole commerce layer turns on at once, with links auto-tagged.
 */
export const AFFILIATE = {
  // ↓↓↓ Drop your Amazon Associates (or other) tag here to switch commerce ON. ↓↓↓
  amazonTag: '',
};

/** True once a tag is set — gates all price tags + Buy buttons app-wide. */
export function commerceEnabled() {
  return AFFILIATE.amazonTag.trim().length > 0;
}

/** Append the affiliate id to a retailer Buy link (no-op until a tag is set). */
export function buyLink(url) {
  const tag = AFFILIATE.amazonTag.trim();
  if (!url || !tag) return url;
  return url + (url.includes('?') ? '&' : '?') + `tag=${encodeURIComponent(tag)}`;
}
