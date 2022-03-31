import React from "react";
import react_dom from "react-dom/client";
import app from "./app";

const root = document.createElement("div");
document.body.appendChild(root);
react_dom.createRoot(root).render(React.createElement(app));

// Hot reload
const package_json = require("../package.json");

let entry_point = require("path").join(process.cwd(), package_json.main);
if (process.env.NODE_ENV === "production") entry_point = entry_point.replace(".js", ".bin");

require("fs").watch(entry_point, function () {
  if (location) location.reload();
});
