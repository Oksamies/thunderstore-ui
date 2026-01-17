import React from "react";

import ThunderstoreMod from "../model/ThunderstoreMod";
import "./ModCard.css";

interface ModCardProps {
  mod: ThunderstoreMod;
  onDownload: (mod: ThunderstoreMod) => void;
  installedVersion?: string | null;
}

export const ModCard: React.FC<ModCardProps> = ({
  mod,
  onDownload,
  installedVersion,
}) => {
  const handleDownload = () => {
    onDownload(mod);
  };

  const isInstalled = !!installedVersion;
  const isUpdateAvailable =
    isInstalled && installedVersion !== mod.getLatestVersion();

  return (
    <div className="mod-card">
      <div className="mod-card__header">
        <div className="mod-card__info">
          <img
            src={mod.getIcon()}
            alt={mod.getName()}
            className="mod-card__icon"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/64x64?text=Icon";
            }}
          />
          <div>
            <h3 className="mod-card__title">{mod.getName()}</h3>
            <p className="mod-card__author">by {mod.getOwner()}</p>
          </div>
        </div>
        <div className="mod-card__meta">
          <span className="mod-card__version">v{mod.getLatestVersion()}</span>
          {isInstalled && (
            <span className="mod-card__installed-version">
              Installed: v{installedVersion}
            </span>
          )}
        </div>
      </div>

      <p className="mod-card__description">{mod.getDescription()}</p>

      <div className="mod-card__footer">
        <div className="mod-card__downloads">
          {mod.getDownloadCount().toLocaleString()} downloads
        </div>

        {isUpdateAvailable ? (
          <button
            onClick={handleDownload}
            className="mod-card__btn mod-card__btn--update"
          >
            Update
          </button>
        ) : isInstalled ? (
          <button disabled className="mod-card__btn mod-card__btn--installed">
            Installed
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="mod-card__btn mod-card__btn--download"
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
};
