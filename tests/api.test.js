import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const temporary = mkdtempSync(join(tmpdir(), "zn-test-"));
process.env.DATA_DIR = temporary;
const { app } = await import("../server/app.js");
const { db, hashPassword } = await import("../server/db.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  rmSync(temporary, { recursive: true, force: true });
});
function client() {
  let cookie = "";
  return {
    async call(path, method = "GET", body) {
      const headers = {
        ...(cookie ? { cookie } : {}),
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
      };
      const r = await fetch(base + path, {
        method,
        headers,
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
      });
      if (r.headers.has("set-cookie"))
        cookie = r.headers.get("set-cookie").split(";")[0];
      let data;
      const type = r.headers.get("content-type");
      if (type?.includes("json")) data = await r.json();
      else data = Buffer.from(await r.arrayBuffer());
      return { status: r.status, data, headers: r.headers };
    },
  };
}
const alice = client(),
  bob = client(),
  admin = client();
let grave, order, photo;

test("izolowane konta demonstracyjne i prawdziwa rejestracja", async () => {
  const a = await alice.call("/bootstrap"),
    b = await bob.call("/bootstrap");
  assert.equal(a.status, 200);
  assert.equal(a.data.user.demo, true);
  assert.notEqual(a.data.user.id, b.data.user.id);
  assert.equal(a.data.orders.length, 3);
  assert.equal(a.data.graves.length, 2);
  assert.equal(
    (
      await bob.call(
        a.data.orders
          .find((o) => o.photos.length)
          .photos[0].url.replace("/api", ""),
      )
    ).status,
    404,
  );
  const reg = await alice.call("/auth/register", "POST", {
    name: "Alicja Testowa",
    email: "alice@example.test",
    password: "Secure-testing-password",
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.data.user.demo, false);
  assert.equal("password" in reg.data.user, false);
  const boot = await alice.call("/bootstrap");
  assert.equal(boot.data.orders.length, 0);
  assert.equal(boot.data.graves.length, 0);
  const duplicate = await bob.call("/auth/register", "POST", {
    name: "Test",
    email: "alice@example.test",
    password: "another-password",
  });
  assert.equal(duplicate.status, 409);
  await bob.call("/auth/register", "POST", {
    name: "Barbara Testowa",
    email: "bob@example.test",
    password: "Secure-testing-password",
  });
  const stored = db
    .prepare("SELECT password FROM users WHERE email=?")
    .get("alice@example.test");
  assert.notEqual(stored.password, "Secure-testing-password");
});

test("nagrobki, własność danych i walidacja zamówień", async () => {
  const invalid = await alice.call("/graves", "POST", { name: "A" });
  assert.equal(invalid.status, 400);
  const g = await alice.call("/graves", "POST", {
    name: "Jan Testowy",
    cemetery: "Cmentarz Testowy",
    city: "Warszawa",
    sector: "A",
    location: "Rząd 1",
  });
  assert.equal(g.status, 201);
  grave = g.data.id;
  assert.equal(
    (
      await bob.call(`/graves/${grave}`, "PATCH", {
        name: "Inny",
        cemetery: "Cmentarz",
        city: "Kraków",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await bob.call("/orders", "POST", {
        grave_id: grave,
        service: "complete",
        date: "2099-01-01",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await alice.call("/orders", "POST", {
        grave_id: grave,
        service: "complete",
        date: "2000-01-01",
      })
    ).status,
    400,
  );
  const o = await alice.call("/orders", "POST", {
    grave_id: grave,
    service: "complete",
    date: "2099-01-01",
    extras: ["candle", "candle"],
    price: 1,
  });
  assert.equal(o.status, 201);
  assert.equal(o.data.price, 264);
  order = o.data.id;
  const boot = await alice.call("/bootstrap");
  assert.equal(boot.data.orders[0].status, "scheduled");
  assert.equal(
    boot.data.notifications[0].title,
    "Przyjęliśmy Twoje zamówienie",
  );
  assert.equal((await alice.call("/admin/orders")).status, 403);
});

test("panel obsługi: status, walidacja plików, zdjęcia i raport", async () => {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,'admin')",
  ).run(
    id,
    "Opiekun",
    "admin@example.test",
    hashPassword("Secure-admin-password"),
  );
  assert.equal(
    (
      await admin.call("/auth/login", "POST", {
        email: "admin@example.test",
        password: "Secure-admin-password",
      })
    ).status,
    200,
  );
  assert.equal((await admin.call("/admin/orders")).data.length, 1);
  const progress = new FormData();
  progress.append("status", "in_progress");
  progress.append("report", "Rozpoczęto prace.");
  assert.equal(
    (await admin.call(`/admin/orders/${order}`, "PATCH", progress)).status,
    200,
  );
  assert.equal(
    (await alice.call(`/orders/${order}/cancel`, "POST")).status,
    400,
  );
  const missing = new FormData();
  missing.append("status", "completed");
  missing.append("report", "Wykonano usługę.");
  assert.equal(
    (await admin.call(`/admin/orders/${order}`, "PATCH", missing)).status,
    400,
  );
  const bad = new FormData();
  bad.append("status", "completed");
  bad.append("report", "Opis.");
  bad.append(
    "after",
    new Blob(["<svg></svg>"], { type: "image/jpeg" }),
    "fake.jpg",
  );
  assert.equal(
    (await admin.call(`/admin/orders/${order}`, "PATCH", bad)).status,
    400,
  );
  const report = new FormData();
  report.append("status", "completed");
  report.append("report", "Umyto nagrobek i uporządkowano otoczenie.");
  report.append(
    "after",
    new Blob([readFileSync("public/images/grave.jpg")], { type: "image/jpeg" }),
    "realizacja.jpg",
  );
  assert.equal(
    (await admin.call(`/admin/orders/${order}`, "PATCH", report)).status,
    200,
  );
  const boot = await alice.call("/bootstrap"),
    completed = boot.data.orders[0];
  assert.equal(completed.status, "completed");
  assert.match(completed.report, /Umyto/);
  assert.equal(completed.photos.length, 1);
  photo = completed.photos[0].url.replace("/api", "");
  assert.equal(
    boot.data.notifications[0].title,
    "Twój nagrobek jest już zadbany",
  );
  const image = await alice.call(photo);
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type"), /image\/jpeg/);
  assert.ok(image.data.length > 100);
  assert.equal((await bob.call(photo)).status, 404);
  assert.equal((await client().call(photo)).status, 401);
  assert.equal((await admin.call(photo)).status, 200);
});

test("powiadomienia, anulowanie, logowanie i wylogowanie", async () => {
  await alice.call("/notifications/read", "POST");
  assert.ok(
    (await alice.call("/bootstrap")).data.notifications.every((n) => n.read),
  );
  const pending = await alice.call("/orders", "POST", {
    grave_id: grave,
    service: "basic",
    date: "2099-02-01",
  });
  assert.equal(
    (await alice.call(`/orders/${pending.data.id}/cancel`, "POST")).status,
    200,
  );
  assert.equal(
    (await alice.call(`/orders/${order}/cancel`, "POST")).status,
    400,
  );
  await alice.call("/auth/logout", "POST");
  assert.equal((await alice.call(photo)).status, 401);
  assert.equal(
    (
      await alice.call("/auth/login", "POST", {
        email: "alice@example.test",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await alice.call("/auth/login", "POST", {
        email: "alice@example.test",
        password: "Secure-testing-password",
      })
    ).status,
    200,
  );
  const boot = await alice.call("/bootstrap");
  assert.equal(boot.data.user.name, "Alicja Testowa");
  assert.equal(boot.data.orders.length, 2);
  assert.equal((await alice.call(photo)).status, 200);
});

test("tryb publiczny wymaga konta i nie tworzy danych demonstracyjnych", async () => {
  process.env.DEMO_MODE = "0";
  try {
    const anonymous = await client().call("/bootstrap");
    assert.equal(anonymous.status, 200);
    assert.equal(anonymous.data.user, null);
    assert.equal(anonymous.data.graves.length, 0);
    assert.equal(anonymous.headers.get("set-cookie"), null);
    assert.equal(
      (await alice.call("/bootstrap")).data.user.name,
      "Alicja Testowa",
    );
  } finally {
    delete process.env.DEMO_MODE;
  }
});
