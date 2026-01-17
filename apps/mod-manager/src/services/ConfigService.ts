import ConfigFile from "../model/ConfigFile";
import ConfigLine from "../model/ConfigLine";
import { ProfileCompatible } from "../model/Profile";

export default class ConfigService {
  public static async getConfigFiles(
    profile: ProfileCompatible
  ): Promise<ConfigFile[]> {
    const profilePath = profile.getProfilePath();
    // BepInEx/config
    const configPath = await window.electronAPI.pathJoin(
      profilePath,
      "BepInEx",
      "config"
    );

    if (!(await window.electronAPI.fs.exists(configPath))) {
      return [];
    }

    const files = await window.electronAPI.fs.readdir(configPath);
    const configFiles: ConfigFile[] = [];

    for (const file of files) {
      if (file.toLowerCase().endsWith(".cfg")) {
        const fullPath = await window.electronAPI.pathJoin(configPath, file);
        const stat = await window.electronAPI.fs.lstat(fullPath);
        if (stat) {
          // Name is filename without .cfg
          const name = file.substring(0, file.length - 4);
          configFiles.push(new ConfigFile(name, fullPath, stat.mtime));
        }
      }
    }

    // Sort by name
    configFiles.sort((a, b) => a.getName().localeCompare(b.getName()));

    return configFiles;
  }

  public static async readConfigFile(configFile: ConfigFile): Promise<string> {
    return await window.electronAPI.fs.readFile(configFile.getPath());
  }

  public static async parseConfig(
    fileText: string
  ): Promise<{ [section: string]: { [variable: string]: ConfigLine } }> {
    const dumpedConfigVariables: {
      [section: string]: { [variable: string]: ConfigLine };
    } = {};
    let section = "root";
    let comments: string[] = [];
    const allowedValues: Set<String> = new Set();

    const lines = fileText.split(/\r?\n/);

    lines.forEach((line: string) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
        section = trimmedLine.substring(1, trimmedLine.length - 1);
        dumpedConfigVariables[section] = {};
        comments = [];
      } else if (
        !(trimmedLine.startsWith("#") || trimmedLine.startsWith(";")) &&
        line.indexOf("=") > 0
      ) {
        const sides = line.split("=");
        const rightSide = sides.splice(1).join("=");
        if (
          comments.find((value) =>
            value.trim().startsWith("# Setting type: Boolean")
          )
        ) {
          if (allowedValues.size === 0) {
            allowedValues.add("true");
            allowedValues.add("false");
          }
        }
        const finalAcceptableValues: string[] = [];
        allowedValues.forEach((value) => {
          finalAcceptableValues.push(value.toString());
        });

        // Initialize section if it doesn't exist (handle root vars or malformed files)
        if (!dumpedConfigVariables[section]) {
          dumpedConfigVariables[section] = {};
        }

        dumpedConfigVariables[section][sides[0].trim()] = new ConfigLine(
          rightSide.trim(),
          comments,
          finalAcceptableValues
        );
        comments = [];
        allowedValues.clear();
      } else if (trimmedLine.startsWith("#") || trimmedLine.startsWith(";")) {
        comments.push(trimmedLine);

        // Check for Acceptable value range or Acceptable values in comments
        // Legacy code didn't seem to explicitly parse "Acceptable values" list from comments in the main loop,
        // but ConfigLine parses range.
        // However, BepInEx often writes "# Acceptable values: True, False" etc.
      }
    });
    return dumpedConfigVariables;
  }

  public static async updateConfig(
    configFile: ConfigFile,
    originalText: string,
    data: { [section: string]: { [variable: string]: ConfigLine } }
  ): Promise<void> {
    let builtString = "";
    let section = "root";

    const lines = originalText.split(/\r?\n/);

    lines.forEach((line: string) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
        section = trimmedLine.substring(1, trimmedLine.length - 1);
        builtString += line + "\n";
      } else if (
        !(trimmedLine.startsWith("#") || trimmedLine.startsWith(";")) &&
        line.indexOf("=") > 0
      ) {
        const sides = line.split("=");
        const key = sides[0].trim();

        if (data[section] && data[section][key]) {
          builtString += `${sides[0]} = ${data[section][key].value}\n`;
        } else {
          builtString += line + "\n";
        }
      } else {
        builtString += line + "\n";
      }
    });

    await window.electronAPI.fs.writeFile(
      configFile.getPath(),
      builtString.trim()
    );
  }
}
