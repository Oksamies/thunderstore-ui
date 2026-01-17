import {
  faCheck,
  faDownload,
  faSpinner,
  faSyncAlt,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo, useState } from "react";

import { CardPackage, NewButton, NewIcon } from "@thunderstore/cyberstorm";
import { type CardPackageVariants } from "@thunderstore/cyberstorm-theme";
import { PackageListing } from "@thunderstore/dapper/types";

import ManifestV2 from "../../../model/ManifestV2";
import VersionNumber from "../../../model/VersionNumber";
import "./OnlinePackageCard.css";

interface OnlinePackageCardProps {
  listing: PackageListing;
  installedMods: ManifestV2[];
  downloadState?: {
    status:
      | "pending"
      | "fetching-details"
      | "installing"
      | "finished"
      | "failed";
  };
  handleDownload: (pkg: PackageListing, update: boolean) => void;
  handleToggle?: (mod: ManifestV2) => void;
  viewMode?: CardPackageVariants;
}

const OnlinePackageCard: React.FC<OnlinePackageCardProps> = ({
  listing,
  installedMods,
  downloadState,
  handleDownload,
  handleToggle,
  viewMode = "card",
}) => {
  const modId = `${listing.namespace}-${listing.name}`;
  const installed = useMemo(
    () => installedMods.find((m) => m.getName() === modId),
    [installedMods, modId]
  );

  const [isHovered, setIsHovered] = useState(false);

  const isDownloading =
    downloadState &&
    (downloadState.status === "pending" ||
      downloadState.status === "fetching-details" ||
      downloadState.status === "installing");

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
    e.preventDefault();
    handleDownload(listing, false);
  };

  const onUpdateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleDownload(listing, true);
  };

  const onUninstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (installed && handleToggle) {
      handleToggle(installed);
    }
  };

  const actions = (
    <div
      className="actions"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isDownloading ? (
        <NewButton
          disabled
          title="Downloading"
          csVariant="primary"
          csSize="small"
        >
          <NewIcon noWrapper csMode="inline">
            <FontAwesomeIcon icon={faSpinner} spin />
          </NewIcon>
          {viewMode === "fullWidth" && <span>Downloading...</span>}
        </NewButton>
      ) : hasUpdate ? (
        <NewButton
          onClick={onUpdateClick}
          title="Update"
          csVariant="success"
          csSize="small"
        >
          <NewIcon noWrapper csMode="inline">
            <FontAwesomeIcon icon={faSyncAlt} />
          </NewIcon>
          {viewMode === "fullWidth" && <span>Update</span>}
        </NewButton>
      ) : installed ? (
        viewMode === "fullWidth" && isHovered ? (
          <NewButton
            onClick={onUninstallClick}
            title="Uninstall"
            csVariant="danger"
            csSize="small"
          >
            <NewIcon noWrapper csMode="inline">
              <FontAwesomeIcon icon={faTrashAlt} />
            </NewIcon>
            <span>Uninstall</span>
          </NewButton>
        ) : (
          <NewButton
            disabled
            title="Installed"
            csVariant="secondary"
            csSize="small"
            csModifiers={["ghost"]}
          >
            <NewIcon noWrapper csMode="inline">
              <FontAwesomeIcon icon={faCheck} />
            </NewIcon>
            {viewMode === "fullWidth" && <span>Installed</span>}
          </NewButton>
        )
      ) : (
        <NewButton
          onClick={onInstallClick}
          title="Install"
          csVariant="accent"
          csSize="small"
        >
          <NewIcon noWrapper csMode="inline">
            <FontAwesomeIcon icon={faDownload} />
          </NewIcon>
          {viewMode === "fullWidth" && <span>Install</span>}
        </NewButton>
      )}

      {viewMode === "fullWidth" && (
        <NewButton
          onClick={onInstallClick}
          csVariant="secondary"
          csModifiers={["ghost"]}
          csSize="small"
        >
          <NewIcon noWrapper csMode="inline">
            <FontAwesomeIcon icon={faDownload} />
          </NewIcon>
          <span>Download</span>
        </NewButton>
      )}
    </div>
  );

  return (
    <CardPackage
      packageData={listing}
      isLiked={false}
      csVariant={viewMode as CardPackageVariants}
      footerExtension={actions}
    />
  );
};

export default OnlinePackageCard;
