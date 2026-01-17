import {
  faBox,
  faCircleQuestion,
  faCircleUser,
  faCog,
  faDownload,
  faGamepad,
  faHouse,
  faMagnifyingGlass,
  faPen,
  faRightFromBracket,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { NewIcon as Icon } from "@thunderstore/cyberstorm";
import { useDapper } from "@thunderstore/dapper";

import dotSelected from "../../assets/dot-selected.svg";
import dotUnselected from "../../assets/dot-unselected.svg";
import GameManager from "../../model/GameManager";
import Profile from "../../model/Profile";
import { RootState } from "../../store";
import "./Sidebar.css";

// Interface for sidebar items
interface SidebarItemProps {
  label: string;
  to?: string;
  icon: any;
  showDot?: boolean;
  downloadProgress?: number;
  badgeAmt?: number;
  isActive?: boolean;
  onClick?: () => void;
  collapsed: boolean;
  className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  label,
  to,
  icon,
  showDot,
  downloadProgress,
  badgeAmt,
  isActive,
  onClick,
  collapsed,
  className,
}) => {
  const content = (
    <>
      <div className="sidebar__item-icon-wrapper">
        <Icon noWrapper>
          <FontAwesomeIcon icon={icon} className="sidebar__item-icon" />
        </Icon>
      </div>
      <span className="sidebar__item-label">{label}</span>
      {showDot && (
        <div
          className={`sidebar__dot ${isActive ? "sidebar__dot--active" : ""}`}
        >
          <img
            src={isActive ? dotSelected : dotUnselected}
            alt="Status dot"
            className="sidebar__dot-icon"
          />
        </div>
      )}
      {downloadProgress !== undefined && (
        <div className="sidebar__progress-track">
          <div
            className="sidebar__progress-bar"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
      {badgeAmt !== undefined && badgeAmt > 0 && !collapsed && (
        <div className="sidebar__badge">
          <span className="sidebar__badge-text">{badgeAmt}</span>
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`sidebar__item ${isActive ? "sidebar__item--active" : ""} ${
          className ?? ""
        }`}
        title={collapsed ? label : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={`sidebar__item ${isActive ? "sidebar__item--active" : ""} ${
        className ?? ""
      }`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      {content}
    </button>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dapper = useDapper();
  const activeGame = GameManager.activeGame;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const activeProfile = Profile.getActiveProfile();
  const [collapsed, setCollapsed] = useState(false);
  const [gameIcon, setGameIcon] = useState<string | undefined>(undefined);

  // Redux state
  const installedMods = useSelector(
    (state: RootState) => state.profile.modList
  );
  // Assuming tsMods might be populated later, using placeholder or derived length if available
  const availableMods = useSelector((state: RootState) => state.tsMods.mods);
  const activeDownloads = useSelector(
    (state: RootState) => state.download.downloads
  );

  // Determine active download state
  const ongoingDownload = Object.values(activeDownloads).find(
    (d) => d.status === "installing" || d.status === "fetching-details"
  );
  const downloadProgress = ongoingDownload
    ? ongoingDownload.progress
    : undefined;

  useEffect(() => {
    const fetchGameIcon = async () => {
      if (activeGame) {
        // Prefer boxArt, try to get community icon if needed
        if (activeGame.boxArtUrl) {
          setGameIcon(activeGame.boxArtUrl);
        } else {
          try {
            const community = await dapper.getCommunity(
              activeGame.communityIdentifier
            );
            if (community.icon_url) {
              setGameIcon(community.icon_url);
            }
          } catch (e) {
            console.error("Failed to fetch community icon", e);
          }
        }
      }
    };
    fetchGameIcon();
  }, [activeGame, dapper]);

  // If no game is selected, sidebar should be in "sparse" mode (Game Selection state)
  const hasActiveGame = !!activeGame;
  const gameName = activeGame?.displayName || "Select Game";

  const isRouteActive = (path: string) => location.pathname.includes(path);

  return (
    <div
      className={`island island-item sidebar ${
        collapsed ? "sidebar--collapsed" : "sidebar--expanded"
      }`}
    >
      {hasActiveGame && (
        <div
          className="sidebar__game-select sidebar__game-select-btn"
          onClick={() => navigate("/")}
          title="Change Game"
        >
          <div className="sidebar__game-icon-container">
            {gameIcon ? (
              <img
                alt={gameName}
                className="sidebar__game-icon"
                src={gameIcon}
              />
            ) : (
              <Icon noWrapper className="sidebar__item-icon">
                <FontAwesomeIcon icon={faGamepad} />
              </Icon>
            )}
          </div>
          <div className="sidebar__game-info">
            <p className="sidebar__game-title">{gameName}</p>
            <p className="sidebar__game-subtitle">Change game</p>
          </div>
        </div>
      )}

      {hasActiveGame ? (
        <nav className="sidebar__nav">
          <SidebarItem
            label="Home"
            to="/manager" // TODO: confirm route matches dashboard
            icon={faHouse}
            isActive={location.pathname === "/manager"}
            showDot
            collapsed={collapsed}
          />
          <SidebarItem
            label="My Mods"
            to="/manager/installed"
            icon={faBox}
            isActive={isRouteActive("installed")}
            badgeAmt={installedMods.length}
            showDot
            collapsed={collapsed}
          />
          <SidebarItem
            label="Get Mods"
            to="/manager/online"
            icon={faMagnifyingGlass}
            isActive={isRouteActive("online")}
            badgeAmt={availableMods.length}
            collapsed={collapsed}
          />
          <SidebarItem
            label="Downloads"
            to="/manager/downloads" // TODO: confirm route
            icon={faDownload}
            isActive={isRouteActive("downloads")}
            downloadProgress={downloadProgress}
            collapsed={collapsed}
          />
          <SidebarItem
            label="Edit Config"
            to="/manager/config-editor"
            icon={faPen}
            isActive={isRouteActive("config-editor")}
            collapsed={collapsed}
          />
        </nav>
      ) : (
        <nav className="sidebar__nav">
          <SidebarItem
            label="Game Select"
            to="/manager" // TODO: confirm route matches dashboard
            icon={faGamepad}
            isActive={location.pathname === "/manager"}
            collapsed={collapsed}
            className="sidebar__game-select-btn"
          />
        </nav>
      )}

      {/* Spacer to push actions to bottom if nav is empty or short */}
      {/* Handled by styling (margin-top: auto on app-actions) */}

      <div className="sidebar__app-actions">
        <SidebarItem
          label="Help"
          to="/manager/help"
          icon={faCircleQuestion}
          isActive={isRouteActive("help")}
          collapsed={collapsed}
        />
        <SidebarItem
          label="Settings"
          to="/manager/settings"
          icon={faCog}
          isActive={isRouteActive("settings")}
          collapsed={collapsed}
        />
        <SidebarItem
          label="Log In"
          // to="/login" ? or onClick
          icon={faCircleUser}
          collapsed={collapsed}
          onClick={() => {
            /* Login Logic */
          }}
        />
        <SidebarItem
          label={collapsed ? "Expand menu" : "Collapse menu"}
          icon={collapsed ? faRightToBracket : faRightFromBracket}
          collapsed={collapsed}
          onClick={() => setCollapsed(!collapsed)}
        />
      </div>

      <div className="sidebar__version">
        <span className="sidebar__version-text">
          {collapsed ? "2.1" : "2.1.0"}
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
