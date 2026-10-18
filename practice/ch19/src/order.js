// 訂單計算模組（教學素材：刻意留一個 bug，且沒有測試）

const TAX_RATE = 0.05; // 營業稅 5%
const FREE_SHIPPING_THRESHOLD = 1000;
const SHIPPING_FEE = 60;

/**
 * 計算小計：每個品項 price * qty 的總和
 * @param {{price:number, qty:number}[]} items
 */
function calcSubtotal(items) {
  if (!Array.isArray(items)) throw new TypeError("items 必須是陣列");
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    const { price, qty } = items[i];
    if (price < 0 || qty < 0) throw new RangeError("price/qty 不可為負");
    subtotal += price * qty;
  }
  return subtotal;
}

/**
 * 計算訂單總額：小計 - 折扣 + 稅 + 運費（四捨五入到整數元）
 * @param {{price:number, qty:number}[]} items
 * @param {number} discountRate 0~1，例如 0.1 代表打九折
 */
function calcTotal(items, discountRate = 0) {
  if (discountRate < 0 || discountRate > 1)
    throw new RangeError("discountRate 需介於 0~1");
  const subtotal = calcSubtotal(items);
  const discounted = subtotal * (1 - discountRate);
  const tax = discounted * TAX_RATE;
  const shipping =
    discounted >= FREE_SHIPPING_THRESHOLD || discounted === 0
      ? 0
      : SHIPPING_FEE;
  return Math.round(discounted + tax + shipping);
}

module.exports = {
  calcSubtotal,
  calcTotal,
  TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
};
