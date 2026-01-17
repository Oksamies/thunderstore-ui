import {
  faChevronDown,
  faEllipsisV,
  faPlay,
  faPlus,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";

import { NewIcon } from "@thunderstore/cyberstorm";

import { useAppSelector } from "../../hooks/reduxHooks";
import GameManager from "../../model/GameManager";
import Profile from "../../model/Profile";
import "./GameHeader.css";

// Interface for dropdown menu items
interface DropdownItem {
  icon?: any;
  label: string;
  action: () => void;
  danger?: boolean;
}

const GameHeader: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const activeGame = GameManager.activeGame;
  const activeProfile = Profile.getActiveProfile();
  const installedMods = useAppSelector((state) => state.profile.modList);

  // Refs for click outside
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const closeMenu = () => setActiveMenu(null);

  const launchModded = () => {
    console.log("Launch Modded");
    // GameRunnerProvider.instance.startModded(activeGame, activeProfile);
  };

  const launchVanilla = () => {
    console.log("Launch Vanilla");
    // GameRunnerProvider.instance.startVanilla(activeGame, activeProfile);
    closeMenu();
  };

  if (!activeGame) return null;

  return (
    <div className="game-header" ref={headerRef}>
      {/* Left: Profile & Info */}
      <div className="game-header__left">
        {/* Profile Selector */}
        <div className="relative dropdown-container">
          <button
            className={`profile-btn ${
              activeMenu === "profileSelection" ? "active" : ""
            }`}
            onClick={() => toggleMenu("profileSelection")}
          >
            <div className="profile-info">
              <span className="profile-label">PROFILE</span>
              <span className="profile-name">
                {activeProfile ? activeProfile.getProfileName() : "Default"}
              </span>
            </div>
            <NewIcon noWrapper>
              <FontAwesomeIcon icon={faChevronDown} className="profile-caret" />
            </NewIcon>
          </button>
          {activeMenu === "profileSelection" && (
            <div className="dropdown-menu profile-dropdown-wrapper">
              <div className="dropdown-item">Select Profile (TODO)</div>
              {/* <DropdownProfiles /> */}
            </div>
          )}
        </div>

        {/* Profile Actions */}
        <div className="profile-actions">
          <div className="relative dropdown-container">
            <button
              className={`icon-btn ${
                activeMenu === "manageProfile" ? "active" : ""
              }`}
              onClick={() => toggleMenu("manageProfile")}
              title="Manage profile"
            >
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faEllipsisV} />
              </NewIcon>
            </button>
            {activeMenu === "manageProfile" && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={closeMenu}>
                  Rename
                </div>
                <div className="dropdown-item" onClick={closeMenu}>
                  Delete
                </div>
              </div>
            )}
          </div>

          <div className="relative dropdown-container">
            <button
              className={`icon-btn ${
                activeMenu === "addProfile" ? "active" : ""
              }`}
              onClick={() => toggleMenu("addProfile")}
              title="Add profile"
            >
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faPlus} />
              </NewIcon>
            </button>
            {activeMenu === "addProfile" && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={closeMenu}>
                  Create new
                </div>
                <div className="dropdown-item" onClick={closeMenu}>
                  Import
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mod Count */}
        <div className="mod-count-tag">
          <span className="count-text">{installedMods.length}</span>
        </div>
      </div>

      {/* Right: Launch & Options */}
      <div className="game-header__right">
        <div className="relative dropdown-container">
          <button
            className={`icon-btn ${
              activeMenu === "gameOptions" ? "active" : ""
            }`}
            onClick={() => toggleMenu("gameOptions")}
            title="Game options"
          >
            <NewIcon noWrapper>
              <FontAwesomeIcon icon={faEllipsisV} />
            </NewIcon>
          </button>
          {activeMenu === "gameOptions" && (
            <div className="dropdown-menu dropdown-right">
              <div className="dropdown-item" onClick={closeMenu}>
                Launch arguments
              </div>
              <div className="dropdown-item" onClick={closeMenu}>
                Open folder
              </div>
            </div>
          )}
        </div>

        <div className="launch-group relative">
          <button className="launch-main" onClick={launchModded}>
            <NewIcon noWrapper>
              <FontAwesomeIcon icon={faPlay} />
            </NewIcon>
            <span>Play modded</span>
          </button>
          <div className="relative">
            <button
              className="launch-caret"
              onClick={() => toggleMenu("launch")}
            >
              <NewIcon noWrapper>
                <FontAwesomeIcon icon={faChevronDown} />
              </NewIcon>
            </button>
            {activeMenu === "launch" && (
              <div className="dropdown-menu dropdown-right launch-menu-override">
                <div className="dropdown-item" onClick={launchVanilla}>
                  <NewIcon noWrapper>
                    <FontAwesomeIcon icon={faPlay} />
                  </NewIcon>
                  <span className="dropdown-text">Play vanilla</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
