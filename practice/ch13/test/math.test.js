"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { average, sumTo, max } = require("../src/math.js");

describe("average", () => {
  it("一般情況：[2,4,6] 應為 4", () => {
    assert.equal(average([2, 4, 6]), 4);
  });
  it("邊界：單一元素 [5] 應為 5", () => {
    assert.equal(average([5]), 5);
  });
  it("邊界：全負數 [-2,-4] 應為 -3", () => {
    assert.equal(average([-2, -4]), -3);
  });
  it("邊界：第一個元素也要計入 [10,0,0] 應為 10/3", () => {
    assert.equal(average([10, 0, 0]), 10 / 3);
  });
});

describe("sumTo", () => {
  it("一般情況：sumTo(5) 應為 15", () => {
    assert.equal(sumTo(5), 15);
  });
  it("邊界：sumTo(1) 應為 1", () => {
    assert.equal(sumTo(1), 1);
  });
  it("邊界：sumTo(0) 應為 0", () => {
    assert.equal(sumTo(0), 0);
  });
  it("較大值：sumTo(100) 應為 5050", () => {
    assert.equal(sumTo(100), 5050);
  });
});

describe("max", () => {
  it("一般情況：[1,5,3] 應為 5", () => {
    assert.equal(max([1, 5, 3]), 5);
  });
  it("邊界：全負數 [-3,-1] 應為 -1", () => {
    assert.equal(max([-3, -1]), -1);
  });
  it("邊界：單一負數 [-7] 應為 -7", () => {
    assert.equal(max([-7]), -7);
  });
  it("邊界：最大值在第一位 [9,2,4] 應為 9", () => {
    assert.equal(max([9, 2, 4]), 9);
  });
});
