import {
  faBolt,
  faBox,
  faDownload,
  faFire,
  faHandSparkles,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import { NewIcon as Icon, Image } from "@thunderstore/cyberstorm";
import { formatInteger, numberWithSpaces } from "@thunderstore/cyberstorm";
import { Community } from "@thunderstore/dapper/types";

import Game from "../model/Game";
import "./GameListRow.css";

// Helper to get image URL
const getGameImageUrl = (game: Game, community?: Community) => {
  if ((community as any)?.community_icon_url)
    return (community as any).community_icon_url;
  if (community?.cover_image_url) return community.cover_image_url;
  if (!game.gameImage) return undefined;
  if (game.gameImage.startsWith("http")) return game.gameImage;
  return undefined;
};

interface GameListRowProps {
  game: Game;
  community?: Community;
  onClick: (game: Game) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (game: Game) => void;
  className?: string;
}

export const GameListRow = ({
  game,
  community,
  onClick,
  isFavorite,
  onToggleFavorite,
  className = "",
}: GameListRowProps) => {
  // Heuristics for tags - could be improved with real "is_new" flags if available
  const isNew = community
    ? (new Date().getTime() - new Date(community.datetime_created).getTime()) /
        (1000 * 3600 * 24) <
      90
    : false;
  const isPopular = community
    ? community.total_download_count > 1000000
    : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(game);
    }
  };

  const imageUrl = getGameImageUrl(game, community);

  return (
    <div
      className={`game-list-row ${className}`}
      onClick={() => onClick(game)}
      title={game.displayName}
    >
      {/* Icon Area */}
      <div className="game-list-row__image-container">
        <Image
          src={imageUrl}
          cardType="communityIcon"
          square={true}
          rootClasses="game-list-row__image"
          intrinsicWidth={48} // Matches Figma 48px
          intrinsicHeight={48}
        />
      </div>

      {/* Name */}
      <div className="game-list-row__name">{game.displayName}</div>

      {/* Tags */}
      <div className="game-list-row__tags">
        {isPopular && (
          <div className="game-tag game-tag--popular">
            <Icon csMode="inline" noWrapper>
              <FontAwesomeIcon icon={faFire} />
            </Icon>
            <span>Popular</span>
          </div>
        )}
        {isNew && (
          <div className="game-tag game-tag--new">
            <Icon csMode="inline" noWrapper>
              <FontAwesomeIcon icon={faHandSparkles} />
            </Icon>
            <span>New</span>
          </div>
        )}
      </div>

      {/* Meta Stats */}
      {community && (
        <div className="game-list-row__meta">
          <div className="game-meta-item" title="Total Packages">
            <div className="game-meta-icon">
              <FontAwesomeIcon icon={faBox} />
            </div>
            <span>{formatInteger(community.total_package_count)}</span>
          </div>
          <div className="game-meta-item" title="Total Downloads">
            <div className="game-meta-icon">
              <FontAwesomeIcon icon={faDownload} />
            </div>
            <span>{numberWithSpaces(community.total_download_count)}</span>
          </div>
        </div>
      )}

      {/* Favorite Button (Right aligned) */}
      <div
        className={`game-list-row__fav-btn ${isFavorite ? "is-active" : ""}`}
        onClick={handleFavoriteClick}
        role="button"
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Icon csMode="inline" noWrapper>
          <FontAwesomeIcon icon={faStar} />
        </Icon>
      </div>
    </div>
  );
};
