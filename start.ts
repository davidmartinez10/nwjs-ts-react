import fs from "fs/promises";
import child_process from "child_process";
import { existsSync } from "fs";
// @ts-ignore
import nw from "nw";
import { promisify } from "util";
import wait from "wait-on";

async function start() {
  const package_json = JSON.parse(String(await fs.readFile("package.json")));
  const tsconfig = JSON.parse(String(await fs.readFile("tsconfig.json")));

  const debugging_port = 9222;

  let entry_point = `${tsconfig.outDir}/${package_json.main}`;

  if (process.env.NODE_ENV === "production") {
    entry_point = entry_point.replace(".js", ".bin");
  }

  if (existsSync(entry_point)) {
    if (process.env.DEBUG === "true") {
      child_process.spawn(nw.findpath(), [
        tsconfig.outDir,
        `--remote-debugging-port=${debugging_port}`,
      ], {
        detached: true,
      }).unref();

      await wait({
        resources: [
          `http://127.0.0.1:${debugging_port}/`,
        ],
      });
    } else {
      promisify(child_process.exec)(
        `${nw.findpath()} ${tsconfig.outDir}`,
      );
    }
    process.exit(0);
  } else {
    setTimeout(start, 200);
  }
}

start();
