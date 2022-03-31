import child_process from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { get_ffmpeg } from "./get_ffmpeg.js";

async function pack() {
  const temp_folder = await fs.mkdtemp(path.join(os.tmpdir(), "build-"));
  const package_json = JSON.parse(String(await fs.readFile("package.json")));
  const tsconfig = JSON.parse(String(await fs.readFile("tsconfig.json")));
  await fs.writeFile(`${temp_folder}/package.json`, JSON.stringify({}));
  const version = package_json.devDependencies.nw.replace("-sdk", "");

  await promisify(child_process.exec)(`cd ${temp_folder} && npm install nw@${version}`);

  // @ts-ignore
  const { findpath } = await import(path.join(temp_folder, "node_modules/nw/index.js"));
  await get_ffmpeg(findpath());

  const commands = [
    `mkdir dist`,
    `cp -R "${temp_folder}/node_modules/nw/nwjs/nwjs.app" "./dist/${package_json.displayName}.app"`,
    `cp -R "./${tsconfig.outDir}" "./dist/${package_json.displayName}.app/Contents/Resources/app.nw"`,
  ];

  child_process.exec(commands.join(" && "));
}

pack();
