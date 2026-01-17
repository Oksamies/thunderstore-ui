import {
  faCaretDown,
  faCheck,
  faChevronRight,
  faClone,
  faDownload,
  faEllipsisVertical,
  faExclamationTriangle,
  faFileArchive,
  faFileImport,
  faFolderOpen,
  faGear,
  faKeyboard,
  faList,
  faMagnifyingGlass,
  faPen,
  faPlay,
  faPlus,
  faRotate,
  faTerminal,
  faTrash,
  faUsers,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import path from "path-browserify";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  NewIcon as Icon,
  NewDropDown,
  NewDropDownDivider,
  NewDropDownItem,
  NewDropDownSub,
  NewDropDownSubContent,
  NewDropDownSubTrigger,
} from "@thunderstore/cyberstorm";
import { useDapper } from "@thunderstore/dapper";
import { Community } from "@thunderstore/dapper/types";

import { DashboardModList } from "../components/dashboard/DashboardModList";
import GameManager from "../model/GameManager";
import ManifestV2 from "../model/ManifestV2";
import Profile from "../model/Profile";
import R2Error from "../model/errors/R2Error";
import FsProvider from "../providers/FsProvider";
import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ElectronGameRunnerProvider from "../providers/impl/ElectronGameRunnerProvider";
import ProfileModList from "../r2mm/mods/ProfileModList";
import ModInstallerService from "../services/ModInstallerService";
import { getModStatus } from "../utils/DashboardUtils";
import "./GameDashboard.css";

