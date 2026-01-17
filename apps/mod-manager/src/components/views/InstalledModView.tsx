import { openLink } from "@/utils/utils";
import {
  faFilter,
  faFolderOpen,
  faGhost,
  faGlobe,
  faSearch,
  faSort,
  faSync,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useMemo, useState } from "react";

import {
  Image,
  NewButton,
  NewIcon,
  NewSelect,
  NewSwitch,
  NewTable,
  NewTableLabels,
  NewTableSort,
  NewTextInput,
  SelectOption,
  TableCompareColumnMeta,
  TooltipWrapper,
} from "@thunderstore/cyberstorm";

import ManifestV2 from "../../model/ManifestV2";
import Profile from "../../model/Profile";
import R2Error from "../../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import ProfileModList from "../../r2mm/mods/ProfileModList";
import ModInstallerService from "../../services/ModInstallerService";
import "./InstalledModView.css";

// Interface for table display
interface ExtendedMod {
  id: string;
  name: string;
  displayName: string;
  author: string;
  description: string;
  icon: string;
  version: string;
  isEnabled: boolean;
  isModLoader: boolean;
  websiteUrl: string;
  manifest: ManifestV2;
}

const tableHeaders: NewTableLabels = [
  { value: "Icon", disableSort: true },
  { value: "Name", disableSort: false },
  { value: "Author", disableSort: false },
  { value: "Version", disableSort: false },
  { value: "Enabled", disableSort: false },
  { value: "", disableSort: true }, // Actions
];

type FilterType = "All" | "Disabled" | "ModLoaders";
type SortType =
  | "alphabetical"
  | "alphabetical-desc"
  | "author"
  | "author-desc"
  | "enabled"
  | "enabled-desc";

const filterOptions: SelectOption<FilterType>[] = [
  {
    value: "All",
    label: "All Mods",
    leftIcon: <FontAwesomeIcon icon={faFolderOpen} />,
  },
  {
    value: "Disabled",
    label: "Disabled",
    leftIcon: <FontAwesomeIcon icon={faFilter} />,
  },
];

const sortOptions: SelectOption<SortType>[] = [
  { value: "alphabetical", label: "Name (A-Z)" },
  { value: "alphabetical-desc", label: "Name (Z-A)" },
  { value: "author", label: "Author (A-Z)" },
  { value: "author-desc", label: "Author (Z-A)" },
  { value: "enabled", label: "Enabled First" },
  { value: "enabled-desc", label: "Disabled First" },
];

