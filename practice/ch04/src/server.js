// 示範用 Express 伺服器（第 04 章練習：供 explain-codebase 分析）
const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: '找不到使用者' });
    res.json(user);
  } catch (err) {
    console.error('GET /users/:id 失敗：', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/:id/orders', async (req, res) => {
  try {
    res.json(await db.getOrdersWithItems(req.params.id));
  } catch (err) {
    console.error('GET /users/:id/orders 失敗：', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/search', async (req, res) => {
  try {
    res.json(await db.searchProducts(req.query.q ?? ''));
  } catch (err) {
    console.error('GET /search 失敗：', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`listening on ${port}`));
