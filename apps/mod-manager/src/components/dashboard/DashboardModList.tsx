import { faImage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { AutoSizer } from "react-virtualized-auto-sizer";
import * as ReactWindow from "react-window";

import { NewIcon as Icon, NewSwitch } from "@thunderstore/cyberstorm";

import ManifestV2 from "../../model/ManifestV2";
import "./DashboardModList.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const List = (ReactWindow as any).FixedSizeList;

interface RowProps {
  data: {
    mods: ManifestV2[];
    onToggle: (mod: ManifestV2, value: boolean) => void;
  };
  index: number;
  style: React.CSSProperties;
}

const ModRow: React.FC<RowProps> = ({ data, index, style }) => {
  const mod = data.mods[index];
  const isEnabled = mod.isEnabled();

  // Create a strikethrough style for disabled mods if desired, matching Figma
  const nameStyle: React.CSSProperties = isEnabled
    ? {}
    : {
        textDecoration: "line-through",
        color: "var(--color-text-disabled, #a7aed2)",
      };

  const imageStyle: React.CSSProperties = isEnabled
    ? {}
    : { opacity: 0.5, filter: "grayscale(100%)" };

  return (
    <div style={style} className="dashboard-mod-row-container">
      <div className="dashboard-mod-row">
        {/* Icon */}
        <div className="dashboard-mod-row__icon-container" style={imageStyle}>
          {mod.getIcon() ? (
            <img
              src={mod.getIcon()}
              alt={mod.getDisplayName()}
              className="dashboard-mod-row__icon"
            />
          ) : (
            <div className="dashboard-mod-row__icon-placeholder">
              <Icon csMode="inline" noWrapper>
                <FontAwesomeIcon icon={faImage} />
              </Icon>
            </div>
          )}
        </div>

        {/* Name */}
        <div
          className="dashboard-mod-row__name"
          style={nameStyle}
          title={mod.getName()}
        >
          {mod.getDisplayName()}
        </div>

        {/* Version */}
        <div className="dashboard-mod-row__version">
          {mod.getVersionNumber().toString()}
        </div>

        {/* Toggle */}
        <div className="dashboard-mod-row__toggle">
          <NewSwitch
            value={isEnabled}
            onChange={(val: boolean) => data.onToggle(mod, val)}
          />
        </div>
      </div>
    </div>
  );
};

interface DashboardModListProps {
  mods: ManifestV2[];
  onToggleMod: (mod: ManifestV2, value: boolean) => void;
}

export const DashboardModList: React.FC<DashboardModListProps> = ({
  mods,
  onToggleMod,
}) => {
  return (
    <div className="dashboard-mod-list">
      <div className="dashboard-mod-list__header">
        <div className="dashboard-mod-list__col-name">Mod</div>
        <div className="dashboard-mod-list__col-version">Version</div>
        <div className="dashboard-mod-list__col-toggle">Enabled</div>
      </div>
      <div className="dashboard-mod-list__content">
        {/* @ts-expect-error: AutoSizer type definition mismatch */}
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              className="dashboard-mod-list__scroll"
              height={height}
              width={width}
              itemCount={mods.length}
              itemSize={44} // Compact row height
              itemData={{ mods, onToggle: onToggleMod }}
            >
              {ModRow}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};
