import {
  faCheck,
  faRotateRight,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo, useState } from "react";

import {
  Image,
  NewButton,
  NewTable,
  NewTableLabels,
  NewTextInput,
} from "@thunderstore/cyberstorm";
import { PackageListing } from "@thunderstore/dapper/types";

import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import GameManager from "../../model/GameManager";
import {
  clearDownload,
  clearFinishedDownloads,
  downloadAndInstallMod,
} from "../../store/slices/downloadSlice";
import "./DownloadsView.css";
import GameHeader from "./GameHeader";

const DownloadsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const downloads = useAppSelector((state) => state.download.downloads);
  const [searchQuery, setSearchQuery] = useState("");

  const activeGame = GameManager.activeGame;

  // Convert Record<string, DownloadProgress> to array
  const downloadParams = useMemo(() => {
    return Object.entries(downloads).map(([id, data]) => ({
      id,
      ...data,
    }));
  }, [downloads]);

  const sortedDownloads = useMemo(() => {
    let filtered = downloadParams;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (dl) =>
          dl.id.toLowerCase().includes(lower) ||
          (dl.modName && dl.modName.toLowerCase().includes(lower)) ||
          dl.message.toLowerCase().includes(lower)
      );
    }

    // Sort by status (active first) then by name
    return [...filtered].sort((a, b) => {
      const isRunningA =
        a.status === "installing" || a.status === "fetching-details";
      const isRunningB =
        b.status === "installing" || b.status === "fetching-details";

      if (isRunningA && !isRunningB) return -1;
      if (!isRunningA && isRunningB) return 1;
      return (a.modName || a.id).localeCompare(b.modName || b.id);
    });
  }, [downloadParams, searchQuery]);

  const handleRetry = (dl: any) => {
    if (!activeGame || !dl.modName || !dl.author) return;

    const listing = {
      name: dl.modName,
      namespace: dl.author,
      community_identifier: activeGame.communityIdentifier,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latest_version_number: dl.version || "",
      // Provide defaults for others to satisfy type
      full_name: `${dl.author}-${dl.modName}`,
      description: "",
      icon_url: dl.iconUrl || "",
      datetime_created: "",
      last_updated: "",
      rating_count: 0,
      download_count: 0,
      package_url: "",
      is_pinned: false,
      is_deprecated: false,
      is_nsfw: false,
      categories: [],
      versions: [],
      available_versions: [],
      team_name: dl.author,
    } as unknown as PackageListing;

    dispatch(downloadAndInstallMod(listing));
  };

  const tableRows = useMemo(() => {
    return sortedDownloads.map((dl) => {
      const isRunning =
        dl.status === "installing" || dl.status === "fetching-details";
      const isFailed = dl.status === "failed";
      // const isCompleted = dl.status === "completed"; // Not used in this render logic but available

      // Mock progress logic (since we don't have real bytes yet)
      const displayProgress =
        dl.progress > 0
          ? dl.progress
          : dl.status === "fetching-details"
            ? 10
            : 50;

      return [
        // Column 1: Mod Info
        {
          value: (
            <div className="mod-cell">
              <div className="mod-icon">
                {dl.iconUrl ? (
                  <Image
                    src={dl.iconUrl}
                    alt={dl.modName || dl.id}
                    cardType="package"
                    square
                  />
                ) : (
                  <div className="mod-icon-placeholder" />
                )}
              </div>
              <div className="mod-info">
                <span className="mod-name">{dl.modName || dl.id}</span>
                <span className="mod-author">by {dl.author || "Unknown"}</span>
                {dl.version && (
                  <span className="mod-version">{dl.version}</span>
                )}
              </div>
            </div>
          ),
          sortValue: dl.modName || dl.id,
        },
        // Column 2: Progress Bar
        {
          value: (
            <div className="progress-cell">
              {/* Always show track for visual consistency or only when running? Design usually shows it. */}
              {isRunning || isFailed ? (
                <div className={`progress-track ${isFailed ? "failed" : ""}`}>
                  <div
                    className="progress-fill"
                    style={{
                      width: isRunning
                        ? `${displayProgress}%`
                        : isFailed
                          ? "100%"
                          : "0%",
                      animation: isRunning
                        ? "loading-bar-anim 1s infinite linear"
                        : "none",
                    }}
                  />
                </div>
              ) : (
                <div className="progress-track completed">
                  <div className="progress-fill" style={{ width: "100%" }} />
                </div>
              )}
            </div>
          ),
          sortValue: dl.progress,
        },
        // Column 3: Status Text
        {
          value: (
            <div className="status-cell">
              {isRunning && (
                <span className="status-text status-text--running">
                  {dl.message || "Working..."}
                </span>
              )}
              {dl.status === "completed" && (
                <span className="status-text status-text--success">
                  <FontAwesomeIcon icon={faCheck} className="icon-gap" />
                  Installed
                </span>
              )}
              {isFailed && (
                <span className="status-text status-text--error">
                  {dl.error || "Failed"}
                </span>
              )}
            </div>
          ),
          sortValue: dl.status,
        },
        // Column 4: Actions
        {
          value: (
            <div className="actions-cell">
              {isFailed && (
                <button
                  className="btn-retry"
                  onClick={() => handleRetry(dl)}
                  title="Retry"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  <span>Retry</span>
                </button>
              )}
              <button
                className="btn-close"
                onClick={() => dispatch(clearDownload(dl.id))}
                title="Remove from list"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ),
          sortValue: 0,
        },
      ];
    });
  }, [sortedDownloads, dispatch, activeGame]);

  const currentTableHeaders: NewTableLabels = [
    { value: "Mod", disableSort: false },
    { value: "Progress", disableSort: true },
    { value: "Status", disableSort: false },
    { value: "", disableSort: true },
  ];

  return (
    <div className="island downloads-view">
      <GameHeader />
      <div className="island downloads-view__content">
        <div className="downloads-tools island-item">
          <div className="downloads-search">
            <NewTextInput
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search downloads..."
              leftIcon={<FontAwesomeIcon icon={faSearch} />}
              clearValue={() => setSearchQuery("")}
            />
          </div>
          <div className="downloads-actions">
            <NewButton
              onClick={() => dispatch(clearFinishedDownloads())}
              csVariant="secondary"
              csSize="medium"
            >
              Clear Finished
            </NewButton>
          </div>
        </div>

        <div className="downloads-list island-item">
          {downloadParams.length === 0 ? (
            <div className="empty-state">
              <h3>No active or recent downloads</h3>
              <p>Mods you install will appear here.</p>
            </div>
          ) : (
            <NewTable
              csVariant="packages"
              headers={currentTableHeaders}
              rows={tableRows}
              gridTemplateColumns="3fr 2fr 2fr 100px"
              className="downloads-table"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadsView;
