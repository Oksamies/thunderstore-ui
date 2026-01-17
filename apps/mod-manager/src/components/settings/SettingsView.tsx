import React, { useEffect, useState } from "react";

import GameManager from "../../model/GameManager";
import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import ManagerSettings from "../../r2mm/manager/ManagerSettings";
import PathResolver from "../../r2mm/manager/PathResolver";
import "./SettingsView.css";

const SettingsView: React.FC = () => {
  const [steamDir, setSteamDir] = useState("");
  const [dataDir, setDataDir] = useState("");
  const [gameDir, setGameDir] = useState("");
  const [launchParams, setLaunchParams] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    LoggerProvider.instance.Log(LogSeverity.INFO, "SettingsView mounted");
    const load = async () => {
      setSteamDir(ManagerSettings.instance.steamDirectory);
      setDataDir(ManagerSettings.instance.dataDirectory || PathResolver.ROOT);
      setGameDir(
        ManagerSettings.instance.getGameDirectory(GameManager.activeGame)
      );
      setLaunchParams(
        ManagerSettings.instance.getLaunchParameters(GameManager.activeGame)
      );
      setTheme(ManagerSettings.instance.theme);
    };
    load();
  }, []);

  const save = async () => {
    try {
      LoggerProvider.instance.Log(LogSeverity.INFO, "User Saving Settings...");
      await ManagerSettings.instance.setSteamDirectory(steamDir);

      // Only update if changed, might require restart logic hint
      if (
        dataDir !==
        (ManagerSettings.instance.dataDirectory || PathResolver.ROOT)
      ) {
        if (confirm("Changing Data Directory requires a restart. Continue?")) {
          LoggerProvider.instance.Log(
            LogSeverity.WARNING,
            "User changed Data Directory"
          );
          await ManagerSettings.instance.setDataDirectory(dataDir);
        }
      }

      await ManagerSettings.instance.setGameDirectory(
        GameManager.activeGame,
        gameDir
      );
      await ManagerSettings.instance.setLaunchParameters(
        GameManager.activeGame,
        launchParams
      );
      await ManagerSettings.instance.setTheme(theme);

      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        "Settings saved successfully"
      );
      setMsg("Settings saved! (Restart may be required for some changes)");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to save settings: ${e.message}`
      );
      setMsg(`Error saving settings: ${e.message}`);
    }
  };

  const handleBrowseDataDir = async () => {
    const result = await window.electronAPI.openDialog({
      properties: ["openDirectory"],
    });
    if (result && result.length > 0) {
      setDataDir(result[0]);
    }
  };

  return (
    <div className="settings-view custom-scrollbar">
      <h2 className="settings-view__title">Settings</h2>

      <div className="settings-view__container">
        <div className="settings-view__card">
          <h3 className="settings-view__card-title settings-view__card-title--appearance">
            Appearance
          </h3>
          <div className="settings-view__field">
            <label className="settings-view__label">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "dark" | "light")}
              className="settings-view__select"
            >
              <option value="dark">Dark (Cyberstorm)</option>
              <option value="light">Light (Experimental)</option>
            </select>
            <p className="settings-view__hint">Select application theme.</p>
          </div>
        </div>

        <div className="settings-view__card">
          <h3 className="settings-view__card-title settings-view__card-title--locations">
            Locations
          </h3>

          <div className="settings-view__field">
            <label className="settings-view__label">
              Data Directory (Mods & Profiles)
            </label>
            <div className="settings-view__input-group">
              <input
                className="settings-view__input settings-view__input--green"
                value={dataDir}
                onChange={(e) => setDataDir(e.target.value)}
                placeholder="C:\Users\...\AppData\Roaming\ThunderstoreModManager"
              />
              <button
                onClick={handleBrowseDataDir}
                className="settings-view__btn-browse"
              >
                Browse
              </button>
            </div>
            <p className="settings-view__hint settings-view__hint-warning">
              ⚠ Changing this requires an application restart.
            </p>
          </div>

          <div className="settings-view__field">
            <label className="settings-view__label">
              Steam Executable (Global)
            </label>
            <input
              className="settings-view__input settings-view__input--green"
              value={steamDir}
              onChange={(e) => setSteamDir(e.target.value)}
              placeholder="C:\Program Files (x86)\Steam\Steam.exe"
            />
            <p className="settings-view__hint">Path to Steam.exe</p>
          </div>

          <div className="settings-view__field">
            <label className="settings-view__label">
              Game Directory ({GameManager.activeGame.displayName})
            </label>
            <input
              className="settings-view__input settings-view__input--green"
              value={gameDir}
              onChange={(e) => setGameDir(e.target.value)}
              placeholder="Path to game executable directory"
            />
            <p className="settings-view__hint">
              Directory containing the game executable
            </p>
          </div>
        </div>

        <div className="settings-view__card">
          <h3 className="settings-view__card-title settings-view__card-title--config">
            Launch Configuration
          </h3>
          <div className="settings-view__field">
            <label className="settings-view__label">Launch Parameters</label>
            <input
              className="settings-view__input settings-view__input--orange"
              value={launchParams}
              onChange={(e) => setLaunchParams(e.target.value)}
              placeholder="--doorstop-enable true ..."
            />
            <p className="settings-view__hint">
              Additional launch arguments passed to the game.
            </p>
          </div>
        </div>

        <div className="settings-view__actions">
          <button onClick={save} className="settings-view__btn-save">
            Save Settings
          </button>
          {msg && (
            <span
              className={`settings-view__msg ${
                msg.startsWith("Error")
                  ? "settings-view__msg--error"
                  : "settings-view__msg--success"
              }`}
            >
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
