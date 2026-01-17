import {
  faArrowsRotate,
  faBell,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import { NewIcon as Icon, NewButton } from "@thunderstore/cyberstorm";

import "./Footer.css";

const Footer = () => {
  return (
    <div className="footer">
      <div className="footer__spacer" />
      <button className="footer__status-btn">
        <div className="footer__icon-container">
          <Icon csMode="inline">
            <FontAwesomeIcon icon={faArrowsRotate} />
          </Icon>
        </div>
        <div className="footer__text-container">
          <p>[2/9] Updating package Gigamods500-1.2.4...</p>
        </div>
      </button>
      <div className="footer__actions">
        <div className="footer__action-group">
          <NewButton
            rootClasses="footer__action-btn"
            csModifiers={["only-icon", "ghost"]}
            csSize="xsmall"
            csVariant="secondary"
          >
            <Icon noWrapper csVariant="warning">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </Icon>
          </NewButton>
          <NewButton
            rootClasses="footer__action-btn"
            csModifiers={["only-icon", "ghost"]}
            csSize="xsmall"
            csVariant="secondary"
          >
            <Icon noWrapper>
              <FontAwesomeIcon icon={faBell} />
            </Icon>
          </NewButton>
        </div>
      </div>
    </div>
  );
};

export default Footer;
