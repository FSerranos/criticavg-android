// Tests runners/runner.js with a simulated phone: storage (CapacitorKV), notifications and the server.
// Usage: node scripts/test-runner.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const kv = new Map();
const sent = [];
let streaming = { 693134: ["Max"], 906126: [] };
const handlers = {};

const env = {
  CapacitorKV: { get: (k) => ({ value: kv.get(k) ?? null }), set: (k, v) => kv.set(k, String(v)) },
  CapacitorNotifications: { schedule: (n) => sent.push(...n) },
  fetch: async (url) => {
    const id = +new URL(url).searchParams.get("id");
    if (id === 666) throw new Error("network down");
    return { json: async () => ({ id, stream: streaming[id] || [] }) };
  },
  addEventListener: (name, fn) => { handlers[name] = fn; },
};
new Function(...Object.keys(env), fs.readFileSync("runners/runner.js", "utf8"))(...Object.values(env));

const run = (event, args = {}) => new Promise((resolve, reject) => handlers[event](resolve, reject, args));

// 1. The app hands over My list (Dune already on Max when saved; Society of the Snow nowhere yet; one film that fails)
await run("syncList", {
  api: "https://criticavg.example.workers.dev", lang: "es",
  list: [
    { id: 693134, title: "Dune: Parte dos", region: "ES", known: ["Max"] },
    { id: 906126, title: "La sociedad de la nieve", region: "ES", known: [] },
    { id: 666, title: "Sin conexión", region: "ES", known: [] },
  ],
});

// 2. Nothing new yet -> no notification
let r = await run("checkAvailability");
assert.equal(sent.length, 0, "no notification when nothing changed");

// 3. Netflix adds Society of the Snow, Dune lands on Netflix too
streaming = { 693134: ["Max", "Netflix"], 906126: ["Netflix"] };
r = await run("checkAvailability");
assert.equal(r.notified, 2);
assert.match(sent[0].title, /Ya en streaming: Dune/);
assert.equal(sent[0].body, "Disponible en Netflix.");
assert.equal(sent[1].title, "Ya en streaming: La sociedad de la nieve");

// 4. Next run: already announced -> nothing more
r = await run("checkAvailability");
assert.equal(r.notified, 0, "never announces the same platform twice");

// 5. The app syncs again with its (older) list: what the checker learnt is kept, so still no repeat
await run("syncList", { api: "https://criticavg.example.workers.dev", lang: "es", list: [{ id: 906126, title: "La sociedad de la nieve", region: "ES", known: [] }] });
r = await run("checkAvailability");
assert.equal(r.notified, 0, "a re-sync does not trigger repeats");

// 6. Empty list or no server -> resolves quietly
kv.clear();
await run("checkAvailability");

console.log("runner OK:", sent.map((n) => `${n.title} — ${n.body}`).join(" | "));
