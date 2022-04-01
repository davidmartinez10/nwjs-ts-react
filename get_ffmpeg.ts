import fs from "fs";
import got from "got";
import { promisify } from "util";
import stream from "stream";
import yauzl from "yauzl";
import path from "path";
import child_process from "child_process";
import os from "os";
import { findpath } from "nw";

// Remove this function if you are going to use this application for commercial purposes.
// For more information, take a look at https://www.ffmpeg.org/legal.html.

export async function get_ffmpeg(nw_path?: string) {
  return new Promise(function promise(resolve) {
    async function enable_await() {
      const package_json = JSON.parse(
        String(await fs.promises.readFile("package.json"))
      );
      const version = package_json.devDependencies.nw.replace("-sdk", "");
      const { stdout: url } = await promisify(child_process.exec)(
        `npx nwjs-ffmpeg-prebuilt -v ${version} --get-download-url`
      );
      const temp_folder = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), "ffmpeg-")
      );
      const temp_path = path.join(temp_folder, "ffmpeg.zip");
      const temp = fs.createWriteStream(temp_path);
      await promisify(stream.pipeline)(got.stream(url), temp);

      let destination_path = nw_path || findpath();

      if (os.platform() === "win32")
        destination_path = destination_path.replace("nw.exe", "");
      if (os.platform() === "darwin")
        destination_path = destination_path.replace(
          "MacOS/nwjs",
          "Frameworks/nwjs Framework.framework/Versions/Current"
        );
      if (os.platform() === "linux")
        destination_path = destination_path.replace("nw/nwjs/nw", "nw/nwjs/lib");

      yauzl.open(temp_path, { lazyEntries: true }, function (err, zip) {
        if (err || !zip) throw err;
        zip.readEntry();
        zip.on("entry", function (entry) {
          if (/\/$/.test(entry.fileName)) {
            zip.readEntry();
          } else {
            // file entry
            zip.openReadStream(entry, function (err, read_stream) {
              if (err || !read_stream) throw err;
              read_stream.on("end", async function () {
                await fs.promises.unlink(temp_path);
                zip.readEntry();
              });
              read_stream.pipe(
                fs
                  .createWriteStream(path.join(destination_path, entry.fileName))
                  .on("close", resolve)
              );
            });
          }
        });
      });
    }
    enable_await();
  });
}
