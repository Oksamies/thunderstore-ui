import { faGamepad, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

import { NewIcon as Icon } from "@thunderstore/cyberstorm";

import Game from "../../model/Game";

// CSS is now imported in parent or globally, or we can keep this import if it only contains what we need.
// But we moved styles to GameSelection.css mostly.
// However, GameCard might be used elsewhere? Unlikely given the context.
// Let's assume styles are available via GameSelection.css or I should update GameCard.css?
// The user asked to implement "page structures and styles".
// Since I put the styles in GameSelection.css (mimicking r2modmanPlus's GameSelectionScreen styles),
// I should probably rely on valid CSS being present.
// But GameCard.css might conflict. I should probably clear GameCard.css or ignore it.
// Let's comment out the import for now or assume I'm replacing it.
// import "./GameCard.css";

// Helper to get image URL
const getGameImageUrl = (game: Game) => {
  if (!game.gameImage) return undefined;
  return game.gameImage.startsWith("http")
    ? game.gameImage
    : `https://thunderstore.io/img/${game.gameImage}`;
};

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
  isFavorite?: boolean;
  gameImage?: string;
  onToggleFavorite?: (game: Game) => void;
}

const GameCard = ({
  game,
  onClick,
  isFavorite,
  gameImage,
  onToggleFavorite,
}: GameCardProps) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = gameImage || getGameImageUrl(game);

  return (
    <div className="game-card" onClick={() => onClick(game)}>
      <div className="game-card-image">
        {imageUrl && !imageError ? (
          <img
            alt={game.displayName}
            src={imageUrl}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              color: "#555",
              fontSize: "3rem",
            }}
          >
            <Icon csMode="inline">
              <FontAwesomeIcon icon={faGamepad} />
            </Icon>
          </div>
        )}

        {/* Favorite Star */}
        <div
          className="game-card-fav"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(game);
          }}
        >
          <Icon csMode="inline" className={isFavorite ? "text-warning" : ""}>
            <FontAwesomeIcon icon={faStar} />
          </Icon>
        </div>
      </div>
      <div className="game-card-title">{game.displayName}</div>
    </div>
  );
};

export default GameCard;
