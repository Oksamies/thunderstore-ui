import { join, dirname } from "path";
import { config } from "./webpack.base.config.mjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = dirname(__filename); // get the name of the directory

export const mainConfig = {
  ...config,
  target: "electron-main",
  entry: {
    index: "./src/browser/index.ts",
  },
  output: {
    path: join(__dirname, "./dist/browser"),
    filename: "[name].js",
    chunkFormat: "module",
  },
  experiments: {
    outputModule: true,
  },
};

export default mainConfig;
