// Builds www/ (what goes inside the app) from web/ — the same app as the website.
// Usage: API_URL=https://criticavg.yourname.workers.dev node scripts/build-www.mjs
import fs from "node:fs";
import path from "node:path";

const api = (process.env.API_URL || "").trim().replace(/\/+$/, "");
if (!/^https:\/\/[^/]+$/.test(api)) {
  console.error("API_URL must be your Critic AVG address, e.g. https://criticavg.yourname.workers.dev (got: " + (api || "nothing") + ")");
  process.exit(1);
}

fs.rmSync("www", { recursive: true, force: true });
fs.mkdirSync("www/runners", { recursive: true });
for (const f of fs.readdirSync("web")) fs.copyFileSync(path.join("web", f), path.join("www", f));
fs.copyFileSync("runners/runner.js", "www/runners/runner.js");

// The app talks to your Critic AVG server, and shared links point to your website.
const html = fs.readFileSync("www/index.html", "utf8");
const inject = `<script>window.CRITICAVG_API=${JSON.stringify(api)};window.CRITICAVG_SITE=${JSON.stringify(api)};</script>\n<script>`;
if (!html.includes("<script>")) throw new Error("index.html has no <script> tag to hook into");
fs.writeFileSync("www/index.html", html.replace("<script>", inject));
console.log("www/ ready, server:", api);
