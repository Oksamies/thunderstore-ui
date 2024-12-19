import { config } from "./webpack.base.config.mjs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = dirname(__filename); // get the name of the directory

export const rendererConfig = {
  ...config,
  target: "electron-renderer",
  entry: {
    renderer: "./src/renderer/index.ts",
    preload: "./src/preload/preload.ts",
    // exclusive: "./src/renderer/exclusive.ts",
  },
};

rendererConfig.plugins.push(
  new HtmlWebpackPlugin({
    template: "./src/renderer/index.html",
    filename: join(__dirname, "./dist/renderer/index.html"),
    chunks: ["renderer"],
    inject: false,
    publicPath: "/tsmm/",
  })
);

// rendererConfig.plugins.push(
//   new HtmlWebpackPlugin({
//     template: "./src/renderer/osr.html",
//     filename: path.join(__dirname, "./dist/renderer/osr.html"),
//     inject: false,
//   })
// );

// rendererConfig.plugins.push(
//   new HtmlWebpackPlugin({
//     template: "./src/renderer/exclusive.html",
//     filename: path.join(__dirname, "./dist/exclusive/exclusive.html"),
//     chunks: ["exclusive"],
//     inject: false,
//   })
// );

export default rendererConfig;
