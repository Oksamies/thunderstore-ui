import React from "react";
import styles from "./CommunityCard.module.css";
import { MetaItem } from "../MetaItem/MetaItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faDownload,
  faServer,
} from "@fortawesome/free-solid-svg-icons";
import { formatInteger } from "../../utils/utils";
import { CommunityPreview } from "../../schema";

export interface GameIconProps {
  communityData: CommunityPreview;
}

/**
 * Cyberstorm CommunityCard component
 */
export const CommunityCard: React.FC<GameIconProps> = (props) => {
  const { communityData } = props;
  return (
    <div className={styles.root}>
      <img
        className={styles.image}
        alt={"Community"}
        src={communityData.imageSource}
      />
      <div className={styles.title}>{communityData.name}</div>
      <div className={styles.metaItemList}>
        <MetaItem
          label={formatInteger(communityData.packageCount)}
          icon={<FontAwesomeIcon icon={faBoxOpen} fixedWidth />}
        />
        <MetaItem
          label={formatInteger(communityData.downloadCount)}
          icon={<FontAwesomeIcon icon={faDownload} fixedWidth />}
        />
        <MetaItem
          label={formatInteger(communityData.serverCount)}
          icon={<FontAwesomeIcon icon={faServer} fixedWidth />}
        />
      </div>
    </div>
  );
};

CommunityCard.displayName = "CommunityCard";
CommunityCard.defaultProps = {};