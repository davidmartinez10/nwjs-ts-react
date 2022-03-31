import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import ts from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import external from "rollup-plugin-peer-deps-external";
import styles from "rollup-plugin-styles";
import json from "@rollup/plugin-json";
import child_process from "child_process";
import fs from "fs";
import path from "path";
import typescript from "typescript";
import { promisify } from "util";

const exec = promisify(child_process.exec);

const package_json = require("./package.json");
const tsconfig = require("./tsconfig.json");

export default {
  input: "src/index.ts",
  output: [
    {
      file: path.join(tsconfig.outDir, package_json.main),
      format: "cjs",
      sourcemap: process.env.NODE_ENV === "production" ? false : "inline",
    },
  ],
  plugins: [
    styles(),
    external(),
    resolve(),
    commonjs(),
    ts({
      typescript,
      tsconfig: "./tsconfig.json",
      sourceMap: process.env.NODE_ENV === "production",
      inlineSources: true,
    }),
    json(),
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ||
        "development"),
    }),
    {
      async writeBundle() {
        if (!fs.existsSync(tsconfig.outDir)) {
          await fs.promises.mkdir(tsconfig.outDir);
        }

        const [src] = tsconfig.include;
        await fs.promises.copyFile(
          path.join(src, "manifest.json"),
          path.join(tsconfig.outDir, "package.json"),
        );

        const script = process.env.NODE_ENV === "production"
          ? `<script>nw.Window.get().evalNWBin(null, "${package_json.main.replace(".js", ".bin")}");</script>`
          : `<script src="${package_json.main}"></script>`;

        const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <title>${package_json.displayName}</title>
    </head>
    <body style="margin: 0px;">
      ${script}
    </body>
  </html>`;

        await fs.promises.writeFile(tsconfig.outDir + "/index.html", html);

        if (process.env.NODE_ENV === "production") {
          const compiler = require("nw").findpath()
            .replace("nwjs.app/Contents/MacOS/nwjs", "nwjc")
            .replace("nw.exe", "nwjc.exe")
            .replace("nw/nwjs/nw", "nw/nwjs/nwjc");

          await exec(
            `${compiler} ${path.join(tsconfig.outDir, package_json.main)} ${path.join(tsconfig.outDir, package_json.main.replace(".js", ".bin"))}`,
          );
          await fs.promises.unlink(path.join(tsconfig.outDir, package_json.main));
        }
        if (process.env.RUN_NWJS === "true") {
          exec("node --loader ts-node/esm ./start.ts");
        }
      },
    },
  ],
  watch: {
    exclude: "node_modules/**",
    include: "src/**",
  },
};
