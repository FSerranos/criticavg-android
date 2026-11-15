// Critic AVG background checker (runs outside the app, every few hours, even when the app is closed).
// It looks at the films in "My list" and sends a notification when one arrives on a streaming
// platform (subscription or free) in the film's country.
//
// The app hands over the list with the "syncList" event; Android runs "checkAvailability" on a schedule.
// Every handler must call resolve() or reject(), or Android may stop the runner.

function readList() {
  try {
    const raw = CapacitorKV.get("list");
    return JSON.parse((raw && raw.value) || "[]");
  } catch (_) {
    return [];
  }
}

function readSetting(key, fallback) {
  try {
    const raw = CapacitorKV.get(key);
    return (raw && raw.value) || fallback;
  } catch (_) {
    return fallback;
  }
}

addEventListener("syncList", (resolve, reject, args) => {
  try {
    // Keep what this checker already knew, so a film is never announced twice.
    const before = {};
    readList().forEach((f) => { before[f.id] = f.known || []; });
    const list = (args.list || []).map((f) => ({
      id: f.id,
      title: f.title,
      region: f.region || "ES",
      known: Array.from(new Set([].concat(f.known || [], before[f.id] || []))),
    }));
    CapacitorKV.set("list", JSON.stringify(list));
    if (args.api) CapacitorKV.set("api", args.api);
    if (args.lang) CapacitorKV.set("lang", args.lang);
    resolve({ saved: list.length });
  } catch (err) {
    reject(err);
  }
});

addEventListener("checkAvailability", async (resolve, reject) => {
  try {
    const api = readSetting("api", "");
    const lang = readSetting("lang", "es");
    const list = readList();
    if (!api || !list.length) { resolve(); return; }

    const notes = [];
    for (const film of list) {
      try {
        const res = await fetch(`${api.replace(/\/$/, "")}/api/providers?id=${film.id}&region=${film.region || "ES"}`);
        const data = await res.json();
        const known = new Set(film.known || []);
        const added = (data.stream || []).filter((n) => !known.has(n));
        if (added.length) {
          notes.push({
            id: (film.id % 2000000000) + 1,
            title: lang === "es" ? `Ya en streaming: ${film.title}` : `Now streaming: ${film.title}`,
            body: lang === "es" ? `Disponible en ${added.join(", ")}.` : `Available on ${added.join(", ")}.`,
            extra: { filmId: film.id },
          });
        }
        film.known = Array.from(new Set([...known, ...(data.stream || [])]));
      } catch (_) {
        // One failed film (or no connection) never stops the others.
      }
    }

    CapacitorKV.set("list", JSON.stringify(list));
    if (notes.length) CapacitorNotifications.schedule(notes);
    resolve({ notified: notes.length });
  } catch (err) {
    reject(err);
  }
});
