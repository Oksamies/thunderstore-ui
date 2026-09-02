import type { StaticAd } from "@thunderstore/cyberstorm";

import type { AdCampaign } from "./adCampaign";
import { CAMPAIGNS } from "./campaigns";
import { type RenderedAdSlot, adPlacementKey } from "./nitroAds";

/**
 * Directly-sold ("static") ad campaigns that TAKE OVER a route from the ad
 * network.
 *
 * On a path a campaign claims, no NitroPay `createAd` call is made for any slot,
 * the ad script is not loaded at all and the floating video is not anchored;
 * instead the same AdContainers paint linked artwork supplied by the advertiser.
 * The slot geometry, the reveal breakpoints and the rail's height tiers are
 * untouched — only what goes INSIDE the reserved box changes — so a takeover
 * can't shift the layout relative to a network-served community.
 *
 * A campaign is data: see ./adCampaign for how one is described and ./campaigns
 * for the ones that are live. Adding a campaign means adding a file there and
 * listing it — no changes to this module, or to the components that render the
 * slots.
 */

export type { AdCampaign, AdCampaignPlacement } from "./adCampaign";

// --- Resolving a slot ---

/**
 * The campaign in `campaigns` that claims `pathname`, if any — the first match
 * wins. Takes the list rather than reading the live registry so the rule can be
 * exercised without shipping a campaign to test against.
 */
export function findCampaign(
  campaigns: readonly AdCampaign[],
  pathname: string
): AdCampaign | undefined {
  return campaigns.find((campaign) =>
    campaign.pathPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * What `campaign` puts in `slot`, or undefined when it has no click-through for
 * that placement or no artwork for that shape.
 */
export function resolveStaticAd(
  campaign: AdCampaign,
  slot: RenderedAdSlot
): StaticAd | undefined {
  const placement = campaign.placements[adPlacementKey(slot.containerId)];
  const creatives = campaign.creatives[slot.sizeVariant];
  if (!placement || !creatives || creatives.length === 0) {
    return undefined;
  }
  return {
    href: placement.href,
    alt: campaign.alt,
    campaignId: placement.campaignId,
    creatives: [...creatives],
  };
}

/** The live campaign that has taken over `pathname`, if any. */
export function campaignForPath(pathname: string): AdCampaign | undefined {
  return findCampaign(CAMPAIGNS, pathname);
}

/**
 * Whether `pathname` is served by a campaign rather than by the ad network.
 * Callers use this to suppress the auction — and the ad script itself — for the
 * SAME paths the creatives are painted on; the two must agree, or a slot would
 * carry both a network ad and a static one.
 */
export function isStaticAdPath(pathname: string): boolean {
  return campaignForPath(pathname) !== undefined;
}

/**
 * The creative a slot should paint on `pathname`, or undefined when no campaign
 * claims the path, or the campaign has nothing for this placement or shape.
 */
export function staticAdForSlot(
  slot: RenderedAdSlot,
  pathname: string
): StaticAd | undefined {
  const campaign = campaignForPath(pathname);
  return campaign ? resolveStaticAd(campaign, slot) : undefined;
}
