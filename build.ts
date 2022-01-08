import fs from "fs";
import path from "path";
import { promisify } from "util";

const package_json = JSON.parse(String(fs.readFileSync("package.json")));
const tsconfig = JSON.parse(String(fs.readFileSync("tsconfig.json")));

async function main() {
  try {
    if (!fs.existsSync(tsconfig.outDir)) {
      fs.mkdirSync(tsconfig.outDir);
    }

    const files = await promisify(fs.readdir)(tsconfig.outDir);

    for (const file of files) {
      await promisify(fs.unlink)(path.join(tsconfig.outDir, file));
    }

    const [src] = tsconfig.include;
    const manifest = await promisify(fs.readFile)(
      path.join(src, "manifest.json"),
    );

    await promisify(fs.writeFile)(
      path.join(tsconfig.outDir, "package.json"),
      manifest,
    );

    const script = process.env.NODE_ENV === "production"
      ? `<script>nw.Window.get().evalNWBin(null, "${package_json.main.split(".")[0]
      }.bin");</script>`
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

    await promisify(fs.writeFile)(tsconfig.outDir + "/index.html", html);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
