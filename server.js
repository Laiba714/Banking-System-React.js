const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Bilalshamsi2004.",
  database: "banking_system",
});

db.connect(err => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  const sql = "INSERT INTO users (username, email, password, balance) VALUES (?, ?, ?, 0)";
  db.query(sql, [username, email, password], (err) => {
    if (err) return res.status(500).send({ message: "Registration failed" });
    res.send({ message: "Registered successfully" });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err || results.length === 0) return res.status(401).send({ message: "Login failed" });
    res.send(results[0]);
  });
});

app.get("/user/:id", (req, res) => {
  const sql = "SELECT * FROM users WHERE id = ?";
  db.query(sql, [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send({ message: "User not found" });
    res.send(results[0]);
  });
});

app.post("/deposit", (req, res) => {
  const { userId, amount } = req.body;
  const sql = "UPDATE users SET balance = balance + ? WHERE id = ?";
  db.query(sql, [amount, userId], err => {
    if (err) return res.status(500).send({ message: "Deposit failed" });
    res.send({ message: "Deposit successful" });
  });
});

app.post("/withdraw", (req, res) => {
  const { userId, amount } = req.body;
  const sql = "UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?";
  db.query(sql, [amount, userId, amount], (err, result) => {
    if (err || result.affectedRows === 0) return res.status(400).send({ message: "Insufficient balance" });
    res.send({ message: "Withdrawal successful" });
  });
});

app.post("/transfer", (req, res) => {
  const { senderId, recipientEmail, amount } = req.body;

  db.beginTransaction(err => {
    if (err) return res.status(500).send({ message: "Transaction error" });

    db.query("SELECT id FROM users WHERE email = ?", [recipientEmail], (err, results) => {
      if (err || results.length === 0) return db.rollback(() => res.status(400).send({ message: "Recipient not found" }));

      const recipientId = results[0].id;

      db.query("UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?", [amount, senderId, amount], (err, result) => {
        if (err || result.affectedRows === 0) return db.rollback(() => res.status(400).send({ message: "Insufficient funds" }));

        db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, recipientId], (err) => {
          if (err) return db.rollback(() => res.status(500).send({ message: "Transfer failed" }));

          db.commit(err => {
            if (err) return db.rollback(() => res.status(500).send({ message: "Commit failed" }));
            res.send({ message: "Transfer successful" });
          });
        });
      });
    });
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
