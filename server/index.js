import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "data.json");
const PORT = 3001;

// ── Persistence ───────────────────────────────────────────────────────────────
function loadData() {
  if (!existsSync(DATA_FILE)) return { events: {} };
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { events: {} };
  }
}

function saveData(data) {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Failed to save data:", err.message);
  }
}

let db = loadData();
let saveTimer = null;

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveData(db), 500);
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// REST API — full state
app.get("/api/state", (_req, res) => {
  res.json(db);
});

app.post("/api/state", (req, res) => {
  const { events } = req.body;
  if (!events || typeof events !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  db = { ...db, events };
  scheduleSave();
  res.json({ ok: true });
});

// REST — single event CRUD
app.put("/api/events/:id", (req, res) => {
  const { id } = req.params;
  db.events[id] = req.body;
  scheduleSave();
  res.json({ ok: true });
});

app.delete("/api/events/:id", (req, res) => {
  delete db.events[req.params.id];
  scheduleSave();
  res.json({ ok: true });
});

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Send full state on connect
  socket.emit("state:init", db);

  // Client pushes full events object → broadcast to others
  socket.on("state:push", (events) => {
    if (!events || typeof events !== "object") return;
    db = { ...db, events };
    scheduleSave();
    socket.broadcast.emit("state:update", events);
  });

  // Client pushes single event update
  socket.on("event:update", ({ id, data }) => {
    if (!id || !data) return;
    db.events[id] = data;
    scheduleSave();
    socket.broadcast.emit("event:updated", { id, data });
  });

  // Client deletes event
  socket.on("event:delete", (id) => {
    if (!id) return;
    delete db.events[id];
    scheduleSave();
    socket.broadcast.emit("event:deleted", id);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`CampMaster 3000 backend running on http://localhost:${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
