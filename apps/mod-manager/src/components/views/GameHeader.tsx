import {
  faChevronDown,
  faEllipsisV,
  faPlay,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import {
  NewDropDown,
  NewDropDownItem,
  NewIcon,
} from "@thunderstore/cyberstorm";

import { useAppSelector } from "../../hooks/reduxHooks";
import GameManager from "../../model/GameManager";
import Profile from "../../model/Profile";
import "./GameHeader.css";

const GameHeader: React.FC = () => {
  const activeGame = GameManager.activeGame;
  const activeProfile = Profile.getActiveProfile();
  const installedMods = useAppSelector((state) => state.profile.modList);

  const launchModded = () => {
    console.log("Launch Modded");
    // GameRunnerProvider.instance.startModded(activeGame, activeProfile);
  };

  const launchVanilla = () => {
    console.log("Launch Vanilla");
    // GameRunnerProvider.instance.startVanilla(activeGame, activeProfile);
  };

  if (!activeGame) return null;

  return (
    <div className="game-header">
      {/* Left: Profile & Info */}
      <div className="game-header__left">
        {/* Profile Selector */}
        <NewDropDown
          rootClasses="game-header-dropdown"
          trigger={
            <button className="profile-btn">
              <div className="profile-info">
                <span className="profile-label">PROFILE</span>
                <span className="profile-name">
                  {activeProfile ? activeProfile.getProfileName() : "Default"}
                </span>
              </div>
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="profile-caret"
                />
              </NewIcon>
            </button>
          }
        >
          <NewDropDownItem rootClasses="dropdown-item">
            <div>Select Profile (TODO)</div>
          </NewDropDownItem>
        </NewDropDown>

        {/* Profile Actions */}
        <div className="profile-actions">
          <NewDropDown
            rootClasses="game-header-dropdown"
            trigger={
              <button className="icon-btn" title="Manage profile">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faEllipsisV} />
                </NewIcon>
              </button>
            }
          >
            <NewDropDownItem rootClasses="dropdown-item">
              <div>Rename</div>
            </NewDropDownItem>
            <NewDropDownItem rootClasses="dropdown-item">
              <div>Delete</div>
            </NewDropDownItem>
          </NewDropDown>

          <NewDropDown
            rootClasses="game-header-dropdown"
            trigger={
              <button className="icon-btn" title="Add profile">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faPlus} />
                </NewIcon>
              </button>
            }
          >
            <NewDropDownItem rootClasses="dropdown-item">
              <div>Create new</div>
            </NewDropDownItem>
            <NewDropDownItem rootClasses="dropdown-item">
              <div>Import</div>
            </NewDropDownItem>
          </NewDropDown>
        </div>

        {/* Mod Count */}
        <div className="mod-count-tag">
          <span className="count-text">{installedMods.length}</span>
        </div>
      </div>

      {/* Right: Launch & Options */}
      <div className="game-header__right">
        <NewDropDown
          rootClasses="game-header-dropdown"
          contentAlignment="end"
          trigger={
            <button className="icon-btn" title="Game options">
              <NewIcon noWrapper csMode="inline">
                <FontAwesomeIcon icon={faEllipsisV} />
              </NewIcon>
            </button>
          }
        >
          <NewDropDownItem rootClasses="dropdown-item">
            <div>Launch arguments</div>
          </NewDropDownItem>
          <NewDropDownItem rootClasses="dropdown-item">
            <div>Open folder</div>
          </NewDropDownItem>
        </NewDropDown>

        <div className="launch-group relative">
          <button className="launch-main" onClick={launchModded}>
            <NewIcon noWrapper csMode="inline">
              <FontAwesomeIcon icon={faPlay} />
            </NewIcon>
            <span>Play modded</span>
          </button>
          <NewDropDown
            rootClasses="game-header-dropdown"
            contentAlignment="end"
            trigger={
              <button className="launch-caret">
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faChevronDown} />
                </NewIcon>
              </button>
            }
          >
            <NewDropDownItem
              onSelect={launchVanilla}
              rootClasses="dropdown-item"
            >
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <NewIcon noWrapper csMode="inline">
                  <FontAwesomeIcon icon={faPlay} />
                </NewIcon>
                <span className="dropdown-text">Play vanilla</span>
              </div>
            </NewDropDownItem>
          </NewDropDown>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
