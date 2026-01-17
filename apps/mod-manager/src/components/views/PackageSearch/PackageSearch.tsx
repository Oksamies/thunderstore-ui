import {
  faExclamationTriangle,
  faFilter,
  faGhost,
  faSearch,
  faSortAmountDown,
  faSpinner,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useMemo, useState } from "react";

import { NewIcon, NewSelect, SelectOption } from "@thunderstore/cyberstorm";
import { useDapper } from "@thunderstore/dapper";
import { PackageCategory, PackageListing } from "@thunderstore/dapper/types";
import { usePromise } from "@thunderstore/use-promise";

import { useAppDispatch, useAppSelector } from "../../../hooks/reduxHooks";
import GameManager from "../../../model/GameManager";
import ManifestV2 from "../../../model/ManifestV2";
import Profile from "../../../model/Profile";
import R2Error from "../../../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../../../providers/LoggerProvider";
import ProfileModList from "../../../r2mm/mods/ProfileModList";
import { downloadAndInstallMod } from "../../../store/slices/downloadSlice";
import OnlinePackageCard from "./OnlinePackageCard";
import "./PackageSearch.css";

function fetchPackageListings(
  dap: any,
  cId: string,
  sort: string,
  p: number,
  search: string,
  cat: string[],
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
    undefined, // sections
    undefined, // excluded_categories
    nsfw,
    deprecated
  );
}

const PackageSearch: React.FC = () => {
  const dapper = useDapper();
  const dispatch = useAppDispatch();
  const downloads = useAppSelector((state) => state.download.downloads);

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters
  const [sortOrder, setSortOrder] = useState("last-updated");
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isNsfw, setIsNsfw] = useState(false);
  const [isDeprecated, setIsDeprecated] = useState(false);

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
      });
    }
  }, [communityId, dapper]);

  const modListRequest = usePromise(fetchPackageListings, [
    dapper,
    communityId,
    sortOrder,
    page,
    debouncedSearch,
    selectedCategories,
    isNsfw,
    isDeprecated,
  ]);

  const handleDownload = async (
    listing: PackageListing,
    update: boolean = false
  ) => {
    const modId = `${listing.namespace}-${listing.name}`;
    const downloadState = downloads[modId];
    if (downloadState && downloadState.status === "downloading") return;

    const action = update ? "Update" : "Download";
    if (!confirm(`${action} ${listing.name}?`)) return;

    LoggerProvider.instance.Log(
      LogSeverity.INFO,
      `User initiated ${action} for ${modId}`
    );
    dispatch(downloadAndInstallMod(listing));
  };

  const clearFilters = () => {
    setSearch("");
    setSortOrder("last-updated");
    setSelectedCategories([]);
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

  if (!communityId) return <div>No game selected</div>;

  return (
    <div className="package-search">
      {/* Sidebar */}
      <div className="package-search__sidebar island-item">
        <div className="filters-container">
          {/* Sort */}
          <div className="filter-group">
            <h4 className="filter-title">Sort By</h4>
            <select
              className="filter-select"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="last-updated">Last Updated</option>
              <option value="top-rated">Top Rated</option>
              <option value="most-downloaded">Most Downloaded</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <h4 className="filter-title">Categories</h4>
            <div className="category-list">
              {categories.map((cat) => (
                <label key={cat.id} className="checkbox-simple">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other */}
          <div className="filter-group">
            <h4 className="filter-title">Other</h4>
            <label className="checkbox-simple">
              <input
                type="checkbox"
                checked={isDeprecated}
                onChange={(e) => setIsDeprecated(e.target.checked)}
              />
              <span>Deprecated</span>
            </label>
            <label className="checkbox-simple">
              <input
                type="checkbox"
                checked={isNsfw}
                onChange={(e) => setIsNsfw(e.target.checked)}
              />
              <span>NSFW</span>
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="package-search__content">
        {/* Search Controls */}
        <div className="search-controls island-item">
          <div className="search-input-wrapper">
            <NewIcon noWrapper rootClasses="search-icon">
              <FontAwesomeIcon icon={faSearch} />
            </NewIcon>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mods..."
              className="search-input"
            />
            {search && (
              <button onClick={() => setSearch("")} className="clear-btn">
                <NewIcon noWrapper>
                  <FontAwesomeIcon icon={faTimes} />
                </NewIcon>
              </button>
            )}
          </div>

          <div className="results-meta">
            <div className="count-display">
              {modListRequest.data?.count !== undefined && (
                <>
                  <span className="highlight">{modListRequest.data.count}</span>{" "}
                  packages found
                </>
              )}
            </div>

            <div className="results-controls">
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="page-btn"
                >
                  Prev
                </button>
                <span className="page-info">Page {page}</span>
                <button
                  disabled={!modListRequest.data?.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="listings-grid-container island-item">
          {modListRequest.loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading packages...</p>
            </div>
          ) : modListRequest.error ? (
            <div className="error-state">
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </NewIcon>
              <p>Failed to load packages</p>
              {/* Error message handling could be better */}
            </div>
          ) : modListRequest.data?.results.length === 0 ? (
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
          ) : (
            <div className="listings-grid">
              {modListRequest.data?.results.map((listing) => (
                <OnlinePackageCard
                  key={`${listing.namespace}-${listing.name}`}
                  listing={listing}
                  installedMods={installedMods}
                  downloadState={
                    downloads[`${listing.namespace}-${listing.name}`]
                  }
                  handleDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageSearch;
