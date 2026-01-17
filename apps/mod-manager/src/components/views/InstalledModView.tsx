import BuildIcon from "@mui/icons-material/Build";
import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewIcon from "@mui/icons-material/GridView";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SearchIcon from "@mui/icons-material/Search";
import ViewListIcon from "@mui/icons-material/ViewList";
import React, { useEffect, useMemo, useState } from "react";
import { AutoSizer } from "react-virtualized-auto-sizer";
import * as ReactWindow from "react-window";

import ManifestV2 from "../../model/ManifestV2";
import Profile from "../../model/Profile";
import R2Error from "../../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import ProfileModList from "../../r2mm/mods/ProfileModList";
import ModInstallerService from "../../services/ModInstallerService";
import "./InstalledModView.css";

const List = ReactWindow.FixedSizeList;

interface RowData {
  mods: ExtendedMod[];
  toggle: (mod: ManifestV2) => void;
  uninstall: (mod: ManifestV2) => void;
  checkUpdates: (mod: ManifestV2) => void;
}

interface ExtendedMod {
  id: string;
  name: string;
  author: string;
  description: string;
  image: string;
  tags: string[];
  version: string;
  enabled: boolean;
  isLatest: boolean;
  isDeprecated: boolean;
  isModLoader: boolean;
  manifest: ManifestV2;
}

const Row = ({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: RowData;
}) => {
  const pkg = data.mods[index];

  return (
    <div style={style}>
      <div className="package-list__row">
        {/* Mod Info Column */}
        <div className="package-list__col-mod">
          <div className="package-list__img-container">
            <img src={pkg.image} className="package-list__img" alt={pkg.name} />
          </div>
          <div className="package-list__info">
            <div className="package-list__title" title={pkg.name}>
              {pkg.name}
            </div>
            <div className="package-list__desc" title={pkg.description}>
              {pkg.description}
            </div>
          </div>
        </div>

        {/* Author Column */}
        <div className="package-list__col-author">
          <span className="package-list__text-link">{pkg.author}</span>
        </div>

        {/* Version Column */}
        <div className="package-list__col-version">{pkg.version}</div>

        {/* Categories Column */}
        <div className="package-list__col-categories">
          <div className="package-list__tags">
            {pkg.tags.length > 0 ? (
              <>
                {pkg.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="package-list__pill">
                    {tag}
                  </span>
                ))}
                {pkg.tags.length > 3 && (
                  <span className="package-list__pill">...</span>
                )}
              </>
            ) : (
              <span className="package-list__pill">Mod</span>
            )}
          </div>
        </div>

        {/* Enabled Column */}
        <div className="package-list__col-enabled">
          <label
            className={`package-list__switch-new ${
              pkg.isModLoader ? "disabled" : ""
            }`}
            title={
              pkg.isModLoader ? "Mod Loaders cannot be disabled" : undefined
            }
          >
            <input
              type="checkbox"
              checked={pkg.enabled}
              onChange={() => !pkg.isModLoader && data.toggle(pkg.manifest)}
              disabled={pkg.isModLoader}
            />
            <div className="slider-new"></div>
          </label>
        </div>

        {/* More Menu Column */}
        <div className="package-list__col-more">
          {/* Placeholder for 'more' menu */}
        </div>
      </div>
    </div>
  );
};

