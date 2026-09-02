import { describe, expect, it } from "vitest";

import { type AdCampaign, SLOT_MEDIA, creative, when } from "../adCampaign";
import { CAMPAIGNS } from "../campaigns";
import {
  BOTTOM_AD_SLOTS,
  COMMUNITY_RAIL_SLOTS,
  COMMUNITY_SIDEBAR_AD,
  type RenderedAdSlot,
} from "../nitroAds";
import { findCampaign, resolveStaticAd, staticAdForSlot } from "../staticAds";

// A campaign that exists only here, so the resolution rules can be exercised
// whether or not anything is live in ../campaigns.
const WIDE = creative("wide", 980, 250);
const NARROW = creative("narrow", 300, 250);

const FIXTURE: AdCampaign = {
  name: "fixture",
  pathPrefixes: ["/c/somegame"],
  alt: "An advert",
  placements: {
    "content-bottom": { campaignId: "fixture-bottom", href: "https://x/1" },
    "community-sidebar": { campaignId: "fixture-sidebar", href: "https://x/2" },
  },
  creatives: {
    "bottom-banner": [when(SLOT_MEDIA.bottomRowFits980, WIDE), NARROW],
    "display-300-250": [NARROW],
    "rail-300x100": [],
  },
};

const railTier = (size: string) => {
  const slot = COMMUNITY_RAIL_SLOTS.find((s) => s.sizeVariant === size);
  if (!slot) throw new Error(`no ${size} tier`);
  return slot;
};

describe("commonComponents.Ads.findCampaign", () => {
  it("claims a prefix and everything beneath it", () => {
    for (const p of [
      "/c/somegame",
      "/c/somegame/",
      "/c/somegame/p/Team/Package/",
      "/c/somegame/p/Team",
    ]) {
      expect(findCampaign([FIXTURE], p)).toBe(FIXTURE);
    }
  });

  it("leaves every other route to the ad network", () => {
    for (const p of ["/", "/communities", "/c/other", "/c/some", "/p/x"]) {
      expect(findCampaign([FIXTURE], p)).toBeUndefined();
    }
  });

  it("takes the first campaign that matches", () => {
    const second = { ...FIXTURE, name: "second" };
    expect(findCampaign([FIXTURE, second], "/c/somegame")).toBe(FIXTURE);
  });

  it("matches nothing when no campaign is live", () => {
    expect(findCampaign([], "/c/somegame")).toBeUndefined();
  });
});

describe("commonComponents.Ads.resolveStaticAd", () => {
  it("gives a placement its own click-through and the campaign's alt", () => {
    const ad = resolveStaticAd(FIXTURE, BOTTOM_AD_SLOTS[0]);
    expect(ad?.campaignId).toBe("fixture-bottom");
    expect(ad?.href).toBe("https://x/1");
    expect(ad?.alt).toBe(FIXTURE.alt);
  });

  it("serves nothing for a placement the campaign has no link for", () => {
    // The rail is absent from the fixture: a missing placement serves nothing
    // rather than falling back to the ad network, which would double up.
    expect(resolveStaticAd(FIXTURE, railTier("rail-300x600"))).toBeUndefined();
  });

  it("serves nothing for a shape with an empty artwork list", () => {
    // How a campaign opts out of one slot shape it has nothing suitable for.
    expect(resolveStaticAd(FIXTURE, railTier("rail-300x100"))).toBeUndefined();
  });

  it("passes the artwork through most-specific first", () => {
    const ad = resolveStaticAd(FIXTURE, BOTTOM_AD_SLOTS[0]);
    expect(ad?.creatives.map((c) => [c.width, c.media])).toEqual([
      [980, SLOT_MEDIA.bottomRowFits980],
      [300, undefined],
    ]);
  });

  it("leaves a single-shape slot unconditional", () => {
    // One creative must never be gated behind a media condition, or browsers
    // outside that range would render an empty <picture>.
    const ad = resolveStaticAd(FIXTURE, COMMUNITY_SIDEBAR_AD);
    expect(ad?.creatives).toHaveLength(1);
    expect(ad?.creatives[0].media).toBeUndefined();
  });
});

describe("commonComponents.Ads.campaigns", () => {
  it("serves nothing on a path no live campaign claims", () => {
    for (const slot of [
      BOTTOM_AD_SLOTS[0],
      COMMUNITY_SIDEBAR_AD,
      railTier("rail-300x600"),
    ] as RenderedAdSlot[]) {
      expect(staticAdForSlot(slot, "/c/riskofrain2")).toBeUndefined();
      expect(staticAdForSlot(slot, "/communities")).toBeUndefined();
    }
  });

  it("keeps every live campaign well-formed", () => {
    for (const campaign of CAMPAIGNS) {
      expect(campaign.pathPrefixes.length).toBeGreaterThan(0);
      expect(campaign.alt).toBeTruthy();
      expect(Object.keys(campaign.placements).length).toBeGreaterThan(0);
      for (const list of Object.values(campaign.creatives)) {
        // The last entry is the <img> every browser falls back to, so it can
        // never carry a media condition.
        if (list && list.length) {
          expect(list[list.length - 1].media).toBeUndefined();
          for (const c of list) {
            expect(c.src).toMatch(/^\/cyberstorm-static\/images\/.+\.webp$/);
          }
        }
      }
    }
  });
});
