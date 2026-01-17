import {
  faBan,
  faCheck,
  faDownload,
  faExclamationCircle,
  faSpinner,
  faSyncAlt,
  faThumbsUp,
  faThumbtack,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo } from "react";

import { NewIcon } from "@thunderstore/cyberstorm";
import { PackageListing } from "@thunderstore/dapper/types";

import ManifestV2 from "../../../model/ManifestV2";
import VersionNumber from "../../../model/VersionNumber";
import "./OnlinePackageCard.css";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

interface OnlinePackageCardProps {
  listing: PackageListing;
  installedMods: ManifestV2[];
  downloadState?: any;
  handleDownload: (listing: PackageListing, update?: boolean) => void;
  handleToggle?: (mod: ManifestV2) => void; // Optional for now
}

const OnlinePackageCard: React.FC<OnlinePackageCardProps> = ({
  listing,
  installedMods,
  downloadState,
  handleDownload,
}) => {
  const modId = `${listing.namespace}-${listing.name}`;
  const installed = useMemo(
    () => installedMods.find((m) => m.getName() === modId),
    [installedMods, modId]
  );

  const isDownloading =
    downloadState &&
    (downloadState.status === "downloading" ||
      downloadState.status === "extracting");

  let hasUpdate = false;
  if (installed) {
    const latestVersion = new VersionNumber(
      (listing as any).latest_version_number || "0.0.0"
    );
    const installedVersion = installed.getVersionNumber();
    if (latestVersion.isNewerThan(installedVersion)) {
      hasUpdate = true;
    }
  }

  const onInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDownload(listing, false);
  };

  const onUpdateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDownload(listing, true);
  };

  return (
    <div className="package-card">
      <div className="package-card__top">
        <div className="package-card__image-wrapper">
          <img
            src={
              listing.icon_url ||
              "https://thunderstore.io/static/img/default-icon.png"
            }
            className="package-card__image"
            alt={listing.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://thunderstore.io/static/img/default-icon.png";
            }}
          />
        </div>

        <div className="package-card__badges">
          {listing.is_pinned && (
            <div className="badge badge--pinned" title="Pinned">
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faThumbtack} />
              </NewIcon>
            </div>
          )}
          {listing.is_deprecated && (
            <div className="badge badge--deprecated" title="Deprecated">
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faBan} />
              </NewIcon>
            </div>
          )}
          {listing.is_nsfw && (
            <div className="badge badge--nsfw" title="NSFW">
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faExclamationCircle} />
              </NewIcon>
            </div>
          )}
        </div>
      </div>

      <div className="package-card__content">
        <div className="package-card__header">
          <h3 className="package-card__title" title={listing.name}>
            {listing.name}
          </h3>
          <div className="package-card__author" title={listing.namespace}>
            by {listing.namespace}
          </div>
        </div>

        <p className="package-card__description">{listing.description}</p>

        <div className="package-card__categories">
          {(listing.categories || []).slice(0, 3).map((category) => (
            <span key={category} className="tag">
              {category}
            </span>
          ))}
          {(listing.categories || []).length > 3 && (
            <span className="tag">+{listing.categories.length - 3}</span>
          )}
        </div>
      </div>

      <div className="package-card__footer">
        <div className="package-card__stats">
          <div className="stat" title="Downloads">
            <NewIcon noWrapper>
              <FontAwesomeIcon icon={faDownload} />
            </NewIcon>
            <span>{formatNumber(listing.install_count)}</span>
          </div>
          <div className="stat" title="Likes">
            <NewIcon noWrapper>
              <FontAwesomeIcon icon={faThumbsUp} />
            </NewIcon>
            <span>{formatNumber(listing.rating_score)}</span>
          </div>
        </div>

        <div className="actions">
          {isDownloading ? (
            <button className="install-btn" disabled title="Downloading">
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faSpinner} spin />
              </NewIcon>
            </button>
          ) : hasUpdate ? (
            <button
              className="install-btn update-btn"
              onClick={onUpdateClick}
              title="Update"
            >
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faSyncAlt} />
              </NewIcon>
            </button>
          ) : installed ? (
            <button
              className="install-btn installed-btn"
              disabled
              title="Installed"
            >
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faCheck} />
              </NewIcon>
            </button>
          ) : (
            <button
              className="install-btn"
              onClick={onInstallClick}
              title="Install"
            >
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faDownload} />
              </NewIcon>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlinePackageCard;
