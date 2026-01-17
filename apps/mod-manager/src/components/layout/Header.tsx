import { faAngleLeft, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { NewIcon as Icon, NewButton } from "@thunderstore/cyberstorm";

import logoUrl from "../../assets/tslogo.svg";
import GameManager from "../../model/GameManager";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const activeGame = GameManager.activeGame;

  const getBreadcrumbName = (pathname: string) => {
    if (pathname.includes("/installed")) return "My Mods";
    if (pathname.includes("/online")) return "Get Mods";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/config-editor")) return "Config Editor";
    if (pathname.includes("/help")) return "Help";
    if (pathname.includes("/downloads")) return "Downloads";
    if (pathname.startsWith("/manager")) return "Dashboard";
    if (pathname.startsWith("/profiles")) return "Profiles";
    return "";
  };

  const currentViewName = getBreadcrumbName(location.pathname);

  useEffect(() => {
    // React Router keeps track of the history index in window.history.state.idx
    const state = window.history.state;
    if (state && typeof state.idx === "number") {
      setCanGoBack(state.idx > 0);
      setCanGoForward(state.idx < window.history.length - 1);
    }
  }, [location]);

  const handleMinimize = () => {
    window.electronAPI?.window?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.window?.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.window?.close();
  };

  return (
    <div className="header drag-region">
      {/* 2932:141467 */}

      {/* Logo Area: 5019:103897 */}
      <div className="header__logo-area" data-node-id="5019:103897">
        <div className="header__logo-mark" data-node-id="5019:103898">
          <img alt="Logo" className="header__logo-img" src={logoUrl} />
        </div>
      </div>

      {/* Page Nav: 2902:78314 */}
      <div className="header__page-nav" data-node-id="2902:78314">
        {/* Nav Controls: 2902:78315 */}
        <div className="header__nav-controls" data-node-id="2902:78315">
          <NewButton
            rootClasses={`header__nav-btn ${
              !canGoBack ? "header__nav-btn--disabled" : ""
            }`}
            data-node-id="2902:78316"
            onClick={() => navigate(-1)}
            title="Go Back"
            csModifiers={["only-icon", "ghost"]}
            csSize="xsmall"
            csVariant="secondary"
            disabled={!canGoBack}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faAngleLeft} />
            </Icon>
          </NewButton>

          <NewButton
            rootClasses={`header__nav-btn ${
              !canGoForward ? "header__nav-btn--disabled" : ""
            }`}
            data-node-id="2902:78317"
            onClick={() => navigate(1)}
            title="Go Forward"
            csModifiers={["only-icon", "ghost"]}
            csSize="xsmall"
            csVariant="secondary"
            disabled={!canGoForward}
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faAngleRight} />
            </Icon>
          </NewButton>
        </div>

        {/* Breadcrumbs: 2902:78318 */}
        <div className="header__breadcrumbs" data-node-id="2902:78318">
          {location.pathname === "/" ? (
            <div className="header__breadcrumbs-item header__breadcrumbs-item--active">
              <span>Game Selection</span>
            </div>
          ) : (
            <>
              <div className="header__breadcrumbs-item">
                <span>{activeGame?.displayName || "Select Game"}</span>
              </div>
              {currentViewName && (
                <>
                  <div className="header__breadcrumbs-divider">
                    <span>/</span>
                  </div>
                  <div className="header__breadcrumbs-item header__breadcrumbs-item--active">
                    <span>{currentViewName}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Window Controls: 2902:78333 */}
      <div
        className="header__window-controls no-drag"
        data-node-id="2902:78333"
      >
        <button
          className="header__window-btn"
          onClick={handleMinimize}
          title="Minimize"
        >
          <div className="header__window-icon">
            {/* Segoe Fluent Icons: ChromeMinimize (uE921) */}
            <p>&#xE921;</p>
          </div>
        </button>
        <button
          className="header__window-btn"
          onClick={handleMaximize}
          title="Maximize"
        >
          <div className="header__window-icon">
            {/* Segoe Fluent Icons: ChromeMaximize (uE922) */}
            <p>&#xE922;</p>
          </div>
        </button>
        <button
          className="header__window-btn header__window-btn--close"
          onClick={handleClose}
          title="Close"
        >
          <div className="header__window-icon">
            {/* Segoe Fluent Icons: ChromeClose (uE8BB) */}
            <p>&#xE8BB;</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Header;
