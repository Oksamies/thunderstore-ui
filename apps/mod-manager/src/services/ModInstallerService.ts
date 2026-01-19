import axios from "axios";

import ManifestV2 from "../model/ManifestV2";
import { ImmutableProfile } from "../model/Profile";
import ThunderstoreCombo from "../model/ThunderstoreCombo";
import ThunderstoreVersion from "../model/ThunderstoreVersion";
import VersionNumber from "../model/VersionNumber";
import R2Error from "../model/errors/R2Error";
import LoggerProvider, { LogSeverity } from "../providers/LoggerProvider";
import ProfileModList from "../r2mm/mods/ProfileModList";

export default class ModInstallerService {
  static async install(
    mod: ThunderstoreCombo,
    profile: ImmutableProfile,
    progressCallback?: (status: string) => void
  ): Promise<R2Error | void> {
    const api = window.electronAPI;
    const version = mod.getVersion();
    // Ensure we send the full identifier (Namespace-Name-Version) to TCLI
    const fullName = `${mod.getMod().getOwner()}-${mod
      .getMod()
      .getName()}-${version.getVersionNumber().toString()}`;

    try {
      LoggerProvider.instance.Log(
        LogSeverity.INFO,
        `Installing ${fullName} via TCLI...`
      );
      progressCallback?.(`Installing ${fullName}...`);

      if (api && api.tcli) {
        // TCLI Integration
        await api.tcli.addPackages([fullName]);

        // Sync with ProfileModList (mods.yml)
        // Fetch all installed packages from TCLI to ensure dependencies are also registered
        const installed = await api.tcli.installedPackages();

        LoggerProvider.instance.Log(
          LogSeverity.INFO,
          `TCLI installed ${installed.length} packages. Syncing UI...`
        );

        for (const pkg of installed) {
          // pkg is PackageMetadata from TCLI
          // { name, description, version_number, dependencies, website_url, reference, icon }

          const manifest = new ManifestV2();
          const versionString = pkg.version_number;
          const reference = pkg.reference; // e.g. "Namespace-Name-Version"

          // Reconstruct Namespace-Name from Reference and Version
          // Reference ends with `-${versionString}`
          const idWithoutVersion = reference.substring(
            0,
            reference.lastIndexOf(`-${versionString}`)
          );
          // idWithoutVersion should be "Namespace-Name"

          manifest.setName(idWithoutVersion);
          manifest.setVersionNumber(new VersionNumber(versionString));
          manifest.setDisplayName(pkg.name);
          manifest.setDescription(pkg.description || "");
          manifest.setWebsiteUrl(pkg.website_url || "");

          // Icon is a local path. Prepend file:// protocol if not present
          // Or we can rely on what TCLI returns. It's likely an absolute path.
          // For now, let's try to set it directly.
          // Note: Image component might need it to be a valid URL.
          // But ProfileModList.setIconPath sets it to /unknown.png usually.
          // Let's use the local path if available.
          if (pkg.icon) {
            manifest.setIcon(pkg.icon); // We might need to handle this in UI to allow local paths
          }

          await ProfileModList.addMod(manifest, profile);
        }
      } else {
        throw new Error("TCLI not available");
      }

      progressCallback?.(`Successfully installed ${fullName}`);
    } catch (e: any) {
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Install failed: ${e.message}`
      );
      return new R2Error("Install failed", e.message);
    }
  }

  static async installLocalMod(
    filePath: string,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    // TCLI doesn't fully support local zip install in this manner yet (add_packages takes refs).
    // Keeping legacy logic or TODO?
    // User asked strictly for "Install" button behavior which is online.
    // Leaving this as is or failing gracefully.
    return new R2Error(
      "Not implemented",
      "Local install not yet ported to TCLI"
    );
  }

  static async uninstall(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const api = window.electronAPI;
    const fullName = `${mod.getName()}-${mod.getVersionNumber().toString()}`;

    try {
      if (api && api.tcli) {
        await api.tcli.removePackages([fullName]);
        const removeResult = await ProfileModList.removeMod(mod, profile);
        if (removeResult instanceof R2Error) return removeResult;
      }
    } catch (e: any) {
      return new R2Error("Uninstall failed", e.message);
    }
  }

  static async disable(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const api = window.electronAPI;
    const fullName = `${mod.getName()}-${mod.getVersionNumber().toString()}`;

    try {
      if (api && api.tcli) {
        // Use TCLI to remove the package (uninstall from game)
        // But we keep it in the UI list via ProfileModList updates below
        await api.tcli.removePackages([fullName]);
      } else {
        // Fallback or Legacy (if TCLI not present)
        const { default: ElectronProfileInstallerProvider } = await import(
          "../providers/impl/ElectronProfileInstallerProvider"
        );
        const provider = new ElectronProfileInstallerProvider();
        const result = await provider.disableMod(mod, profile);
        if (result instanceof R2Error) return result;
      }

      mod.disable();
      const updateResult = await ProfileModList.updateMod(mod, profile);
      if (updateResult instanceof R2Error) return updateResult;
    } catch (e: any) {
      return new R2Error("Disable failed", e.message);
    }
  }

  static async enable(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<R2Error | void> {
    const api = window.electronAPI;
    const fullName = `${mod.getName()}-${mod.getVersionNumber().toString()}`;

    try {
      if (api && api.tcli) {
        // Use TCLI to add the package back (re-install to game)
        await api.tcli.addPackages([fullName]);
      } else {
        const { default: ElectronProfileInstallerProvider } = await import(
          "../providers/impl/ElectronProfileInstallerProvider"
        );
        const provider = new ElectronProfileInstallerProvider();

        const result = await provider.enableMod(mod, profile);
        if (result instanceof R2Error) return result;
      }

      mod.enable();
      const updateResult = await ProfileModList.updateMod(mod, profile);
      if (updateResult instanceof R2Error) return updateResult;
    } catch (e: any) {
      return new R2Error("Enable failed", e.message);
    }
  }
}
