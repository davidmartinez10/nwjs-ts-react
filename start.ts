import fs from "fs/promises";
import child_process from "child_process";
import { existsSync } from "fs";
import { findpath } from "nw";
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
      child_process
        .spawn(
          findpath(),
          [tsconfig.outDir, `--remote-debugging-port=${debugging_port}`],
          {
            detached: true,
            shell: true,
          }
        )
        .unref();

      await wait({
        resources: [`http://127.0.0.1:${debugging_port}/`],
      });
    } else {
      child_process
        .spawn(findpath(), [tsconfig.outDir], { shell: true })
        .stdout.pipe(process.stdout);
    }
    process.exit(0);
  } else {
    setTimeout(start, 200);
  }
}

start();