const InstalledModView: React.FC = () => {
  const [mods, setMods] = useState<ManifestV2[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Updates" | "Disabled" | "Deprecated"
  >("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const fetchMods = async () => {
    setLoading(true);
    const profile = Profile.getActiveAsImmutableProfile();
    try {
      const result = await ProfileModList.getModList(profile);
      if (result instanceof R2Error) {
        setError(result.message);
        LoggerProvider.instance.Log(LogSeverity.ERROR, result.message);
      } else {
        setMods(result);
      }
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "Unknown error");
      LoggerProvider.instance.Log(LogSeverity.ERROR, e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMods();
  }, []);

  const handleToggle = async (mod: ManifestV2) => {
    const profile = Profile.getActiveAsImmutableProfile();
    try {
      let err: R2Error | void;
      if (mod.isEnabled()) {
        err = await ModInstallerService.disable(mod, profile);
      } else {
        err = await ModInstallerService.enable(mod, profile);
      }
      if (err instanceof R2Error) {
        console.error(err);
        LoggerProvider.instance.Log(LogSeverity.ERROR, err.message);
      } else {
        await fetchMods();
      }
    } catch (e: any) {
      console.error(e);
      LoggerProvider.instance.Log(LogSeverity.ERROR, e.message);
    }
  };

  const handleUninstall = async (mod: ManifestV2) => {
    if (!confirm(`Uninstall ${mod.getDisplayName()}?`)) return;

    const profile = Profile.getActiveAsImmutableProfile();
    try {
      const err = await ModInstallerService.uninstall(mod, profile);
      if (err instanceof R2Error) {
        LoggerProvider.instance.Log(LogSeverity.ERROR, err.message);
      } else {
        setMods((prev) => prev.filter((m) => m.getName() !== mod.getName()));
      }
    } catch (e: any) {
      LoggerProvider.instance.Log(LogSeverity.ERROR, e.message);
    }
  };

  const processedMods = useMemo(() => {
    let filtered = mods || [];

    // 1. Search
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.getName().toLowerCase().includes(lower) ||
          m.getDisplayName().toLowerCase().includes(lower)
      );
    }

    // 2. Filters
    if (activeFilter === "Disabled") {
      filtered = filtered.filter((m) => !m.isEnabled());
    }

    // 3. Map to ExtendedMod
    return filtered.map((mod) => ({
      id: mod.getName(),
      name: mod.getDisplayName(),
      author: mod.getAuthorName(),
      description: mod.getDescription(),
      image: mod.getIcon(),
      tags: [],
      version: mod.getVersionNumber().toString(),
      enabled: mod.isEnabled(),
      isLatest: true,
      isDeprecated: false,
      isModLoader:
        mod.getName().toLowerCase().includes("bepinex") ||
        mod.getName().toLowerCase().includes("modloader"),
      manifest: mod,
    }));
  }, [mods, searchQuery, activeFilter]);

  if (loading) {
    return <div className="package-list__loading">Loading...</div>;
  }

  if (error) {
    return <div className="package-list__error">{error}</div>;
  }

  return (
    <div className="package-list">
      <div className="package-list__controls">
        <div className="package-list__tools-wrapper">
          <div className="package-list__search-group">
            <div className="package-list__search">
              <SearchIcon />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
              />
            </div>
            <button
              className="package-list__btn-secondary"
              onClick={() =>
                setActiveFilter((f) => (f === "All" ? "Disabled" : "All"))
              }
            >
              <FilterListIcon />
              <span>{activeFilter === "All" ? "Filters" : activeFilter}</span>
            </button>
          </div>

          <div className="package-list__actions-group">
            <button
              className="package-list__btn-secondary"
              onClick={() => {
                /* Check updates placeholder */
              }}
            >
              Check for updates
            </button>

            <div className="package-list__view-toggle">
              <button
                className={`package-list__toggle-btn ${
                  viewMode === "grid" ? "active" : ""
                }`}
                onClick={() => setViewMode("grid")}
                title="Show as grid"
              >
                <GridViewIcon />
              </button>
              <button
                className={`package-list__toggle-btn ${
                  viewMode === "list" ? "active" : ""
                }`}
                onClick={() => setViewMode("list")}
                title="Show as list"
              >
                <ViewListIcon />
              </button>
            </div>

            <button
              className="package-list__btn-secondary icon-only"
              title="Mass edit"
            >
              <BuildIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="package-list__content">
        {/* Header Row - Only for List view */}
        {viewMode === "list" && (
          <div className="package-list__header-row">
            <div className="package-list__col-mod">
              Mod <KeyboardArrowDownIcon style={{ fontSize: 16 }} />
            </div>
            <div className="package-list__col-author">Author</div>
            <div className="package-list__col-version">Version</div>
            <div className="package-list__col-categories">Categories</div>
            <div className="package-list__col-enabled">Enabled</div>
            <div className="package-list__col-more"></div>
          </div>
        )}

        <div className="package-list__installed-view">
          {processedMods.length === 0 ? (
            <div className="package-list__empty">No mods found.</div>
          ) : (
            <div className="package-list__list-container">
              {/* @ts-ignore */}
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    width={width}
                    itemCount={processedMods.length}
                    itemSize={74}
                    itemData={{
                      mods: processedMods,
                      toggle: handleToggle,
                      uninstall: handleUninstall,
                      checkUpdates: () => {},
                    }}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstalledModView;
