import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import external from "rollup-plugin-peer-deps-external";
import child_process from "child_process";
import os from "os";
import { promisify } from "util";

const exec = promisify(child_process.exec);

const package_json = require("./package.json");
const tsconfig = require("./tsconfig.json");

export default {
  input: "src/index.ts",
  output: [
    {
      file: tsconfig.outDir + "/" + package_json.main,
      format: "iife",
    },
  ],
  plugins: [
    external(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      sourceMap: process.env.NODE_ENV !== "production",
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
    {
      async writeBundle() {
        if (process.env.NODE_ENV === "production") {
          const compiler = os.platform() === "win32"
            ? ".\\nwjs\\win32\\nwjc.exe"
            : "./nwjs/macos/nwjc";
          await exec(
            `${compiler} ./${tsconfig.outDir}/${package_json.main} ./${tsconfig.outDir}/${package_json.main.split(".")[0]
            }.bin`,
          );
        }
        if (process.env.RUN_NWJS === "true") {
          await exec("node --loader ts-node/esm ./start.ts");
        }
      },
    },
  ],
  watch: {
    exclude: "node_modules/**",
    include: "src/**",
  },
};
