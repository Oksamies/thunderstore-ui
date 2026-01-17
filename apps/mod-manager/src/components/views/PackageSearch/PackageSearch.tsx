import {
  faDownload,
  faEllipsisV,
  faFilter,
  faGhost,
  faList,
  faSearch,
  faSpinner,
  faSyncAlt,
  faTableList,
  faTh,
  faThLarge,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useMemo, useState } from "react";

import {
  CardPackage,
  Image,
  NewButton,
  NewIcon,
  NewSelect,
  NewTable,
  type NewTableLabels,
  NewTableSort,
  NewTag,
  NewTextInput,
  RelativeTime,
  SelectOption,
  type TableCompareColumnMeta,
  formatInteger,
} from "@thunderstore/cyberstorm";
import { type CardPackageVariants } from "@thunderstore/cyberstorm-theme";
import { useDapper } from "@thunderstore/dapper";
import {
  PackageCategory,
  PackageListing,
  PaginatedList,
} from "@thunderstore/dapper/types";
import { usePromise } from "@thunderstore/use-promise";

import { useAppDispatch, useAppSelector } from "../../../hooks/reduxHooks";
import GameManager from "../../../model/GameManager";
import ManifestV2 from "../../../model/ManifestV2";
import Profile from "../../../model/Profile";
import VersionNumber from "../../../model/VersionNumber";
import R2Error from "../../../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../../../providers/LoggerProvider";
import ProfileModList from "../../../r2mm/mods/ProfileModList";
import { downloadAndInstallMod } from "../../../store/slices/downloadSlice";
import OnlinePackageCard from "./OnlinePackageCard";
import { PackageFilterModal } from "./PackageFilterModal";
import "./PackageSearch.css";

function fetchPackageListings(
  dap: any,
  cId: string,
  sort: string,
  p: number,
  search: string,
  cat: string[],
  exclude: string[],
  section: string,
  nsfw: boolean,
  deprecated: boolean
) {
  if (!cId) return Promise.resolve(null);
  return dap.getPackageListings(
    { kind: "community", communityId: cId },
    sort,
    p,
    search,
    cat.length > 0 ? cat : undefined,
    section ? [section] : undefined, // sections
    exclude.length > 0 ? exclude : undefined, // excluded_categories
    nsfw,
    deprecated
  );
}

const LoadingState: React.FC = () => (
  <div className="loading-state">
    <NewIcon noWrapper csMode="inline">
      <FontAwesomeIcon icon={faSpinner} spin />
    </NewIcon>
    <p>Loading...</p>
  </div>
);

interface PackageListContentProps {
  communityId: string;
  sortOrder: string;
  setSortOrder: (sort: string) => void;
  page: number;
  debouncedSearch: string;
  selectedCategories: string[];
  excludedCategories: string[];
  selectedSection: string;
  isNsfw: boolean;
  isDeprecated: boolean;
  viewMode: CardPackageVariants | "list";
  installedMods: ManifestV2[];
  clearFilters: () => void;
  setHasMore: (hasMore: boolean) => void;
  refreshInstalledMods: () => void;
}

const tableHeaders: NewTableLabels = [
  { value: "Icon", disableSort: true },
  { value: "Name", disableSort: false },
  { value: "Authors", disableSort: true },
  { value: "Categories", disableSort: true },
  { value: "Downloads", disableSort: false },
  { value: "Rating", disableSort: false },
  { value: "Updated", disableSort: false },
  { value: "", disableSort: true }, // Actions
];

