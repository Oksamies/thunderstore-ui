import axios from "axios";
import React, { useEffect } from "react";

import GameManager from "../model/GameManager";
import Profile from "../model/Profile";
import ThunderstoreCombo from "../model/ThunderstoreCombo";
import ThunderstoreMod from "../model/ThunderstoreMod";
import ThunderstoreVersion from "../model/ThunderstoreVersion";
import VersionNumber from "../model/VersionNumber";
import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ModInstallerService from "../services/ModInstallerService";

const UrlHandler: React.FC = () => {
  useEffect(() => {
    const cleanup = window.electronAPI.onOpenUrl((url) => {
      LoggerProvider.instance.Log(LogSeverity.INFO, `Received URL: ${url}`);
      handleUrl(url);
    });
    return cleanup;
  }, []);

  const handleUrl = async (url: string) => {
    // Format: thunderstore://package/install/namespace/name/version/
    const regex =
      /thunderstore:\/\/package\/install\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?/;
    const match = url.match(regex);

    if (match) {
      const [, namespace, name, version] = match;
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Request to install: ${namespace}-${name} v${version}`
      );

      const activeGame = GameManager.activeGame;
      const activeProfile = Profile.getActiveAsImmutableProfile();

      if (!activeGame || !activeProfile) {
        alert(
          `Received request to install ${name} v${version}\n\nPlease select a Game and Profile first.`
        );
        return;
      }

      if (
        confirm(
          `Install ${namespace}-${name} v${version} to profile '${activeProfile.getProfileName()}'?`
        )
      ) {
        try {
          // Fetch package data to get dependencies
          const packageIndex = activeGame.thunderstoreUrl;
          const baseUrl = packageIndex.endsWith("/")
            ? packageIndex
            : packageIndex + "/";
          const apiUrl = `${baseUrl}${namespace}/${name}/`;

          LoggerProvider.instance.Log(
            LogSeverity.INFO,
            `Fetching package info from: ${apiUrl}`
          );
          const response = await axios.get(apiUrl);
          const modData = response.data;
          const versionData = modData.versions.find(
            (v: any) => v.version_number === version
          );

          if (!versionData) {
            throw new Error(
              `Version ${version} not found for ${namespace}-${name}`
            );
          }

          const tsMod = new ThunderstoreMod();
          tsMod.setName(name);
          tsMod.setOwner(namespace);

          const tsVer = new ThunderstoreVersion();
          tsVer.make(versionData);

          const combo = new ThunderstoreCombo();
          combo.setMod(tsMod);
          combo.setVersion(tsVer);

          await ModInstallerService.install(combo, activeProfile, (status) => {
            LoggerProvider.instance.Log(
              LogSeverity.INFO,
              `Install Status: ${status}`
            );
          });

          alert("Installation Complete!");
          window.location.reload();
        } catch (e: any) {
          LoggerProvider.instance.Log(
            LogSeverity.ERROR,
            `Installation Failed: ${e.message}`,
            e
          );
          alert(`Installation Failed: ${e.message}`);
        }
      }
    }
  };

  return null;
};

export default UrlHandler;
