// cartTotal 測試：依 docstring「Σ(單價 × 數量)」判定正確行為，不遷就現有實作
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cartTotal } = require("../src/cart.js");

test("正常：多筆品項依 單價 × 數量 加總", () => {
  const items = [
    { price: 100, qty: 2 },
    { price: 50, qty: 3 },
  ];
  assert.equal(cartTotal(items), 350);
});

test("正常：數量為 1 時等於單價總和", () => {
  assert.equal(
    cartTotal([
      { price: 30, qty: 1 },
      { price: 20, qty: 1 },
    ]),
    50,
  );
});

test("邊界：空陣列回傳 0", () => {
  assert.equal(cartTotal([]), 0);
});

test("邊界：數量為 0 的品項不計入", () => {
  assert.equal(
    cartTotal([
      { price: 999, qty: 0 },
      { price: 10, qty: 2 },
    ]),
    20,
  );
});

test("錯誤：非陣列輸入拋出 TypeError", () => {
  for (const bad of [null, undefined, 123, "abc", { price: 1, qty: 1 }]) {
    assert.throws(() => cartTotal(bad), TypeError);
  }
});
