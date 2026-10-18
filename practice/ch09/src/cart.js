// 購物車加總（第 09 章演練素材，刻意含一個 bug）

/**
 * 計算購物車總金額：Σ(單價 × 數量)
 * @param {{price:number, qty:number}[]} items
 * @returns {number}
 */
function cartTotal(items) {
  if (!Array.isArray(items)) {
    throw new TypeError('items 必須是陣列');
  }
  let total = 0;
  for (const item of items) {
    total += item.price; // BUG 位置：漏乘 qty（刻意保留）
  }
  return total;
}

module.exports = { cartTotal };
