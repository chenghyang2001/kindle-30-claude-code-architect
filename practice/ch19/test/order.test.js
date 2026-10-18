const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calcSubtotal, calcTotal } = require("../src/order");

// calcSubtotal
test("calcSubtotal 正常：所有品項都計入", () => {
  assert.equal(
    calcSubtotal([
      { price: 100, qty: 2 },
      { price: 50, qty: 1 },
    ]),
    250,
  );
});

test("calcSubtotal 邊界：單一品項", () => {
  assert.equal(calcSubtotal([{ price: 300, qty: 1 }]), 300);
});

test("calcSubtotal 邊界：空陣列回傳 0", () => {
  assert.equal(calcSubtotal([]), 0);
});

test("calcSubtotal 錯誤：非陣列拋 TypeError", () => {
  assert.throws(() => calcSubtotal(null), TypeError);
});

test("calcSubtotal 錯誤：第一個品項為負數也要拋 RangeError", () => {
  assert.throws(
    () =>
      calcSubtotal([
        { price: -1, qty: 1 },
        { price: 10, qty: 1 },
      ]),
    RangeError,
  );
});

// calcTotal
test("calcTotal 正常：未達免運門檻，加稅加運費", () => {
  // 500 * 1.05 + 60 = 585
  assert.equal(
    calcTotal([
      { price: 200, qty: 2 },
      { price: 100, qty: 1 },
    ]),
    585,
  );
});

test("calcTotal 正常：折扣後計稅", () => {
  // 2000 * 0.9 = 1800，免運，1800 * 1.05 = 1890
  assert.equal(calcTotal([{ price: 1000, qty: 2 }], 0.1), 1890);
});

test("calcTotal 邊界：剛好達免運門檻 1000", () => {
  assert.equal(calcTotal([{ price: 1000, qty: 1 }]), 1050);
});

test("calcTotal 邊界：空訂單為 0（不收運費）", () => {
  assert.equal(calcTotal([]), 0);
});

test("calcTotal 錯誤：折扣率超出 0~1 拋 RangeError", () => {
  assert.throws(() => calcTotal([{ price: 100, qty: 1 }], 1.5), RangeError);
  assert.throws(() => calcTotal([{ price: 100, qty: 1 }], -0.1), RangeError);
});
