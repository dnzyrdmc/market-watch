export default function ({
  db,
  router,
  run,
  get,
  all,
  id,
  now,
  text,
  num,
  choice,
  publish,
  required,
}) {
  db.exec(`CREATE TABLE IF NOT EXISTS ticks(seq INTEGER PRIMARY KEY AUTOINCREMENT,symbol TEXT,price REAL,at TEXT);
 CREATE TABLE IF NOT EXISTS watch(owner TEXT REFERENCES users(id),symbol TEXT,PRIMARY KEY(owner,symbol));
 CREATE TABLE IF NOT EXISTS alerts(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),symbol TEXT,threshold REAL,armed INTEGER DEFAULT 1,triggered_at TEXT);`);
  const symbols = ["BTC-DEMO", "ETH-DEMO", "VUE-DEMO"];
  function tick() {
    for (const [i, symbol] of symbols.entries()) {
      const prev = get(
        "SELECT * FROM ticks WHERE symbol=? ORDER BY seq DESC LIMIT 1",
        symbol,
      );
      const price =
        Math.round(
          ((prev?.price || [60000, 3000, 100][i]) +
            Math.sin(Date.now() / 10000 + i) * [80, 12, 2][i]) *
            100,
        ) / 100;
      const seq = Number(
        run(
          "INSERT INTO ticks(symbol,price,at) VALUES(?,?,?)",
          symbol,
          price,
          now(),
        ).lastInsertRowid,
      );
      publish("price", { symbol, price, seq, at: now() });
      for (const a of all(
        "SELECT * FROM alerts WHERE symbol=? AND armed=1 AND threshold<?",
        symbol,
        price,
      )) {
        if (!prev || prev.price <= a.threshold) {
          run(
            "UPDATE alerts SET armed=0,triggered_at=? WHERE id=?",
            now(),
            a.id,
          );
          publish("alert", { id: a.id, symbol, price }, a.owner);
        }
      }
    }
    run("DELETE FROM ticks WHERE seq < (SELECT MAX(seq)-1500 FROM ticks)");
  }
  tick();
  const timer = setInterval(tick, 2000);
  timer.unref();
  router.get("/market", (req, res) =>
    res.json({
      symbols,
      prices: symbols.map((s) =>
        get("SELECT * FROM ticks WHERE symbol=? ORDER BY seq DESC LIMIT 1", s),
      ),
      watch: all("SELECT symbol FROM watch WHERE owner=?", req.user.id),
      alerts: all("SELECT * FROM alerts WHERE owner=?", req.user.id),
    }),
  );
  router.get("/prices/:symbol", (req, res) =>
    res.json(
      all(
        "SELECT * FROM (SELECT * FROM ticks WHERE symbol=? ORDER BY seq DESC LIMIT 100) ORDER BY seq",
        choice(req.params.symbol, symbols),
      ),
    ),
  );
  router.put("/watch/:symbol", (req, res) => {
    run(
      "INSERT OR IGNORE INTO watch VALUES(?,?)",
      req.user.id,
      choice(req.params.symbol, symbols),
    );
    res.json({ ok: true });
  });
  router.delete("/watch/:symbol", (req, res) => {
    run(
      "DELETE FROM watch WHERE owner=? AND symbol=?",
      req.user.id,
      req.params.symbol,
    );
    res.json({ ok: true });
  });
  router.post("/alerts", (req, res) => {
    const aid = id();
    run(
      "INSERT INTO alerts(id,owner,symbol,threshold) VALUES(?,?,?,?)",
      aid,
      req.user.id,
      choice(req.body.symbol, symbols),
      num(req.body.threshold, 0.01, 1e8),
    );
    res.status(201).json({ id: aid });
  });
  router.delete("/alerts/:id", (req, res) => {
    required(
      get(
        "SELECT id FROM alerts WHERE id=? AND owner=?",
        req.params.id,
        req.user.id,
      ),
    );
    run("DELETE FROM alerts WHERE id=?", req.params.id);
    res.json({ ok: true });
  });
}
