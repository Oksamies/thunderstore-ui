import type {
  AdContainerSizeVariant,
  AdCreative,
} from "@thunderstore/cyberstorm";

/**
 * How a directly-sold ad campaign is described. Kept apart from staticAds.ts —
 * which resolves a slot against the live campaigns — so a campaign file can
 * import these helpers without importing the registry that lists it.
 */

// --- Defining a campaign ---

export interface AdCampaignPlacement {
  // The advertiser's id for this position; stamped on the link as
  // `data-ad-campaign` so clicks can be attributed without parsing the href.
  campaignId: string;
  href: string;
}

export interface AdCampaign {
  // Identifies the campaign in code and in logs; not shown to anyone.
  name: string;
  // Paths this campaign takes over, as plain pathname prefixes — so one entry
  // covers a community's package search and every package / team / dependants
  // page beneath it.
  //
  // NB it is a prefix, not a community id: a community whose identifier STARTS
  // WITH one of these (e.g. "valheim-2" under "/c/valheim") would be swept in
  // too. Where that matters, list the exact path and its trailing-slash form.
  pathPrefixes: readonly string[];
  // Describes the artwork for screen readers; the same for every placement,
  // since they are the same advert at different sizes.
  alt: string;
  // Click-through per placement, keyed by adPlacementKey(containerId) — the
  // version-independent placement name, e.g.
  // "nimbus-v2-community-sidebar-300x250" -> "community-sidebar". A placement
  // missing from this map serves nothing (it does NOT fall back to the network).
  placements: Readonly<Record<string, AdCampaignPlacement>>;
  // Artwork per slot shape. Within each list the entries are ordered most
  // specific FIRST: every one bar the last carries a `media` condition, and the
  // last is the unconditional fallback, so it has to suit the narrowest box that
  // shape can take. A shape that is absent, or maps to an empty list, serves
  // nothing there.
  creatives: Readonly<
    Partial<Record<AdContainerSizeVariant, readonly AdCreative[]>>
  >;
}

// Campaign artwork is served straight from apps/cyberstorm-remix/public. WebP
// only: it is ~4x smaller than the same artwork as PNG, and the <img> a
// <picture> falls back to has to resolve on its own, so there is no second
// format to fall back to.
const IMAGE_ROOT = "/cyberstorm-static/images";

/** Declare one piece of campaign artwork, at its native size. */
export function creative(
  basename: string,
  width: number,
  height: number
): AdCreative {
  return { src: `${IMAGE_ROOT}/${basename}.webp`, width, height };
}

/**
 * Attach the condition under which a creative applies. Only needed for slot
 * shapes that can take more than one piece of artwork; the last entry of a list
 * is the unconditional fallback and must never carry one.
 */
export function when(media: string, artwork: AdCreative): AdCreative {
  return { ...artwork, media };
}

/**
 * When each slot shape changes size, for campaigns that supply more than one
 * piece of artwork for it. These are facts about the layout rather than about
 * any campaign, so they live here — a campaign should not have to know where the
 * rail snaps.
 */
export const SLOT_MEDIA = {
  // The bottom row's box is `width: 100%` capped at 980 (layout.css), inside an
  // island with 16px of padding each side plus the slot's 1px borders — so it
  // reaches a 980-wide creative's full width at a 1014px viewport and stays
  // capped above that. Measured rather than derived: at 1014 the content box is
  // 980.4px.
  bottomRowFits980: "(min-width: 1014px)",
  // The rail only snaps to a 300-wide unit once --ad-gutter-min steps up at
  // 1880px (layout.css); from 1700 to 1880 it is 120/160/180 wide, and below
  // 1700 it is hidden altogether.
  railIs300Wide: "(min-width: 1880px)",
} as const;
