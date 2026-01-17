import AsyncLock from "async-lock";
import { load as parseYaml, dump as stringifyYaml } from "js-yaml";
import path from "path-browserify";

import ManagerInformation from "../../_managerinf/ManagerInformation";
import ManifestV2 from "../../model/ManifestV2";
import { ImmutableProfile } from "../../model/Profile";
import FileNotFoundError from "../../model/errors/FileNotFoundError";
import FileWriteError from "../../model/errors/FileWriteError";
import R2Error from "../../model/errors/R2Error";
import YamlConvertError from "../../model/errors/Yaml/YamlConvertError";
import YamlParseError from "../../model/errors/Yaml/YamlParseError";
import FsProvider from "../../providers/FsProvider";
import LoggerProvider, { LogSeverity } from "../../providers/LoggerProvider";
import FileUtils from "../../utils/FileUtils";
import PathResolver from "../manager/PathResolver";

export default class ProfileModList {
  public static SUPPORTED_CONFIG_FILE_EXTENSIONS = [
    ".cfg",
    ".txt",
    ".json",
    ".yml",
    ".yaml",
    ".ini",
  ];
  private static lock = new AsyncLock();

  public static async requestLock(fn: () => any) {
    return this.lock.acquire("acquire", fn);
  }

  public static async getModList(
    profile: ImmutableProfile
  ): Promise<ManifestV2[] | R2Error> {
    const fs = FsProvider.instance;
    await FileUtils.ensureDirectory(profile.getProfilePath());
    if (!(await fs.exists(profile.joinToProfilePath("mods.yml")))) {
      await fs.writeFile(
        profile.joinToProfilePath("mods.yml"),
        JSON.stringify([])
      );
    }
    try {
      try {
        const fileContent = (
          await fs.readFile(profile.joinToProfilePath("mods.yml"))
        ).toString();
        const parsedYaml: any = parseYaml(fileContent) || [];
        for (let modIndex in parsedYaml) {
          const mod = new ManifestV2().fromJsObject(parsedYaml[modIndex]);
          await this.setIconPath(mod, profile);
          parsedYaml[modIndex] = mod;
        }
        return parsedYaml;
      } catch (e) {
        const err: Error = e as Error;
        LoggerProvider.instance.Log(
          LogSeverity.ERROR,
          `Failed to parse mods.yml: ${err.message}`,
          err
        );
        return new YamlParseError(
          `Failed to parse yaml file of profile: ${profile.getProfileName()}/mods.yml`,
          err.message,
          null
        );
      }
    } catch (e) {
      const err: Error = e as Error;
      return new FileNotFoundError("Unable to locate file", err.message, null);
    }
  }

  public static async saveModList(
    profile: ImmutableProfile,
    modList: ManifestV2[]
  ): Promise<R2Error | null> {
    const fs = FsProvider.instance;
    try {
      const yamlModList: string = stringifyYaml(modList);
      try {
        await fs.writeFile(profile.joinToProfilePath("mods.yml"), yamlModList);
      } catch (e) {
        const err: Error = e as Error;
        LoggerProvider.instance.Log(
          LogSeverity.ERROR,
          `Failed to write mods.yml: ${err.message}`,
          err
        );
        return new FileWriteError(
          `Failed to create mods.yml for profile: ${profile.getProfileName()}`,
          err.message,
          `Try running ${ManagerInformation.APP_NAME} as an administrator`
        );
      }
    } catch (e) {
      const err: Error = e as Error;
      LoggerProvider.instance.Log(
        LogSeverity.ERROR,
        `Failed to convert mod list to YAML: ${err.message}`,
        err
      );
      return new YamlConvertError(
        "Failed to convert modList to yaml",
        err.message,
        null
      );
    }
    return null;
  }

  public static async addMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<ManifestV2[] | R2Error> {
    return this.requestLock(async () => {
      mod.setInstalledAtTime(Number(new Date())); // Set InstalledAt to current epoch millis
      let currentModList: ManifestV2[] | R2Error =
        await this.getModList(profile);
      if (currentModList instanceof R2Error) {
        currentModList = [];
      }
      const modIndex: number = currentModList.findIndex(
        (search: ManifestV2) => search.getName() === mod.getName()
      );
      // We don't call removeMod here to avoid nested locks deadlock, manually filter
      if (modIndex >= 0) {
        currentModList = currentModList.filter(
          (m) => m.getName() !== mod.getName()
        );
      }

      // Re-fetch? No, we have the list and we are locked.
      // But we need to be careful not to persist stale data if getModList failed?
      // getModList returns [] on error/new, which is fine.

      // Reinsert
      if (modIndex >= 0) {
        currentModList.splice(modIndex, 0, mod);
      } else {
        currentModList.push(mod);
      }
      const saveError: R2Error | null = await this.saveModList(
        profile,
        currentModList
      );
      if (saveError !== null) {
        return saveError;
      }
      return currentModList;
    });
  }

  public static async removeMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<ManifestV2[] | R2Error> {
    return this.requestLock(async () => {
      const currentModList: ManifestV2[] | R2Error =
        await this.getModList(profile);
      if (currentModList instanceof R2Error) {
        return currentModList;
      }
      const newModList = currentModList.filter(
        (m: ManifestV2) => m.getName() !== mod.getName()
      );
      const saveError: R2Error | null = await this.saveModList(
        profile,
        newModList
      );
      if (saveError !== null) {
        return saveError;
      }
      return newModList;
    });
  }

  public static async updateMod(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<ManifestV2[] | R2Error> {
    return this.requestLock(async () => {
      const currentModList: ManifestV2[] | R2Error =
        await this.getModList(profile);
      if (currentModList instanceof R2Error) {
        return currentModList;
      }
      const modIndex: number = currentModList.findIndex(
        (search: ManifestV2) => search.getName() === mod.getName()
      );
      if (modIndex >= 0) {
        currentModList[modIndex] = mod;
        const saveError: R2Error | null = await this.saveModList(
          profile,
          currentModList
        );
        if (saveError !== null) {
          return saveError;
        }
      }
      return currentModList;
    });
  }

  public static async setIconPath(
    mod: ManifestV2,
    profile: ImmutableProfile
  ): Promise<void> {
    // TODO: Implement icon reading from zip/cache when we have installation logic
    // For now, fall back to "unknown" or handle it simply
    /*
        const paths = [
            path.join(profile.getProfilePath(), "BepInEx", "plugins", mod.getName(), "icon.png"),
            path.join(PathResolver.MOD_ROOT, "cache", mod.getName(), mod.getVersionNumber().toString(), "icon.png"),
        ]

        // ... (FS logic to read base64)
        */
    mod.setIcon("/unknown.png");
  }
}
