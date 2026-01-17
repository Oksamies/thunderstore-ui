import React from "react";

import GameHeader from "./GameHeader";
import "./OnlineModView.css";
import PackageSearch from "./PackageSearch/PackageSearch";

const OnlineModView: React.FC = () => {
  return (
    <div
      className="cyberstorm-container--y cyberstorm-container--full island"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      <GameHeader />
      <PackageSearch />
    </div>
  );
};

export default OnlineModView;
