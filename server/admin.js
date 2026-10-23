import { randomUUID } from "node:crypto";
import { db, hashPassword } from "./db.js";
const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
if (
  !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
  !password ||
  password.length < 12
) {
  console.error(
    "Ustaw ADMIN_EMAIL oraz ADMIN_PASSWORD (minimum 12 znaków) w bezpiecznym środowisku procesu. Dane nie są wypisywane.",
  );
  process.exit(1);
}
const existing = db.prepare("SELECT id FROM users WHERE email=?").get(email);
if (existing)
  db.prepare("UPDATE users SET password=?,role='admin',demo=0 WHERE id=?").run(
    hashPassword(password),
    existing.id,
  );
else
  db.prepare(
    "INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,'admin')",
  ).run(randomUUID(), "Opiekun ZadbanyNagrobek", email, hashPassword(password));
console.log("Konto obsługi zostało przygotowane. Zaloguj się w aplikacji.");
