import fs, { existsSync } from "fs";
import { promisify } from "util";
import child_process from "child_process";
import os from "os";
import wait from "wait-on";

const package_json = JSON.parse(String(fs.readFileSync("package.json")));
const tsconfig = JSON.parse(String(fs.readFileSync("tsconfig.json")));

const nwjs = os.platform() === "win32"
  ? ".\\nwjs\\win\\nw.exe"
  : "./nwjs/macos/nwjs.app/Contents/MacOS/nwjs";
const debug = process.env.NODE_ENV === "production"
  ? ""
  : `--remote-debugging-port=${process.env.PORT || 9222}`;

async function start() {
  if (
    existsSync(`${tsconfig.outDir}/${package_json.main}`)
    || existsSync(`${tsconfig.outDir}/${package_json.main.split(".")[0]}.bin`)
  ) {
    if (debug) {
      child_process.spawn(nwjs, [tsconfig.outDir, debug], { "detached": true }).unref();
      await wait({
        "resources": [
          `http://127.0.0.1:${process.env.PORT || 9222}/`
        ],
      });
    } else {
      await promisify(child_process.exec)(`${nwjs} ${tsconfig.outDir} ${debug}`);
    }
    process.exit(0);
  } else {
    setTimeout(start, 200);
  }
}

start();
