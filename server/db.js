import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  randomUUID,
  scryptSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const dataDir = resolve(process.env.DATA_DIR || "data");
mkdirSync(resolve(dataDir, "uploads"), { recursive: true });
export const db = new DatabaseSync(resolve(dataDir, "app.sqlite"));
db.exec(`
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL DEFAULT '', password TEXT, role TEXT NOT NULL DEFAULT 'client', demo INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS graves (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, cemetery TEXT NOT NULL, city TEXT NOT NULL, sector TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '');
  CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), grave_id TEXT NOT NULL REFERENCES graves(id), service TEXT NOT NULL, price INTEGER NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled', extras TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '', created TEXT NOT NULL, completed TEXT, report TEXT);
  CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), filename TEXT NOT NULL, kind TEXT NOT NULL, original_name TEXT NOT NULL DEFAULT 'Zdjęcie', demo INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL, date TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, order_id TEXT);
`);

export const services = [
  {
    id: "basic",
    name: "Podstawowa opieka",
    short: "Podstawowa opieka",
    price: 129,
    description: "Porządek i troska na co dzień",
    features: [
      "Uprzątnięcie liści i zwiędłych kwiatów",
      "Umycie nagrobka i uporządkowanie otoczenia",
      "Raport ze zdjęciami po wykonaniu",
    ],
  },
  {
    id: "complete",
    name: "Kompleksowa pielęgnacja",
    short: "Kompleksowa pielęgnacja",
    price: 249,
    description: "Pełna pielęgnacja z dbałością o detale",
    features: [
      "Wszystko z podstawowej opieki",
      "Dokładne czyszczenie i pielęgnacja kamienia",
      "Usunięcie mchu i chwastów",
      "Raport ze zdjęciami przed i po",
    ],
  },
  {
    id: "flowers",
    name: "Znicz i kwiaty",
    short: "Znicz i kwiaty",
    price: 89,
    description: "Mały gest, który znaczy wiele",
    features: [
      "Zapalenie znicza",
      "Ułożenie świeżych kwiatów",
      "Usunięcie wypalonych zniczy",
      "Zdjęcie po wykonaniu usługi",
    ],
  },
];
export const extras = [
  { id: "candle", name: "Dodatkowy znicz", price: 15 },
  { id: "flowers", name: "Świeże kwiaty", price: 49 },
];
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(
    Buffer.from(hash, "hex"),
    scryptSync(password, salt, 64),
  );
}
export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    demo: !!user.demo,
  };
}
const day = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};
export function createDemo() {
  const uid = randomUUID(),
    g1 = randomUUID(),
    g2 = randomUUID();
  db.prepare("INSERT INTO users (id,name,email,demo) VALUES (?,?,?,1)").run(
    uid,
    "Anna Kowalska",
    `demo-${uid}@example.invalid`,
  );
  const addGrave = db.prepare(
    "INSERT INTO graves (id,user_id,name,cemetery,city,sector,location) VALUES (?,?,?,?,?,?,?)",
  );
  addGrave.run(
    g1,
    uid,
    "Jan i Maria Kowalscy",
    "Cmentarz Powązkowski",
    "Warszawa",
    "Kwatera 154",
    "Rząd 3, grób 12",
  );
  addGrave.run(
    g2,
    uid,
    "Zofia Nowak",
    "Cmentarz Bródnowski",
    "Warszawa",
    "Kwatera 46A",
    "Rząd 2, grób 8",
  );
  const insert = db.prepare(
    "INSERT INTO orders (id,user_id,grave_id,service,price,date,status,extras,notes,created,completed,report) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
  );
  const scheduled = randomUUID(),
    completed = randomUUID();
  insert.run(
    scheduled,
    uid,
    g1,
    "complete",
    264,
    day(7),
    "scheduled",
    '["candle"]',
    "Proszę postawić znicz po prawej stronie nagrobka.",
    day(-3),
    null,
    null,
  );
  insert.run(
    completed,
    uid,
    g1,
    "complete",
    249,
    day(-8),
    "completed",
    "[]",
    "",
    day(-15),
    day(-8),
    "Nagrobek został dokładnie umyty i wypielęgnowany. Usunęliśmy liście, zwiędłe kwiaty i wypalone znicze. Uporządkowaliśmy również najbliższe otoczenie. Wszystkie prace wykonaliśmy z troską i szacunkiem.",
  );
  insert.run(
    randomUUID(),
    uid,
    g2,
    "basic",
    129,
    day(-31),
    "completed",
    "[]",
    "",
    day(-38),
    day(-31),
    "Umyto płytę nagrobka oraz uporządkowano otoczenie. Usunięto liście i wypalone znicze.",
  );
  for (const [kind, filename] of [
    ["before", "before.jpg"],
    ["after", "grave.jpg"],
  ]) {
    db.prepare(
      "INSERT INTO photos (id,order_id,filename,kind,demo) VALUES (?,?,?,?,1)",
    ).run(randomUUID(), completed, filename, kind);
  }
  db.prepare(
    "INSERT INTO notifications (id,user_id,title,body,date,order_id) VALUES (?,?,?,?,?,?)",
  ).run(
    randomUUID(),
    uid,
    "Twój nagrobek jest już zadbany",
    "Raport i zdjęcia z ostatniej wizyty są gotowe.",
    day(-8),
    completed,
  );
  return db.prepare("SELECT * FROM users WHERE id=?").get(uid);
}
export function getOrders(uid) {
  const rows = db
    .prepare(
      "SELECT orders.*, graves.name as grave_name, graves.cemetery, graves.city, graves.sector, graves.location, graves.notes as grave_notes FROM orders JOIN graves ON graves.id=orders.grave_id WHERE orders.user_id=? ORDER BY orders.created DESC, orders.rowid DESC",
    )
    .all(uid);
  return rows.map((o) => ({
    ...o,
    extras: JSON.parse(o.extras),
    service_name: services.find((s) => s.id === o.service)?.name || o.service,
    photos: db
      .prepare(
        "SELECT id,kind,original_name FROM photos WHERE order_id=? ORDER BY rowid",
      )
      .all(o.id)
      .map((p) => ({ ...p, url: `/api/photos/${p.id}` })),
  }));
}
