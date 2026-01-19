import {
  faCaretDown,
  faGamepad,
  faList,
  faMagnifyingGlass,
  faServer,
  faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import path from "path-browserify";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  NewIcon as Icon,
  NewButton,
  NewDropDown,
  NewDropDownItem,
  NewSelect,
  NewTextInput,
  SelectOption,
} from "@thunderstore/cyberstorm";
import { useDapper } from "@thunderstore/dapper";
import { Community } from "@thunderstore/dapper/types";

import { CardCommunity } from "../components/CardCommunity";
import { GameListRow } from "../components/GameListRow";
import { GameInstanceType } from "../data/ecosystemTypes";
import Game from "../model/Game";
import GameManager from "../model/GameManager";
import Profile from "../model/Profile";
import { SortOptions, getSortOptionLabel } from "../model/SortOptions";
import FsProvider from "../providers/FsProvider";
import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ProfileProvider from "../providers/ProfileProvider";
import ManagerSettings from "../r2mm/manager/ManagerSettings";
import PathResolver from "../r2mm/manager/PathResolver";
import GameResolverService from "../services/GameResolverService";
import "./GameSelection.css";

// Track auto-selection to prevent navigation loops
let autoSelectAttempted = false;

const GameSelection = () => {
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const dapper = useDapper();

  // Data State
  const games = useMemo(() => GameManager.gameList, []);
  const [isGameListLoading, setIsGameListLoading] = useState(true);
  const [communityData, setCommunityData] = useState<Record<string, Community>>(
    {}
  );
  const [sortedIdentifiers, setSortedIdentifiers] = useState<string[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [selectionType, setSelectionType] = useState<"game" | "server">("game");
  const [favorites, setFavorites] = useState<string[]>(
    ManagerSettings.instance.favoriteGames
  );

  // Sorting State
  const [sortBy, setSortBy] = useState<SortOptions>(SortOptions.Popular);

  // Filtered & Sorted Games
  const filteredGames = useMemo(() => {
    // 1. Filter by Name and Type
    const result = games.filter(
      (game) =>
        game.displayName.toLowerCase().includes(filter.toLowerCase()) &&
        game.instanceType === (selectionType as unknown as GameInstanceType)
    );

    // 2. Sort Logic
    if (sortedIdentifiers.length > 0) {
      // Create a rank map for O(1) lookup
      const rankMap = new Map(
        sortedIdentifiers.map((id, index) => [id, index])
      );
      // Max rank for items not in the list
      const MAX_RANK = sortedIdentifiers.length + 1;

      result.sort((a, b) => {
        const rankA = rankMap.has(a.communityIdentifier)
          ? rankMap.get(a.communityIdentifier)!
          : MAX_RANK;
        const rankB = rankMap.has(b.communityIdentifier)
          ? rankMap.get(b.communityIdentifier)!
          : MAX_RANK;

        if (rankA !== rankB) {
          return rankA - rankB;
        }
        // Fallback to alphabetical if ranks are equal (or both missing)
        return a.displayName.localeCompare(b.displayName);
      });
    } else {
      // Default alphabetic if no sort data yet
      result.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    return result;
  }, [games, filter, sortedIdentifiers]);

  const favoriteGames = useMemo(() => {
    // Favorites selection is sorted alphabetically usually, or could follow the main sort
    // For now, keeping them simple (alpha) or should they obey the sort?
    // Let's keep them alpha for consistency with previous behavior, unless user wants them sorted too.
    return games
      .filter((game) => favorites.includes(game.internalFolderName))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [games, favorites]);

  const toggleFavorite = async (game: Game) => {
    await ManagerSettings.instance.toggleFavorite(game.internalFolderName);
    setFavorites(ManagerSettings.instance.favoriteGames);
  };

  // Fetch Communities with Sorting
  useEffect(() => {
    const fetchCommunities = async () => {
      setIsLoadingCommunities(true);
      try {
        // Fetch first page (100 items?) to get the top sorted list
        // Note: If we really want ALL games sorted correctly, we'd need to fetch all pages.
        // For performance, getting the top N is usually enough for "Popular/Latest".
        // Others will append at the bottom.
        const result = await dapper.getCommunities(1, sortBy);

        const dataMap: Record<string, Community> = {};
        const idList: string[] = [];

        if (result.results) {
          result.results.forEach((c: any) => {
            dataMap[c.identifier] = c;
            idList.push(c.identifier);
          });
        }
        setCommunityData((prev) => ({ ...prev, ...dataMap }));
        setSortedIdentifiers(idList);
      } catch (e) {
        console.error("Failed to fetch communities", e);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, [dapper, sortBy]);

  // Handle Selection
  const selectGame = async (game: Game) => {
    LoggerProvider.instance.Log(
      LogSeverity.INFO,
      `User selected game: ${game.displayName} (${game.internalFolderName})`
    );

    const gamePath = await GameResolverService.resolveGamePath(game);

    if (!gamePath) {
      LoggerProvider.instance.Log(
        LogSeverity.WARNING,
        `Game path detection failed for: ${game.displayName}`
      );
      const confirmed = window.confirm(
        `Could not automatically find ${game.displayName}. Would you like to select the installation folder manually?`
      );
      if (!confirmed) return;

      const api = window.electronAPI;
      const selected = await api.openDialog({
        title: `Select folder for ${game.displayName}`,
        properties: ["openDirectory"],
      });

      if (selected && selected.length > 0) {
        await ManagerSettings.instance.setGameDirectory(game, selected[0]);
      } else {
        return;
      }
    }

    await GameManager.activate(game);

    await ManagerSettings.instance.setLastSelectedGame(game.internalFolderName);

    // Profile Selection Logic
    const root = Profile.getRootDir();
    if (!(await FsProvider.instance.exists(root))) {
      await FsProvider.instance.mkdirs(root);
    }

    let profileToSelect = "Default";
    const lastProfile = ManagerSettings.instance.getLastSelectedProfile(game);

    if (
      lastProfile &&
      (await FsProvider.instance.exists(path.join(root, lastProfile)))
    ) {
      profileToSelect = lastProfile;
    } else {
      // Find existing profiles
      const entries = await FsProvider.instance.readdir(root);
      const validProfiles: string[] = [];
      for (const entry of entries) {
        const fullPath = path.join(root, entry);
        const stat = await FsProvider.instance.stat(fullPath);
        if (
          stat &&
          stat.isDirectory &&
          entry.toLowerCase() !== "_profile_update"
        ) {
          validProfiles.push(entry);
        }
      }

      if (validProfiles.length > 0) {
        // Pick first alphabetical, or "Default" if exists
        if (validProfiles.includes("Default")) {
          profileToSelect = "Default";
        } else {
          profileToSelect = validProfiles.sort()[0];
        }
      } else {
        // Create Default
        await ProfileProvider.instance.createProfile("Default");
        profileToSelect = "Default";
      }
    }

    // Set active profile
    new Profile(profileToSelect);
    await ManagerSettings.instance.setLastSelectedProfile(
      game,
      profileToSelect
    );

    navigate("/manager");
  };

  // Initialization Logic (Auto-select)
  useEffect(() => {
    const init = async () => {
      if (location.state && location.state.clearGame) {
        await ManagerSettings.instance.setLastSelectedGame("");
        setIsGameListLoading(false);
        return;
      }

      const lastGame = ManagerSettings.instance.lastSelectedGame;
      if (lastGame && !autoSelectAttempted) {
        autoSelectAttempted = true;
        const game = GameManager.findByFolderName(lastGame);
        if (game) {
          selectGame(game);
          return;
        }
      }
      setIsGameListLoading(false);
    };
    init();
  }, []);

  const sortOptions: SelectOption[] = Object.values(SortOptions).map((val) => ({
    value: val,
    label: getSortOptionLabel(val),
  }));

  if (isGameListLoading) {
    return (
      <div className="game-selection__loading">
        <div className="game-selection__spinner"></div>
        <div className="game-selection__loading-text">
          Loading Game Selection...
        </div>
      </div>
    );
  }

  return (
    <div className="container container--y container--full island-item game-selection-container">
      {/* Header */}
      <div className="game-selection-header">
        <div className="game-selection-title">
          <span className="game-selection-title-text">Select</span>
          <NewDropDown
            trigger={
              <button className="game-type-select-button">
                {selectionType === "game" ? "Game" : "Dedicated Server"}
                <Icon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faCaretDown} />
                </Icon>
              </button>
            }
          >
            <NewDropDownItem>
              <div
                className="game-type-dropdown-item"
                onClick={() => setSelectionType("game")}
              >
                <div className="game-type-dropdown-icon">
                  <FontAwesomeIcon icon={faGamepad} />
                </div>
                <span>Game</span>
              </div>
            </NewDropDownItem>
            <NewDropDownItem>
              <div
                className="game-type-dropdown-item"
                onClick={() => setSelectionType("server")}
              >
                <div className="game-type-dropdown-icon">
                  <FontAwesomeIcon icon={faServer} />
                </div>
                <span>Dedicated Server</span>
              </div>
            </NewDropDownItem>
          </NewDropDown>
        </div>

        {/* Search & Sort */}
        <div className="game-selection-controls">
          <div className="game-selection-search">
            <NewTextInput
              csSize="small"
              leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
              placeholder="Search..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              clearValue={() => setFilter("")}
            />
          </div>

          <div className="game-selection-sort">
            <NewSelect
              options={sortOptions}
              value={sortBy}
              onChange={(val) => setSortBy(val as SortOptions)}
              csSize="small"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="game-selection-view-toggle">
          <NewButton
            onClick={() => setViewMode("card")}
            csSize="small"
            csModifiers={["icon-only", viewMode === "card" ? "primary" : ""]}
            csVariant={viewMode === "card" ? "primary" : "secondary"}
            title="Card View"
            rootClasses="game-selection-view-toggle-btn--left"
          >
            <Icon noWrapper csMode="inline">
              <FontAwesomeIcon icon={faTableCellsLarge} />
            </Icon>
          </NewButton>
          <NewButton
            onClick={() => setViewMode("list")}
            csSize="small"
            csModifiers={["icon-only", viewMode === "list" ? "primary" : ""]}
            csVariant={viewMode === "list" ? "primary" : "secondary"}
            title="List View"
            rootClasses="game-selection-view-toggle-btn--right"
          >
            <Icon noWrapper csMode="inline">
              <FontAwesomeIcon icon={faList} />
            </Icon>
          </NewButton>
        </div>
      </div>

      {/* Content */}
      <div className="game-selection-content">
        {/* Favorites */}
        {favoriteGames.length > 0 && (
          <div className="game-section">
            <h3 className="game-section-title">My games</h3>
            <div
              className={`game-list ${
                viewMode === "list" ? "is-list-view" : ""
              }`}
            >
              {favoriteGames.map((game: any) => (
                <div
                  key={`${game.internalFolderName}-fav`}
                  className="game-item-wrapper"
                >
                  {viewMode === "card" ? (
                    <CardCommunity
                      game={game}
                      onClick={selectGame}
                      isFavorite={true}
                      image={
                        communityData[game.communityIdentifier]?.cover_image_url
                      }
                      onToggleFavorite={toggleFavorite}
                    />
                  ) : (
                    <GameListRow
                      game={game}
                      community={communityData[game.communityIdentifier]}
                      onClick={selectGame}
                      isFavorite={true}
                      onToggleFavorite={toggleFavorite}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Games */}
        <div className="game-section">
          <h3 className="game-section-title">All games</h3>
          {filteredGames.length === 0 ? (
            <div className="game-selection__empty">
              No games found matching "{filter}"
            </div>
          ) : (
            <div
              className={`game-list ${
                viewMode === "list" ? "is-list-view" : ""
              }`}
            >
              {filteredGames.map((game) => (
                <div
                  key={game.internalFolderName}
                  className="game-item-wrapper"
                >
                  {viewMode === "card" ? (
                    <CardCommunity
                      game={game}
                      onClick={selectGame}
                      isFavorite={favorites.includes(game.internalFolderName)}
                      image={
                        communityData[game.communityIdentifier]?.cover_image_url
                      }
                      onToggleFavorite={toggleFavorite}
                    />
                  ) : (
                    <GameListRow
                      game={game}
                      community={communityData[game.communityIdentifier]}
                      onClick={selectGame}
                      isFavorite={favorites.includes(game.internalFolderName)}
                      onToggleFavorite={toggleFavorite}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSelection;
