import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Icon as NewIcon } from "../Icon/Icon";
import "./AdContainer.css";

export type AdContainerSizeVariant =
  // 300×250 rectangle — the sidebar ads (community search + package listing).
  // Shows the house fallback while unfilled, like the bottom banner.
  | "display-300-250"
  // Rail skyscraper height tiers — one fixed-height box each. layout.css reveals
  // the tallest tier that fully fits the rail height (see the nimbus-ad-rail
  // rules), so the served ad is never clipped/below the fold.
  | "rail-300x600"
  | "rail-300x250"
  | "rail-300x100"
  | "bottom-banner";

// One image of a static (directly-sold) creative, at its NATIVE size.
export interface AdCreative {
  src: string;
  width: number;
  height: number;
  // When this creative applies, as a <source media> condition. This is plain
  // art direction: the browser picks the matching source and re-picks on resize,
  // so the slot needs no measuring and works in the server markup. Omit it on
  // the LAST creative of a list — that one is the <img> every browser falls back
  // to, and it must therefore be the one that fits the smallest box the slot can
  // take.
  media?: string;
}

// A directly-sold creative rendered in place of a network-served ad — see the
// `staticAd` prop below.
export interface StaticAd {
  // Click-through target. Opened in a new tab, `rel="… sponsored"`.
  href: string;
  alt: string;
  // Stamped on the link as `data-ad-campaign` so clicks can be attributed.
  campaignId?: string;
  // Ordered most-specific first: each entry bar the last carries a `media`
  // condition, and the last is the unconditional fallback. An empty list renders
  // nothing, which is how a size tier with no matching artwork opts out.
  creatives: AdCreative[];
}

interface AdContainerProps {
  containerId: string;
  // Drives the slot's reserved box via a `data-size` attribute; see
  // AdContainer.css. Defaults to the 300×250 box shape (the fallback markup
  // renders only when this is set explicitly — see showsFallback below).
  sizeVariant?: AdContainerSizeVariant;
  // Which route's rail this container belongs to. Both routes' rail tiers live in
  // the shared rail stack; the stack's data-rail-active-page + this marker let
  // layout.css show only the active route's set, so community and package rails
  // get distinct NitroPay ids (see nitroAds.ts).
  railPage?: "community" | "package";
  // Render a directly-sold creative into the slot instead of leaving the content
  // box for the ad network. Callers that pass this must NOT also create a network
  // ad for the same container id — the two would stack in the same box.
  staticAd?: StaticAd;
}

/**
 * The linked creative for a directly-sold slot: one <picture>, whose <source>s
 * carry the campaign's media conditions and whose <img> is the fallback.
 *
 * Everything here is static markup, so the ad is in the server response and
 * needs no hydration to appear; the browser does the choosing, re-does it on
 * resize, and `loading="lazy"` keeps a below-the-fold or hidden slot (a rail
 * tier the height cascade has hidden) from fetching anything at all.
 */
function StaticAdCreative({ staticAd }: { staticAd: StaticAd }) {
  const { creatives } = staticAd;
  if (creatives.length === 0) {
    return null;
  }
  const conditional = creatives.slice(0, -1);
  const fallback = creatives[creatives.length - 1];

  return (
    <a
      className="ad-container__static"
      href={staticAd.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-ad-campaign={staticAd.campaignId}
    >
      <picture>
        {conditional.map((creative) => (
          <source
            key={creative.src}
            media={creative.media}
            srcSet={creative.src}
            width={creative.width}
            height={creative.height}
          />
        ))}
        <img
          src={fallback.src}
          width={fallback.width}
          height={fallback.height}
          alt={staticAd.alt}
          loading="lazy"
        />
      </picture>
    </a>
  );
}

// An unfilled slot reserves its box so ads load without shifting the layout.
// Most slots render nothing visible while empty; the bottom banner and the
// sidebar rectangles instead show a house "support us via ads" fallback
// (text + heart) — the spot to reach the users whose ad didn't fill or who run an
// adblocker. NitroPay mounts the creative into `.ad-container__content`, which
// overlays and hides the fallback once an ad fills (see the :has() rule in
// AdContainer.css) — as does a static creative rendered into the same box.
export function AdContainer(props: AdContainerProps) {
  const { containerId, sizeVariant, railPage, staticAd } = props;

  // The two reserved-box rectangles carry the house fallback; the rail and the
  // inline 300×250 display slot don't.
  //
  // A directly-sold slot never does: its creative is guaranteed, so there is no
  // no-fill to apologise for, and the plea would otherwise sit behind artwork
  // that doesn't cover the whole reserved box.
  const showsFallback =
    !staticAd &&
    (sizeVariant === "bottom-banner" || sizeVariant === "display-300-250");

  return (
    <div
      className="ad-container"
      data-cid={containerId}
      data-size={sizeVariant ?? "display-300-250"}
      data-rail-page={railPage}
      // Marks the slot as directly sold rather than network-served, which is
      // otherwise only visible from the markup inside it.
      data-static={staticAd ? "true" : undefined}
    >
      {showsFallback ? (
        <div className="ad-container__fallback">
          <span className="ad-container__fallback-text">
            Thunderstore development is made possible with ads. Please consider
            making an exception to your adblock.
          </span>
          <NewIcon
            noWrapper
            csMode="inline"
            rootClasses="ad-container__icon"
            csVariant="danger"
          >
            <FontAwesomeIcon icon={faHeart} />
          </NewIcon>
        </div>
      ) : null}
      <div className="ad-container__content" id={containerId}>
        {staticAd ? <StaticAdCreative staticAd={staticAd} /> : null}
      </div>
    </div>
  );
}

AdContainer.displayName = "AdContainer";
