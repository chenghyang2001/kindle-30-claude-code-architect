// 示範用 API 模組（第 12 章演練：故意埋入安全、效能、測試問題，請勿用於正式環境）
const db = require("./db");

// 依使用者名稱查詢 —— 直接字串拼接 SQL
async function getUserByName(name) {
  const sql = "SELECT * FROM users WHERE name = '" + name + "'";
  return db.query(sql);
}

// 依關鍵字搜尋訂單 —— 同樣字串拼接，且 ORDER BY 欄位由使用者決定
async function searchOrders(keyword, sortBy) {
  const sql = `SELECT * FROM orders WHERE note LIKE '%${keyword}%' ORDER BY ${sortBy}`;
  return db.query(sql);
}

// 找出同時出現在兩份清單中的使用者 —— 巢狀迴圈 O(n*m)
function findCommonUsers(listA, listB) {
  const common = [];
  for (let i = 0; i < listA.length; i++) {
    for (let j = 0; j < listB.length; j++) {
      if (listA[i].id === listB[j].id && !common.includes(listA[i])) {
        common.push(listA[i]);
      }
    }
  }
  return common;
}

// 移除重複訂單 —— filter + indexOf，O(n²)
function dedupeOrders(orders) {
  return orders.filter(
    (o, idx) => orders.findIndex((x) => x.id === o.id) === idx,
  );
}

// Express 路由處理器 —— 未驗證輸入、錯誤訊息直接回傳給前端
async function handleGetUser(req, res) {
  try {
    const rows = await getUserByName(req.query.name);
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

module.exports = {
  getUserByName,
  searchOrders,
  findCommonUsers,
  dedupeOrders,
  handleGetUser,
};
