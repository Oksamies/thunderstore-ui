import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import GameManager from "../model/GameManager";

/**
 * Manager page now acts primarily as a Route guard/wrapper for game-specific views.
 * The layout (Sidebar, Header) is handled by RootLayout.
 */
const Manager: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!GameManager.activeGame) {
      navigate("/");
    }
  }, [navigate]);

  if (!GameManager.activeGame) {
    return null;
  }

  // Just render the sub-routes (Installed, Online, etc.)
  return <Outlet />;
};

export default Manager;