const InstalledModView: React.FC = () => {
  const [mods, setMods] = useState<ManifestV2[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [sortOrder, setSortOrder] = useState<SortType>("alphabetical");

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

  const handleToggle = async (mod: ManifestV2, checked: boolean) => {
    if (
      mod.getName().toLowerCase().includes("bepinex") ||
      mod.getName().toLowerCase().includes("modloader")
    ) {
      return; // Prevent disabling mod loaders
    }

    const profile = Profile.getActiveAsImmutableProfile();
    try {
      let err: R2Error | void;
      if (!checked) {
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
          m.getDisplayName().toLowerCase().includes(lower) ||
          m.getAuthorName().toLowerCase().includes(lower)
      );
    }

    // 2. Filters
    if (activeFilter === "Disabled") {
      filtered = filtered.filter((m) => !m.isEnabled());
    }

    // 3. Map
    return filtered.map(
      (mod): ExtendedMod => ({
        id: mod.getName(),
        name: mod.getName(),
        displayName: mod.getDisplayName(),
        author: mod.getAuthorName(),
        description: mod.getDescription(),
        icon: mod.getIcon(),
        version: mod.getVersionNumber().toString(),
        isEnabled: mod.isEnabled(),
        isModLoader:
          mod.getName().toLowerCase().includes("bepinex") ||
          mod.getName().toLowerCase().includes("modloader"),
        websiteUrl: mod.getWebsiteUrl(),
        manifest: mod,
      })
    );
  }, [mods, searchQuery, activeFilter]);

  const sortedMods = useMemo(() => {
    const list = [...processedMods];
    list.sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return a.displayName.localeCompare(b.displayName);
      } else if (sortOrder === "alphabetical-desc") {
        return b.displayName.localeCompare(a.displayName);
      } else if (sortOrder === "author") {
        return a.author.localeCompare(b.author);
      } else if (sortOrder === "author-desc") {
        return b.author.localeCompare(a.author);
      } else if (sortOrder === "enabled") {
        return a.isEnabled === b.isEnabled ? 0 : a.isEnabled ? -1 : 1;
      } else if (sortOrder === "enabled-desc") {
        return a.isEnabled === b.isEnabled ? 0 : a.isEnabled ? 1 : -1;
      }
      return 0;
    });
    return list;
  }, [processedMods, sortOrder]);

  const tableRows = useMemo(() => {
    return sortedMods.map((mod) => [
      {
        value: (
          <Image
            src={mod.icon}
            alt={mod.displayName}
            cardType="package"
            square
            style={{ width: "48px", height: "48px", borderRadius: "4px" }}
          />
        ),
        sortValue: 0,
      },
      {
        value: (
          <div className="table-name-col">
            <span className="name">{mod.displayName}</span>
            <span className="desc">{mod.description}</span>
          </div>
        ),
        sortValue: mod.displayName,
      },
      {
        value: mod.author,
        sortValue: mod.author,
      },
      {
        value: mod.version,
        sortValue: mod.version,
      },
      {
        value: (
          <TooltipWrapper
            tooltipText={
              mod.isModLoader
                ? "Mod loaders cannot be disabled"
                : mod.isEnabled
                  ? "Disable"
                  : "Enable"
            }
          >
            <div onClick={(e) => e.stopPropagation()}>
              <NewSwitch
                value={mod.isEnabled}
                onChange={(c) => handleToggle(mod.manifest, c)}
                disabled={mod.isModLoader}
              />
            </div>
          </TooltipWrapper>
        ),
        sortValue: mod.isEnabled ? 1 : 0,
      },
      {
        value: (
          <div className="table-actions">
            <button
              className="action-btn icon-only"
              title="Uninstall"
              onClick={(e) => {
                e.stopPropagation();
                handleUninstall(mod.manifest);
              }}
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faTrash} />
              </NewIcon>
            </button>
            <button
              className="action-btn icon-only"
              title="Open Website"
              onClick={(e) => {
                e.stopPropagation();
                openLink(mod.websiteUrl);
              }}
              disabled={!mod.websiteUrl}
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faGlobe} />
              </NewIcon>
            </button>
          </div>
        ),
        sortValue: 0,
      },
    ]);
  }, [sortedMods]);

  const handleTableSort = (meta: TableCompareColumnMeta) => {
    // 1: Name, 2: Author, 4: Enabled
    if (meta.identifier === 1) {
      setSortOrder((prev) =>
        prev === "alphabetical" ? "alphabetical-desc" : "alphabetical"
      );
    } else if (meta.identifier === 2) {
      setSortOrder((prev) => (prev === "author" ? "author-desc" : "author"));
    } else if (meta.identifier === 4) {
      setSortOrder((prev) => (prev === "enabled" ? "enabled-desc" : "enabled"));
    }
  };

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="installed-mod-view">
      <div className="island installed-mod-view__content">
        <div className="search-controls island-item">
          <div className="search-controls__left">
            <div className="search-input-wrapper">
              <NewTextInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search installed mods..."
                leftIcon={<FontAwesomeIcon icon={faSearch} />}
                clearValue={() => setSearchQuery("")}
              />
            </div>

            <NewSelect
              options={filterOptions}
              value={activeFilter}
              onChange={(val: string) => setActiveFilter(val as FilterType)}
            />

            <div className="search-sort-select">
              <NewSelect
                options={sortOptions}
                value={sortOrder}
                onChange={(val: string) => setSortOrder(val as SortType)}
                icon={<FontAwesomeIcon icon={faSort} />}
              />
            </div>
          </div>
          <div className="search-group">
            {/* Actions Group */}
            <NewButton
              onClick={() => {
                /* Placeholder for update check logic */
              }}
              csVariant="secondary"
              disabled
              title="Coming soon"
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faSync} />
              </NewIcon>
              Check for Updates
            </NewButton>
            <span className="mod-count">{processedMods.length} Mods</span>
          </div>
        </div>

        <div className="listings-table island-item">
          {processedMods.length === 0 ? (
            <div className="empty-state">
              <h3>No mods found</h3>
              <p>
                {searchQuery
                  ? "Try adjusting your search."
                  : "Go installing some mods!"}
              </p>
            </div>
          ) : (
            <NewTable
              csVariant="packages"
              headers={tableHeaders}
              rows={tableRows}
              sortByHeader={
                sortOrder.includes("alphabetical")
                  ? 1
                  : sortOrder.includes("author")
                    ? 2
                    : sortOrder.includes("enabled")
                      ? 4
                      : undefined
              }
              sortDirection={
                sortOrder.endsWith("-desc")
                  ? NewTableSort.DESC
                  : NewTableSort.ASC
              }
              onSortChange={handleTableSort}
              gridTemplateColumns="68px 4fr 2fr 100px 80px 100px"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InstalledModView;