const PackageListContent: React.FC<PackageListContentProps> = ({
  communityId,
  sortOrder,
  setSortOrder,
  page,
  debouncedSearch,
  selectedCategories,
  excludedCategories,
  selectedSection,
  isNsfw,
  isDeprecated,
  viewMode,
  installedMods,
  clearFilters,
  setHasMore,
  refreshInstalledMods,
}) => {
  const dapper = useDapper();
  const dispatch = useAppDispatch();
  const downloads = useAppSelector((state) => state.download.downloads);

  const modListData = usePromise(fetchPackageListings, [
    dapper,
    communityId,
    sortOrder,
    page,
    debouncedSearch,
    selectedCategories,
    excludedCategories,
    selectedSection,
    isNsfw,
    isDeprecated,
  ]) as PaginatedList<PackageListing> | null;

  useEffect(() => {
    if (modListData) {
      setHasMore(modListData.hasMore);
    }
  }, [modListData, setHasMore]);

  const handleDownload = async (
    listing: PackageListing,
    update: boolean = false
  ) => {
    const modId = `${listing.namespace}-${listing.name}`;
    const downloadState = downloads[modId] as any;
    if (
      downloadState &&
      (downloadState.status === "pending" ||
        downloadState.status === "fetching-details" ||
        downloadState.status === "installing")
    )
      return;

    const action = update ? "Update" : "Download";
    if (!confirm(`${action} ${listing.name}?`)) return;

    LoggerProvider.instance.Log(
      LogSeverity.INFO,
      `User initiated ${action} for ${modId}`
    );
    dispatch(downloadAndInstallMod(listing));
  };

  const handleUninstall = async (mod: ManifestV2) => {
    if (!confirm(`Uninstall ${mod.getName()}?`)) return;
    const profile = Profile.getActiveAsImmutableProfile();
    const result = await ProfileModList.removeMod(mod, profile);
    if (result instanceof R2Error) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to uninstall ${mod.getName()}: ${result.message}`
      );
    } else {
      refreshInstalledMods();
    }
  };

  const tableRows = useMemo(() => {
    if (!modListData?.results || viewMode !== "list") return [];

    return modListData.results.map((listing: any) => {
      const modId = `${listing.namespace}-${listing.name}`;
      const installed = installedMods.find((m) => m.getName() === modId);
      const downloadState = downloads[modId] as any;
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

      const actions = (
        <div className="table-actions">
          {isDownloading ? (
            <NewButton
              disabled
              title="Downloading"
              csVariant="primary"
              csSize="small"
              csModifiers={["ghost"]}
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faSpinner} spin />
              </NewIcon>
            </NewButton>
          ) : hasUpdate ? (
            <NewButton
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(listing, true);
              }}
              title="Update"
              csVariant="success"
              csSize="small"
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faSyncAlt} />
              </NewIcon>
              Update
            </NewButton>
          ) : installed ? (
            <NewButton
              onClick={(e) => {
                e.stopPropagation();
                handleUninstall(installed);
              }}
              title="Uninstall"
              csVariant="danger"
              csSize="small"
              csModifiers={["ghost"]}
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faTrash} />
              </NewIcon>
              Uninstall
            </NewButton>
          ) : (
            <NewButton
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(listing, false);
              }}
              title="Install"
              csVariant="accent"
              csSize="small"
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faDownload} />
              </NewIcon>
              Install
            </NewButton>
          )}

          <NewButton
            csVariant="secondary"
            csSize="small"
            csModifiers={["ghost", "only-icon"]}
          >
            <NewIcon noWrapper csMode="inline">
              <FontAwesomeIcon icon={faEllipsisV} />
            </NewIcon>
          </NewButton>
        </div>
      );

      return [
        {
          value: (
            <Image
              src={listing.icon_url}
              alt={listing.name}
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
              <span className="name">{listing.name}</span>
              <span className="desc">{listing.description}</span>
            </div>
          ),
          sortValue: listing.name,
        },
        {
          value: listing.namespace,
          sortValue: listing.namespace,
        },
        {
          value: (
            <div className="table-tags">
              {listing.categories?.slice(0, 2).map((c: any) => (
                <NewTag key={c.slug} csSize="small">
                  {c.name}
                </NewTag>
              ))}
            </div>
          ),
          sortValue: 0,
        },
        {
          value: formatInteger(listing.download_count),
          sortValue: listing.download_count,
        },
        {
          value: formatInteger(listing.rating_count),
          sortValue: listing.rating_count,
        },
        {
          value: <RelativeTime time={listing.last_updated} />,
          sortValue: listing.last_updated,
        },
        {
          value: actions,
          sortValue: 0,
        },
      ];
    });
  }, [modListData, viewMode, installedMods, downloads]);

  if (!modListData || !modListData.results) {
    return (
      <div className="error-state">
        <NewIcon noWrapper>
          <FontAwesomeIcon icon={faGhost} />
        </NewIcon>
        <p>No results available</p>
      </div>
    );
  }

  if (modListData.results.length === 0) {
    return (
      <div className="empty-state">
        <NewIcon noWrapper>
          <FontAwesomeIcon icon={faGhost} />
        </NewIcon>
        <h3>No results found</h3>
        <p>Try adjusting your search or filters.</p>
        <button onClick={clearFilters} className="btn-clear">
          Clear all filters
        </button>
      </div>
    );
  }

  if (viewMode === "list") {
    const sortMap: Record<string, number> = {
      alphabetical: 1,
      "most-downloaded": 4,
      "top-rated": 5,
      "last-updated": 6,
    };

    const handleTableSort = (meta: TableCompareColumnMeta) => {
      const reverseMap: Record<number, string> = {
        1: "alphabetical",
        4: "most-downloaded",
        5: "top-rated",
        6: "last-updated",
      };
      if (reverseMap[meta.identifier]) {
        setSortOrder(reverseMap[meta.identifier]);
      }
    };

    return (
      <div className="listings-table">
        <NewTable
          csVariant="packages"
          headers={tableHeaders}
          rows={tableRows}
          sortByHeader={sortMap[sortOrder] ?? 6}
          sortDirection={
            sortOrder === "alphabetical" ? NewTableSort.ASC : NewTableSort.DESC
          }
          onSortChange={handleTableSort}
          gridTemplateColumns="68px 2fr 1fr 1fr 70px 60px 90px 180px"
        />
      </div>
    );
  }

  return (
    <div className={`listings-grid listings-grid--${viewMode}`}>
      {modListData.results.map((listing: any) =>
        viewMode === "tile" ? (
          <CardPackage
            key={`${listing.namespace}-${listing.name}`}
            packageData={listing}
            isLiked={false}
          />
        ) : (
          <OnlinePackageCard
            key={`${listing.namespace}-${listing.name}`}
            listing={listing}
            viewMode={viewMode}
            installedMods={installedMods}
            downloadState={downloads[`${listing.namespace}-${listing.name}`]}
            handleDownload={handleDownload}
          />
        )
      )}
    </div>
  );
};

const PackageSearch: React.FC = () => {
  const dapper = useDapper();
  // State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Default to list view
  const [viewMode, setViewMode] = useState<CardPackageVariants | "list">(
    "tile"
  );

  // Filters
  const [sortOrder, setSortOrder] = useState("last-updated");
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [sections, setSections] = useState<PackageCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isNsfw, setIsNsfw] = useState(false);
  const [isDeprecated, setIsDeprecated] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Data
  const [installedMods, setInstalledMods] = useState<ManifestV2[]>([]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch installed mods
  const fetchInstalled = async () => {
    const profile = Profile.getActiveAsImmutableProfile();
    const localMods = await ProfileModList.getModList(profile);
    if (!(localMods instanceof R2Error)) {
      setInstalledMods(localMods);
    }
  };

  useEffect(() => {
    fetchInstalled();
    const interval = setInterval(fetchInstalled, 5000);
    return () => clearInterval(interval);
  }, []);

  const game = GameManager.activeGame;
  const communityId = game?.communityIdentifier;

  useEffect(() => {
    if (communityId) {
      dapper.getCommunityFilters(communityId).then((filters) => {
        setCategories(filters.package_categories);
        setSections(
          filters.sections.map((s) => ({
            id: s.uuid,
            name: s.name,
            slug: s.slug,
          }))
        );
      });
    }
  }, [communityId, dapper]);

  const clearFilters = () => {
    setSearch("");
    setSortOrder("last-updated");
    setSelectedCategories([]);
    setExcludedCategories([]);
    setSelectedSection("");
    setIsNsfw(false);
    setIsDeprecated(false);
    setPage(1);
  };

  const resetModalFilters = () => {
    setSelectedCategories([]);
    setExcludedCategories([]);
    setSelectedSection("");
    setIsNsfw(false);
    setIsDeprecated(false);
    setPage(1);
  };

  // Categories Handling
  const handleCategoryToggle = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
    setPage(1);
  };

  const sortOptions: SelectOption<string>[] = [
    { value: "last-updated", label: "Last Updated" },
    { value: "top-rated", label: "Top Rated" },
    { value: "most-downloaded", label: "Most Downloaded" },
    { value: "alphabetical", label: "Alphabetical" },
  ];

  if (!communityId) return <div>No game selected</div>;

  return (
    <div className="package-search">
      {/* Content */}
      <div className="island package-search__content">
        {/* Search Controls */}
        <div className="search-controls island-item">
          <div className="search-controls__left">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <NewTextInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mods..."
                leftIcon={<FontAwesomeIcon icon={faSearch} />}
                clearValue={() => setSearch("")}
              />
            </div>

            {/* Filter Toggle */}
            <NewButton
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              csVariant={isFilterOpen ? "primary" : "secondary"}
            >
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faFilter} />
              </NewIcon>
              <span>Filters</span>
              {(selectedCategories.length > 0 ||
                excludedCategories.length > 0 ||
                selectedSection ||
                isNsfw ||
                isDeprecated) && (
                <span
                  className="file-count-badge"
                  style={{
                    background: "var(--color-accent--primary)",
                    color: "var(--color-text--primary-inverse)",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedCategories.length +
                    excludedCategories.length +
                    (selectedSection ? 1 : 0) +
                    (isNsfw ? 1 : 0) +
                    (isDeprecated ? 1 : 0)}
                </span>
              )}
            </NewButton>
          </div>

          {/* Pagination */}
          <div className="results-pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="page-btn"
            >
              Prev
            </button>
            <span className="page-info">Page {page}</span>
            <button
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="page-btn"
            >
              Next
            </button>
          </div>

          {/* Group: Sort + View Options */}
          <div className="search-group">
            <NewSelect
              options={sortOptions}
              value={sortOrder}
              rootClasses="search-sort-select"
              onChange={(val) => {
                setSortOrder(val);
                setPage(1);
              }}
            />

            <div className="view-options">
              <NewButton
                onClick={() => setViewMode("list")}
                csVariant={viewMode === "list" ? "primary" : "secondary"}
                csModifiers={["only-icon"]}
                title="List View"
              >
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faList} />
                </NewIcon>
              </NewButton>
              <NewButton
                onClick={() => setViewMode("fullWidth")}
                csVariant={viewMode === "fullWidth" ? "primary" : "secondary"}
                csModifiers={["only-icon"]}
                title="Row View"
              >
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faTableList} />
                </NewIcon>
              </NewButton>
              <NewButton
                onClick={() => setViewMode("tile")}
                csVariant={viewMode === "tile" ? "primary" : "secondary"}
                csModifiers={["only-icon"]}
                title="Tile View"
              >
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faTh} />
                </NewIcon>
              </NewButton>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="listings-grid-container island-item">
          <React.Suspense fallback={<LoadingState />}>
            <PackageListContent
              communityId={communityId}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              page={page}
              debouncedSearch={debouncedSearch}
              selectedCategories={selectedCategories}
              excludedCategories={excludedCategories}
              selectedSection={selectedSection}
              isNsfw={isNsfw}
              isDeprecated={isDeprecated}
              viewMode={viewMode}
              installedMods={installedMods}
              clearFilters={clearFilters}
              setHasMore={setHasMore}
              refreshInstalledMods={fetchInstalled}
            />
          </React.Suspense>
        </div>
      </div>
      <PackageFilterModal
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        sections={sections}
        categories={categories}
        initialSelectedSection={selectedSection}
        initialSelectedCategories={selectedCategories}
        initialExcludedCategories={excludedCategories}
        initialIsNsfw={isNsfw}
        initialIsDeprecated={isDeprecated}
        onApply={(
          section: string,
          cats: string[],
          exc: string[],
          nsfw: boolean,
          deprecated: boolean
        ) => {
          setSelectedSection(section);
          setSelectedCategories(cats);
          setExcludedCategories(exc);
          setIsNsfw(nsfw);
          setIsDeprecated(deprecated);
          setPage(1);
        }}
      />
    </div>
  );
};

export default PackageSearch;
