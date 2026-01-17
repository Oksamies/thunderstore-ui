import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import { NewIcon as Icon, Image } from "@thunderstore/cyberstorm";

import Game from "../model/Game";
import "./CardCommunity.css";

// Helper to get image URL if passed image is missing or partial
const getGameImageUrl = (game: Game) => {
  if (!game.gameImage) return undefined;
  // If it's a full URL, use it
  if (game.gameImage.startsWith("http")) return game.gameImage;

  return undefined;
};

interface CardCommunityProps {
  game: Game;
  onClick: (game: Game) => void;
  isFavorite?: boolean;
  image?: string;
  onToggleFavorite?: (game: Game) => void;
  className?: string;
}

export const CardCommunity = ({
  game,
  onClick,
  isFavorite,
  image,
  onToggleFavorite,
  className = "",
}: CardCommunityProps) => {
  const imageUrl = image || getGameImageUrl(game);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(game);
    }
  };

  return (
    <div
      className={`card-community ${className}`}
      onClick={() => onClick(game)}
      title={game.displayName}
      data-testid={`game-card-${game.internalFolderName}`}
    >
      <div className="card-community__tag">
        <div
          className={`card-community__fav-btn ${isFavorite ? "is-active" : ""}`}
          onClick={handleFavoriteClick}
          role="button"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Icon csMode="inline" noWrapper>
            <FontAwesomeIcon icon={faStar} />
          </Icon>
        </div>
      </div>

      <Image
        src={imageUrl}
        cardType="community"
        rootClasses="card-community__image"
        intrinsicWidth={360}
        intrinsicHeight={480}
      />

      <div className="card-community__title">{game.displayName}</div>
    </div>
  );
};