const GameDashboard: React.FC = () => {
  const dapper = useDapper();
  const activeGame = GameManager.activeGame;
  const activeProfile = Profile.getActiveProfile();
  const navigate = useNavigate();

  // State
  const [profileName, setProfileName] = useState<string>(
    activeProfile ? activeProfile.getProfileName() : "Default"
  );
  const [localProfiles, setLocalProfiles] = useState<string[]>([]);
  const [profileSearch, setProfileSearch] = useState<string>("");
  const [mods, setMods] = useState<ManifestV2[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [status, setStatus] = useState({ conflictCount: 0, updateCount: 0 });

  // Load Game & Profile Data
  useEffect(() => {
    if (!activeGame) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      // 1. Community Data (Hero Image)
      if (activeGame.communityIdentifier) {
        try {
          const c = await dapper.getCommunity(activeGame.communityIdentifier);
          setCommunity(c);
        } catch (e) {
          console.error("Failed to fetch community", e);
        }
      }

      // 2. Mod List
      await refreshModList();

      // 3. Local Profiles
      await refreshLocalProfiles();
    };

    loadData();
  }, [activeGame, dapper, navigate]);

  const refreshLocalProfiles = async () => {
    try {
      const root = Profile.getRootDir();
      const entries = await FsProvider.instance.readdir(root);
      // Filter for directories only to be safe
      const profiles: string[] = [];
      for (const entry of entries) {
        const stats = await FsProvider.instance.stat(path.join(root, entry));
        if (stats && stats.isDirectory) {
          profiles.push(entry);
        }
      }
      setLocalProfiles(profiles.sort());
    } catch (e) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to load profiles: ${e}`
      );
    }
  };

  const refreshModList = async () => {
    const profile = Profile.getActiveAsImmutableProfile();
    const result = await ProfileModList.getModList(profile);
    if (!(result instanceof R2Error)) {
      setMods(result);
      setStatus(getModStatus(result)); // Update mock counts
    }
  };

  const handleSelectProfile = async (name: string) => {
    if (name === profileName) return;

    try {
      new Profile(name); // Switch active profile
      setProfileName(name);
      await refreshModList(); // Reload mods for new profile
    } catch (e) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to switch profile: ${e}`
      );
    }
  };

  const filteredProfiles = localProfiles.filter((p) =>
    p.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const handleToggleMod = async (mod: ManifestV2, value: boolean) => {
    const profile = Profile.getActiveAsImmutableProfile();
    try {
      if (value) {
        await ModInstallerService.enable(mod, profile);
      } else {
        await ModInstallerService.disable(mod, profile);
      }
      await refreshModList(); // Refresh list to reflect state
    } catch (e) {
      LoggerProvider.instance.Log(LogSeverity.ERROR, `Toggle failed: ${e}`);
    }
  };

  const handleLaunchModded = async () => {
    if (!activeGame) return;
    try {
      const runner = new ElectronGameRunnerProvider();
      await runner.startModded(activeGame, Profile.getActiveProfile());
    } catch (e) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to launch modded: ${e}`
      );
    }
  };

  if (!activeGame) return null;

  return (
    <div className="container container--x container--full island game-dashboard">
      {/* Left Panel: Launch & Info */}
      <div className="container container--y container--full island island-item game-dashboard__left">
        {/* Background Overlay */}
        <div className="game-dashboard__bg-container">
          <img
            src={community?.hero_image_url || activeGame.gameImage}
            alt={activeGame.displayName}
            className="game-dashboard__bg-image"
          />
        </div>

        {/* Logo Area */}
        <div className="game-dashboard__logo-container">
          {/* Use community icon or falling back to game text if no logo url available easily */}
          {/* Figma had a dedicated logo layer, we might try community_icon_url or just text */}
          {community?.icon_url ? (
            <img
              src={community.icon_url}
              alt="Logo"
              className="game-dashboard__logo"
            />
          ) : (
            <h1 className="game-dashboard__title">{activeGame.displayName}</h1>
          )}
        </div>

        {/* Bottom Content: Status & Launch */}
        <div className="game-dashboard__left-content">
          {/* Status Cards */}
          <div className="game-dashboard__status-container">
            {/* Conflicts */}
            <div className="game-dashboard__status-card">
              <div className="game-dashboard__status-inner">
                <div className="game-dashboard__status-text game-dashboard__status-text--conflict">
                  <div className="game-dashboard__status-icon">
                    <Icon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                    </Icon>
                  </div>
                  <span>
                    <strong>{status.conflictCount}</strong> unresolved conflicts
                  </span>
                </div>
                <button className="game-dashboard__action-btn">Fix</button>
              </div>
            </div>

            {/* Updates */}
            <div className="game-dashboard__status-card">
              <div className="game-dashboard__status-inner">
                <div className="game-dashboard__status-text game-dashboard__status-text--update">
                  <div
                    className="game-dashboard__status-icon"
                    style={{ color: "#1ca3f5" }}
                  >
                    <Icon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faRotate} />
                    </Icon>
                  </div>
                  <span>
                    <strong>{status.updateCount}</strong> updates available
                  </span>
                </div>
                <button className="game-dashboard__action-btn">
                  Update all
                </button>
              </div>
            </div>
          </div>

          {/* Launch Group */}
          <div className="game-dashboard__launch-group">
            <button
              className="game-dashboard__launch-btn"
              onClick={handleLaunchModded}
            >
              <Icon csMode="inline" noWrapper>
                <FontAwesomeIcon icon={faPlay} />
              </Icon>
              Play modded
            </button>
            <button className="game-dashboard__launch-extra">
              <Icon csMode="inline" noWrapper>
                <FontAwesomeIcon icon={faCaretDown} />
              </Icon>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Profile & Mods */}
      <div className="container container--y container--full island island-item game-dashboard__right">
        {/* Profile Bar */}
        <div className="game-dashboard__profile-bar">
          <NewDropDown
            rootClasses="game-dashboard__profile-dropdown"
            trigger={
              <button className="game-dashboard__profile-select">
                <div style={{ display: "flex", gap: "8px" }}>
                  <div className="game-dashboard__profile-label">PROFILE</div>
                  <div className="game-dashboard__profile-name">
                    {profileName}
                  </div>
                </div>
                <Icon csMode="inline" noWrapper>
                  <FontAwesomeIcon icon={faCaretDown} />
                </Icon>
              </button>
            }
          >
            <div className="game-dashboard__profile-search-container">
              <div className="game-dashboard__profile-search">
                <Icon
                  csMode="inline"
                  noWrapper
                  rootClasses="game-dashboard__profile-search-icon"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Icon>
                <input
                  type="text"
                  placeholder="Search profiles..."
                  className="game-dashboard__profile-search-input"
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                />
              </div>
            </div>
            <NewDropDownDivider />
            <div className="game-dashboard__profile-list">
              <div className="game-dashboard__profile-group">
                <button className="game-dashboard__profile-group-header">
                  LOCAL
                </button>
                {filteredProfiles.map((name) => (
                  <NewDropDownItem
                    key={name}
                    rootClasses={`game-dashboard__profile-item ${
                      name === profileName
                        ? "game-dashboard__profile-item--active"
                        : ""
                    }`}
                    onClick={() => handleSelectProfile(name)}
                  >
                    <div className="game-dashboard__profile-item-inner">
                      <div className="game-dashboard__profile-item-name">
                        {name}
                      </div>
                      {name === profileName && (
                        <Icon csMode="inline" noWrapper>
                          <FontAwesomeIcon icon={faCheck} />
                        </Icon>
                      )}
                    </div>
                  </NewDropDownItem>
                ))}
              </div>
              <NewDropDownDivider />
              {/* STUBS - Shared profiles not yet implemented */}
              <div className="game-dashboard__profile-group">
                <button
                  className="game-dashboard__profile-group-header"
                  title="Not yet implemented"
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  SHARED (Coming Soon)
                </button>
              </div>
              <NewDropDownDivider />
              {/* STUBS - Subscribed profiles not yet implemented */}
              <div className="game-dashboard__profile-group">
                <button
                  className="game-dashboard__profile-group-header"
                  title="Not yet implemented"
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  SUBSCRIBED (Coming Soon)
                </button>
              </div>
            </div>
          </NewDropDown>

          {/* 3-Dots Dropdown */}
          <NewDropDown
            rootClasses="game-dashboard__actions-dropdown"
            trigger={
              <button
                className="game-dashboard__profile-action"
                title="Manage Profile"
              >
                <Icon csMode="inline" noWrapper>
                  <FontAwesomeIcon icon={faEllipsisVertical} />
                </Icon>
              </button>
            }
          >
            {/* Current Profile Header */}
            <div className="game-dashboard__menu-header">{profileName}</div>

            {/* Rename */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => console.log("Rename")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faPen} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Rename</span>
              </div>
            </NewDropDownItem>

            {/* Share */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => console.log("Share")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faUsers} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Share</span>
              </div>
            </NewDropDownItem>

            {/* Backup */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => console.log("Backup")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faDownload} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Backup</span>
              </div>
            </NewDropDownItem>

            {/* Clone */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => console.log("Clone")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faClone} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Clone</span>
              </div>
            </NewDropDownItem>

            {/* Sync */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => console.log("Sync")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faRotate} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Sync</span>
              </div>
            </NewDropDownItem>

            {/* Settings */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => console.log("Settings")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faGear} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Settings</span>
              </div>
            </NewDropDownItem>

            {/* Advanced */}
            <NewDropDownSub>
              <NewDropDownSubTrigger rootClasses="game-dashboard__menu-item">
                <div>
                  <div className="game-dashboard__menu-icon">
                    <Icon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faWrench} />
                    </Icon>
                  </div>
                  <span className="game-dashboard__menu-text">Advanced</span>
                  <Icon
                    csMode="inline"
                    noWrapper
                    rootClasses="game-dashboard__menu-arrow"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Icon>
                </div>
              </NewDropDownSubTrigger>
              <NewDropDownSubContent rootClasses="game-dashboard__actions-dropdown">
                {/* Set launch parameters */}
                <NewDropDownItem
                  rootClasses="game-dashboard__menu-item"
                  onClick={() => console.log("Set launch parameters")}
                >
                  <div>
                    <div className="game-dashboard__menu-icon">
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faTerminal} />
                      </Icon>
                    </div>
                    <span className="game-dashboard__menu-text">
                      Set launch parameters
                    </span>
                  </div>
                </NewDropDownItem>
                {/* Show dependency strings */}
                <NewDropDownItem
                  rootClasses="game-dashboard__menu-item"
                  onClick={() => console.log("Show dependency strings")}
                >
                  <div>
                    <div className="game-dashboard__menu-icon">
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faList} />
                      </Icon>
                    </div>
                    <span className="game-dashboard__menu-text">
                      Show dependency strings
                    </span>
                  </div>
                </NewDropDownItem>
                {/* Browse profile directory */}
                <NewDropDownItem
                  rootClasses="game-dashboard__menu-item"
                  onClick={() => console.log("Browse profile directory")}
                >
                  <div>
                    <div className="game-dashboard__menu-icon">
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faFolderOpen} />
                      </Icon>
                    </div>
                    <span className="game-dashboard__menu-text">
                      Browse profile directory
                    </span>
                  </div>
                </NewDropDownItem>
              </NewDropDownSubContent>
            </NewDropDownSub>

            <NewDropDownDivider />

            {/* Delete */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item game-dashboard__menu-danger"
              onClick={() => console.log("Delete")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faTrash} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">Delete</span>
              </div>
            </NewDropDownItem>
          </NewDropDown>

          {/* Plus Dropdown */}
          <NewDropDown
            rootClasses="game-dashboard__actions-dropdown"
            trigger={
              <button
                className="game-dashboard__profile-action"
                title="Create Profile"
              >
                <Icon csMode="inline" noWrapper>
                  <FontAwesomeIcon icon={faPlus} />
                </Icon>
              </button>
            }
          >
            {/* New Profile */}
            <NewDropDownItem
              rootClasses="game-dashboard__menu-item"
              onClick={() => navigate("/profiles")}
            >
              <div>
                <div className="game-dashboard__menu-icon">
                  <Icon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faPlus} />
                  </Icon>
                </div>
                <span className="game-dashboard__menu-text">New Profile</span>
              </div>
            </NewDropDownItem>

            {/* Import Profile Submenu */}
            <NewDropDownSub>
              <NewDropDownSubTrigger rootClasses="game-dashboard__menu-item">
                <div>
                  <div className="game-dashboard__menu-icon">
                    <Icon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faFileImport} />
                    </Icon>
                  </div>
                  <span className="game-dashboard__menu-text">
                    Import Profile...
                  </span>
                  <Icon
                    csMode="inline"
                    noWrapper
                    rootClasses="game-dashboard__menu-arrow"
                  >
                    <FontAwesomeIcon icon={faChevronRight} />
                  </Icon>
                </div>
              </NewDropDownSubTrigger>
              <NewDropDownSubContent rootClasses="game-dashboard__actions-dropdown">
                {/* From Code */}
                <NewDropDownItem
                  rootClasses="game-dashboard__menu-item"
                  onClick={() => console.log("From Code")}
                >
                  <div>
                    <div className="game-dashboard__menu-icon">
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faKeyboard} />
                      </Icon>
                    </div>
                    <span className="game-dashboard__menu-text">From Code</span>
                  </div>
                </NewDropDownItem>
                {/* From Backup */}
                <NewDropDownItem
                  rootClasses="game-dashboard__menu-item"
                  onClick={() => console.log("From Backup")}
                >
                  <div>
                    <div className="game-dashboard__menu-icon">
                      <Icon csMode="inline" noWrapper>
                        <FontAwesomeIcon icon={faFileArchive} />
                      </Icon>
                    </div>
                    <span className="game-dashboard__menu-text">
                      From Backup
                    </span>
                  </div>
                </NewDropDownItem>
              </NewDropDownSubContent>
            </NewDropDownSub>
          </NewDropDown>
        </div>

        {/* Mod List */}
        <div className="game-dashboard__list-wrapper">
          <DashboardModList mods={mods} onToggleMod={handleToggleMod} />
        </div>
      </div>
    </div>
  );
};

export default GameDashboard;
