import {
  faClockRotateLeft,
  faCodeBranch,
  faCodeMerge,
  faDownload,
  faExclamationCircle,
  faHardDrive,
  faThumbTack,
  faThumbsUp,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ago from "s-ago";

import { type CardPackageVariants } from "@thunderstore/cyberstorm-theme";
import {
  type CardPackageModifiers,
  type CardPackageSizes,
} from "@thunderstore/cyberstorm-theme";
import { type PackageListing } from "@thunderstore/dapper/types";

import { Image, NewIcon, NewLink, NewMetaItem, NewTag } from "../../..";
import { RelativeTime } from "../../../components/RelativeTime/RelativeTime";
import { TooltipWrapper } from "../../../primitiveComponents/utils/utils";
import {
  classnames,
  componentClasses,
  formatInteger,
  formatToDisplayName,
} from "../../../utils/utils";
import "./CardPackage.css";

interface Props {
  packageData: PackageListing;
  isLiked: boolean;
  packageLikeAction?: () => void;
  csVariant?: CardPackageVariants;
  csSize?: CardPackageSizes;
  csModifiers?: CardPackageModifiers;
  rootClasses?: string;
  footerExtension?: React.ReactNode;
}

export function CardPackage(props: Props) {
  const {
    packageData,
    isLiked,
    packageLikeAction,
    csVariant = "card",
    csSize = "medium",
    csModifiers,
    rootClasses,
    footerExtension,
  } = props;
  const updateTime = Date.parse(packageData.last_updated);
  const updateTimeDelta = Math.round((Date.now() - updateTime) / 86400000);
  const isUpdated = updateTimeDelta < 3;

  // Safe access for version if it exists on the data object but not on the type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const version = (packageData as any).latest_version_number;
  const size = packageData.size;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1000;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const tags = (
    <div className="card-package__tags">
      {packageData.categories.length
        ? packageData.categories.map((c, index) => (
            <NewTag
              csMode="link"
              href={`/c/${packageData.community_identifier}/?includedCategories=${c.id}`}
              key={`category_${c}_${index}`}
              csVariant="primary"
              csSize="xsmall"
              csModifiers={["dark", "hoverable"]}
            >
              <span>{c.name}</span>
            </NewTag>
          ))
        : null}
    </div>
  );

  const description = (
    <p className="card-package__description">{packageData.description}</p>
  );

  const metaItems = (
    <>
      <TooltipWrapper
        tooltipText={`${formatInteger(
          packageData.download_count,
          "standard"
        )} Downloads`}
      >
        <NewMetaItem csSize="12">
          <NewIcon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faDownload} />
          </NewIcon>
          {formatInteger(packageData.download_count)}
        </NewMetaItem>
      </TooltipWrapper>

      {["fullWidth", "list"].includes(csVariant) && version ? (
        <NewMetaItem csSize="12">
          <NewIcon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faCodeBranch} />
          </NewIcon>
          {version}
        </NewMetaItem>
      ) : null}

      <TooltipWrapper
        tooltipText={`${formatInteger(
          packageData.rating_count,
          "standard"
        )} Likes`}
      >
        <NewMetaItem
          csSize="12"
          primitiveType="metaItemActionable"
          onClick={packageLikeAction}
        >
          <NewIcon
            csMode="inline"
            noWrapper
            rootClasses={isLiked ? "card-package--is-liked" : undefined}
          >
            <FontAwesomeIcon icon={faThumbsUp} />
          </NewIcon>
          {formatInteger(packageData.rating_count)}
        </NewMetaItem>
      </TooltipWrapper>

      {["fullWidth", "list"].includes(csVariant) && size ? (
        <NewMetaItem csSize="12">
          <NewIcon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faHardDrive} />
          </NewIcon>
          {formatSize(size)}
        </NewMetaItem>
      ) : null}

      {["fullWidth", "list"].includes(csVariant) ? (
        <TooltipWrapper
          tooltipText={`Last updated: ${ago(
            new Date(packageData.last_updated)
          )}`}
        >
          <NewMetaItem csSize="12">
            <NewIcon csMode="inline" noWrapper>
              <FontAwesomeIcon icon={faClockRotateLeft} />
            </NewIcon>
            {ago(new Date(packageData.last_updated))}
          </NewMetaItem>
        </TooltipWrapper>
      ) : null}
    </>
  );

  const meta = (
    <div className="card-package__meta">
      {metaItems}
      {footerExtension}
    </div>
  );

  const cardFooter = (
    <div className="card-package__footer">
      {["list"].includes(csVariant) ? tags : null}
      {["fullWidth"].includes(csVariant) ? footerExtension : null}

      {["card", "tile"].includes(csVariant) ? (
        <>
          {meta}
          {!["tile"].includes(csVariant) ? (
            <span className="card-package__updated">
              Last updated:
              <RelativeTime
                time={packageData.last_updated}
                suppressHydrationWarning
              />
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );

  return (
    <div
      className={classnames(
        "card-package",
        ...componentClasses("card-package", csVariant, csSize, csModifiers),
        rootClasses
      )}
    >
      <NewLink
        tabIndex={-1}
        primitiveType="cyberstormLink"
        linkId="Package"
        community={packageData.community_identifier}
        namespace={packageData.namespace}
        package={packageData.name}
        title={`${formatToDisplayName(packageData.name)} by ${
          packageData.namespace
        }`}
        rootClasses="card-package__header-link"
      >
        {["card", "tile"].includes(csVariant) &&
        (packageData.is_pinned ||
          packageData.is_nsfw ||
          packageData.is_deprecated ||
          isUpdated) ? (
          <div className="card-package__image-tags">
            {packageData.is_pinned ? (
              <NewTag csSize="small" csModifiers={["dark"]} csVariant="blue">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faThumbTack} />
                </NewIcon>
                Pinned
              </NewTag>
            ) : null}
            {packageData.is_nsfw ? (
              <NewTag csSize="small" csModifiers={["dark"]} csVariant="pink">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                </NewIcon>
                NSFW
              </NewTag>
            ) : null}
            {packageData.is_deprecated ? (
              <NewTag csSize="small" csModifiers={["dark"]} csVariant="yellow">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faWarning} />
                </NewIcon>
                Deprecated
              </NewTag>
            ) : null}
            {isUpdated ? (
              <NewTag csSize="small" csVariant="green">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faCodeMerge} />
                </NewIcon>
                Updated
              </NewTag>
            ) : null}
          </div>
        ) : null}
        <Image
          src={packageData.icon_url}
          cardType="package"
          rootClasses="card-package__image-wrapper"
          square
          intrinsicWidth={["fullWidth", "list"].includes(csVariant) ? 144 : 256}
          intrinsicHeight={
            ["fullWidth", "list"].includes(csVariant) ? 144 : 256
          }
        />
      </NewLink>

      <div className="card-package__content">
        <div className="card-package__info">
          {["card", "featured"].includes(csVariant) ? (
            <NewLink
              primitiveType="cyberstormLink"
              linkId="Package"
              community={packageData.community_identifier}
              namespace={packageData.namespace}
              package={packageData.name}
              rootClasses="card-package__title"
              title={formatToDisplayName(packageData.name)}
            >
              {formatToDisplayName(packageData.name)}
            </NewLink>
          ) : (
            <div className="card-package__title-row">
              <NewLink
                primitiveType="cyberstormLink"
                linkId="Package"
                community={packageData.community_identifier}
                namespace={packageData.namespace}
                package={packageData.name}
                rootClasses="card-package__title"
                title={formatToDisplayName(packageData.name)}
              >
                {formatToDisplayName(packageData.name)}
              </NewLink>
              {packageData.is_pinned ||
              packageData.is_nsfw ||
              packageData.is_deprecated ||
              isUpdated ? (
                <div className="card-package__status-tags">
                  {packageData.is_pinned ? (
                    <NewTag
                      csSize="small"
                      csModifiers={["dark"]}
                      csVariant="blue"
                    >
                      <NewIcon noWrapper csMode="inline">
                        <FontAwesomeIcon icon={faThumbTack} />
                      </NewIcon>
                      Pinned
                    </NewTag>
                  ) : null}
                  {packageData.is_deprecated ? (
                    <NewTag
                      csSize="small"
                      csModifiers={["dark"]}
                      csVariant="yellow"
                    >
                      <NewIcon noWrapper csMode="inline">
                        <FontAwesomeIcon icon={faWarning} />
                      </NewIcon>
                      Deprecated
                    </NewTag>
                  ) : null}
                  {packageData.is_nsfw ? (
                    <NewTag
                      csSize="small"
                      csModifiers={["dark"]}
                      csVariant="pink"
                    >
                      <NewIcon noWrapper csMode="inline">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                      </NewIcon>
                      NSFW
                    </NewTag>
                  ) : null}
                  {isUpdated ? (
                    <NewTag csSize="small" csVariant="green">
                      <NewIcon noWrapper csMode="inline">
                        <FontAwesomeIcon icon={faCodeMerge} />
                      </NewIcon>
                      Updated
                    </NewTag>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          <div className="card-package__author">
            <span className="card-package__prefix">by</span>
            <NewLink
              primitiveType="cyberstormLink"
              linkId="Team"
              community={packageData.community_identifier}
              team={packageData.namespace}
              title={packageData.namespace}
              rootClasses="card-package__link"
              csVariant="cyber"
            >
              {packageData.namespace}
            </NewLink>
          </div>
        </div>

        {["card", "featured", "fullWidth", "list"].includes(csVariant) &&
        packageData.description
          ? description
          : null}

        {["card", "featured"].includes(csVariant) ? tags : null}
        {csVariant === "featured" ? meta : null}

        {["fullWidth", "list"].includes(csVariant) ? (
          <div className="card-package__meta-row">
            {tags}
            <div className="card-package__meta">{metaItems}</div>
          </div>
        ) : null}

        {["card", "tile"].includes(csVariant) ? cardFooter : null}
      </div>
      {/* Use a wrapper for footer to allow specific styling in fullWidth */}
      {["fullWidth", "list"].includes(csVariant) ? (
        <div className="card-package__footer-wrapper">{cardFooter}</div>
      ) : null}
    </div>
  );
}

CardPackage.displayName = "CardPackage";
