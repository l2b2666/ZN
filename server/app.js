import express from "express";
import multer from "multer";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  db,
  dataDir,
  services,
  extras,
  hashPassword,
  verifyPassword,
  publicUser,
  createDemo,
  getOrders,
} from "./db.js";

export const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    new URL(req.headers.origin).host !== req.headers.host
  )
    return res.status(403).json({ error: "Niedozwolone źródło żądania." });
  const token = req.headers.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("zn_session="))
    ?.slice(11);
  if (token)
    req.user = db
      .prepare(
        "SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>?",
      )
      .get(token, Date.now());
  next();
});
function session(req, res, user) {
  const token = randomBytes(32).toString("hex");
  const old = req.headers.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("zn_session="))
    ?.slice(11);
  if (old) db.prepare("DELETE FROM sessions WHERE token=?").run(old);
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
    token,
    user.id,
    Date.now() + 30 * 86400000,
  );
  res.setHeader(
    "Set-Cookie",
    `zn_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${req.secure || process.env.COOKIE_SECURE === "1" ? "; Secure" : ""}`,
  );
}
function required(req, res, next) {
  if (!req.user)
    return res.status(401).json({ error: "Zaloguj się, aby kontynuować." });
  next();
}
function staff(req, res, next) {
  if (req.user?.role !== "admin")
    return res
      .status(403)
      .json({ error: "Brak uprawnień do obsługi zamówień." });
  next();
}
function valid(schema, body) {
  return schema.parse(body);
}
const text = z.string().trim().min(2).max(180);
const graveSchema = z.object({
  name: text,
  cemetery: text,
  city: text,
  sector: z.string().trim().max(100).default(""),
  location: z.string().trim().max(180).default(""),
  notes: z.string().trim().max(1000).default(""),
});
const limiter = new Map();
function authLimit(req, res, next) {
  const key = req.ip,
    now = Date.now();
  let a = limiter.get(key);
  if (!a || a.until < now) {
    a = { count: 0, until: now + 15 * 60000 };
    limiter.set(key, a);
  }
  if (limiter.size > 10000)
    for (const [k, v] of limiter) if (v.until < now) limiter.delete(k);
  if (++a.count > 30)
    return res
      .status(429)
      .json({ error: "Zbyt wiele prób. Spróbuj ponownie za 15 minut." });
  next();
}
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/bootstrap", (req, res) => {
  let user = req.user;
  if (!user && process.env.DEMO_MODE === "0")
    return res.json({
      user: null,
      services,
      extras,
      graves: [],
      orders: [],
      notifications: [],
    });
  if (!user) {
    user = createDemo();
    session(req, res, user);
  }
  res.json({
    user: publicUser(user),
    services,
    extras,
    graves: db
      .prepare("SELECT * FROM graves WHERE user_id=? ORDER BY rowid")
      .all(user.id),
    orders: getOrders(user.id),
    notifications: db
      .prepare(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY rowid DESC LIMIT 30",
      )
      .all(user.id),
  });
});
app.post("/api/auth/register", authLimit, (req, res) => {
  const data = valid(
    z.object({
      name: text,
      email: z
        .email()
        .max(200)
        .transform((s) => s.toLowerCase()),
      password: z.string().min(8).max(128),
      phone: z.string().trim().max(30).default(""),
    }),
    req.body,
  );
  if (db.prepare("SELECT id FROM users WHERE email=?").get(data.email))
    return res
      .status(409)
      .json({ error: "Konto z tym adresem e-mail już istnieje." });
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id,name,email,phone,password) VALUES (?,?,?,?,?)",
  ).run(id, data.name, data.email, data.phone, hashPassword(data.password));
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(id);
  session(req, res, user);
  res.status(201).json({ user: publicUser(user) });
});
app.post("/api/auth/login", authLimit, (req, res) => {
  const data = valid(
    z.object({
      email: z.email().transform((s) => s.toLowerCase()),
      password: z.string().min(1).max(128),
    }),
    req.body,
  );
  const user = db
    .prepare("SELECT * FROM users WHERE email=? AND demo=0")
    .get(data.email);
  if (!user || !verifyPassword(data.password, user.password))
    return res
      .status(401)
      .json({ error: "Nieprawidłowy adres e-mail lub hasło." });
  session(req, res, user);
  res.json({ user: publicUser(user) });
});
app.post("/api/auth/logout", (req, res) => {
  const token = req.headers.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("zn_session="))
    ?.slice(11);
  if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(token);
  res.setHeader(
    "Set-Cookie",
    "zn_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );
  res.json({ ok: true });
});
app.post("/api/graves", required, (req, res) => {
  const g = valid(graveSchema, req.body),
    id = randomUUID();
  db.prepare(
    "INSERT INTO graves (id,user_id,name,cemetery,city,sector,location,notes) VALUES (?,?,?,?,?,?,?,?)",
  ).run(
    id,
    req.user.id,
    g.name,
    g.cemetery,
    g.city,
    g.sector,
    g.location,
    g.notes,
  );
  res.status(201).json({ id, ...g });
});
app.patch("/api/graves/:id", required, (req, res) => {
  const g = valid(graveSchema, req.body);
  const result = db
    .prepare(
      "UPDATE graves SET name=?,cemetery=?,city=?,sector=?,location=?,notes=? WHERE id=? AND user_id=?",
    )
    .run(
      g.name,
      g.cemetery,
      g.city,
      g.sector,
      g.location,
      g.notes,
      req.params.id,
      req.user.id,
    );
  if (!result.changes)
    return res.status(404).json({ error: "Nie znaleziono nagrobka." });
  res.json({ ok: true });
});
app.post("/api/orders", required, (req, res) => {
  const data = valid(
    z.object({
      grave_id: z.uuid(),
      service: z.enum(["basic", "complete", "flowers"]),
      date: z.iso.date(),
      extras: z
        .array(z.enum(["candle", "flowers"]))
        .max(2)
        .default([]),
      notes: z.string().trim().max(1500).default(""),
    }),
    req.body,
  );
  const today = new Date().toISOString().slice(0, 10);
  if (data.date < today)
    return res
      .status(400)
      .json({ error: "Wybierz dzisiejszy lub przyszły termin." });
  if (
    !db
      .prepare("SELECT id FROM graves WHERE id=? AND user_id=?")
      .get(data.grave_id, req.user.id)
  )
    return res.status(404).json({ error: "Nie znaleziono nagrobka." });
  const unique = [...new Set(data.extras)],
    id = randomUUID(),
    price =
      services.find((s) => s.id === data.service).price +
      unique.reduce((sum, e) => sum + extras.find((x) => x.id === e).price, 0);
  db.prepare(
    "INSERT INTO orders (id,user_id,grave_id,service,price,date,extras,notes,created) VALUES (?,?,?,?,?,?,?,?,?)",
  ).run(
    id,
    req.user.id,
    data.grave_id,
    data.service,
    price,
    data.date,
    JSON.stringify(unique),
    data.notes,
    new Date().toISOString(),
  );
  db.prepare(
    "INSERT INTO notifications (id,user_id,title,body,date,order_id) VALUES (?,?,?,?,?,?)",
  ).run(
    randomUUID(),
    req.user.id,
    "Przyjęliśmy Twoje zamówienie",
    "Poinformujemy Cię o postępie realizacji w panelu klienta.",
    new Date().toISOString(),
    id,
  );
  res.status(201).json({ id, price });
});
app.post("/api/orders/:id/cancel", required, (req, res) => {
  const r = db
    .prepare(
      "UPDATE orders SET status='cancelled' WHERE id=? AND user_id=? AND status='scheduled'",
    )
    .run(req.params.id, req.user.id);
  if (!r.changes)
    return res
      .status(400)
      .json({ error: "Można anulować tylko zaplanowane zamówienie." });
  res.json({ ok: true });
});
app.post("/api/notifications/read", required, (req, res) => {
  db.prepare("UPDATE notifications SET read=1 WHERE user_id=?").run(
    req.user.id,
  );
  res.json({ ok: true });
});
app.patch("/api/account", required, (req, res) => {
  const d = valid(
    z.object({ name: text, phone: z.string().trim().max(30) }),
    req.body,
  );
  db.prepare("UPDATE users SET name=?,phone=? WHERE id=?").run(
    d.name,
    d.phone,
    req.user.id,
  );
  res.json({ ok: true });
});
app.get("/api/photos/:id", required, (req, res) => {
  const p = db
    .prepare(
      "SELECT photos.*,orders.user_id FROM photos JOIN orders ON orders.id=photos.order_id WHERE photos.id=?",
    )
    .get(req.params.id);
  if (!p || (p.user_id !== req.user.id && req.user.role !== "admin"))
    return res.status(404).json({ error: "Nie znaleziono zdjęcia." });
  const file = resolve(
    p.demo ? "public/images" : resolve(dataDir, "uploads"),
    p.filename,
  );
  res.sendFile(file);
});
app.get("/api/admin/orders", required, staff, (req, res) => {
  const rows = db
    .prepare(
      "SELECT orders.*,users.name as customer_name, users.email as customer_email, users.phone as customer_phone, graves.name as grave_name,graves.cemetery,graves.city,graves.sector,graves.location,graves.notes as grave_notes FROM orders JOIN users ON users.id=orders.user_id JOIN graves ON graves.id=orders.grave_id WHERE users.demo=0 ORDER BY orders.created DESC",
    )
    .all();
  res.json(
    rows.map((o) => ({
      ...o,
      service_name: services.find((s) => s.id === o.service)?.name,
      photos: db
        .prepare("SELECT id,kind FROM photos WHERE order_id=?")
        .all(o.id)
        .map((p) => ({ ...p, url: `/api/photos/${p.id}` })),
    })),
  );
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});
app.patch(
  "/api/admin/orders/:id",
  required,
  staff,
  upload.fields([
    { name: "before", maxCount: 4 },
    { name: "after", maxCount: 4 },
  ]),
  (req, res) => {
    const data = valid(
      z.object({
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
        report: z.string().trim().max(3000).default(""),
      }),
      req.body,
    );
    const order = db
      .prepare("SELECT * FROM orders WHERE id=?")
      .get(req.params.id);
    if (!order)
      return res.status(404).json({ error: "Nie znaleziono zamówienia." });
    const files = Object.entries(req.files || {}).flatMap(([kind, fs]) =>
      fs.map((f) => ({ ...f, kind })),
    );
    for (const f of files) {
      const b = f.buffer;
      const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
      const png = b
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const webp =
        b.toString("ascii", 0, 4) === "RIFF" &&
        b.toString("ascii", 8, 12) === "WEBP";
      if (!jpeg && !png && !webp)
        return res
          .status(400)
          .json({ error: "Dozwolone są zdjęcia JPG, PNG lub WebP." });
      f.extension = jpeg ? "jpg" : png ? "png" : "webp";
    }
    const existing = db
      .prepare(
        "SELECT COUNT(*) as count FROM photos WHERE order_id=? AND kind='after'",
      )
      .get(order.id).count;
    if (
      data.status === "completed" &&
      (!data.report || (!existing && !files.some((f) => f.kind === "after")))
    )
      return res
        .status(400)
        .json({
          error:
            "Aby zakończyć usługę, dodaj opis prac i przynajmniej jedno zdjęcie po wykonaniu.",
        });
    const written = [];
    try {
      db.exec("BEGIN");
      for (const f of files) {
        const id = randomUUID(),
          filename = `${id}.${f.extension}`;
        const file = resolve(dataDir, "uploads", filename);
        writeFileSync(file, f.buffer);
        written.push(file);
        db.prepare(
          "INSERT INTO photos (id,order_id,filename,kind,original_name) VALUES (?,?,?,?,?)",
        ).run(id, order.id, filename, f.kind, f.originalname.slice(0, 180));
      }
      db.prepare(
        "UPDATE orders SET status=?,report=?,completed=? WHERE id=?",
      ).run(
        data.status,
        data.report,
        data.status === "completed" ? new Date().toISOString() : null,
        order.id,
      );
      if (data.status !== order.status)
        db.prepare(
          "INSERT INTO notifications (id,user_id,title,body,date,order_id) VALUES (?,?,?,?,?,?)",
        ).run(
          randomUUID(),
          order.user_id,
          data.status === "completed"
            ? "Twój nagrobek jest już zadbany"
            : "Nowy status Twojego zamówienia",
          data.status === "completed"
            ? "Obejrzyj raport i zdjęcia po wykonaniu usługi."
            : `Status zamówienia został zaktualizowany.`,
          new Date().toISOString(),
          order.id,
        );
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      for (const f of written) unlinkSync(f);
      throw err;
    }
    res.json({ ok: true });
  },
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Nie znaleziono zasobu." }),
);
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res
      .status(400)
      .json({
        error: "Sprawdź wymagane pola i poprawność wprowadzonych danych.",
      });
  if (err instanceof multer.MulterError)
    return res
      .status(400)
      .json({
        error:
          "Możesz dodać maksymalnie 4 zdjęcia przed i 4 po realizacji, do 8 MB każde.",
      });
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ error: "Nieprawidłowe dane żądania." });
  console.error(err);
  res.status(500).json({ error: "Wystąpił błąd serwera. Spróbuj ponownie." });
});
