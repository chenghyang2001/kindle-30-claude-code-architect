// 刻意含安全漏洞的教學範例 — 切勿用於正式環境
const express = require("express");
const mysql = require("mysql");

const app = express();
app.use(express.json());

// 漏洞 1：硬編碼機密
const DB_PASSWORD = "SuperSecret123!";
const JWT_SECRET = "my-jwt-secret-key";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: DB_PASSWORD,
  database: "shop",
});

// 漏洞 2：SQL 字串拼接（SQL Injection）
app.get("/users", (req, res) => {
  const name = req.query.name;
  const sql = "SELECT * FROM users WHERE name = '" + name + "'";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// 漏洞 3：eval 執行使用者輸入（遠端程式碼執行）
app.post("/calc", (req, res) => {
  const result = eval(req.body.expression);
  res.json({ result });
});

// 漏洞 4：反射型 XSS
app.get("/hello", (req, res) => {
  res.send("<h1>Hello " + req.query.name + "</h1>");
});

app.listen(3000, () => console.log("listening on 3000, secret=" + JWT_SECRET));
