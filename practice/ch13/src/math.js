// 第 13 章演練素材：刻意埋了 bug，且沒有測試
'use strict';

/** 計算陣列平均值 */
function average(nums) {
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
  }
  return sum / nums.length;
}

/** 回傳 1..n 的總和 */
function sumTo(n) {
  return (n * (n + 1)) / 2;
}

/** 回傳陣列最大值 */
function max(nums) {
  let best = -Infinity;
  for (const n of nums) {
    if (n > best) best = n;
  }
  return best;
}

module.exports = { average, sumTo, max };
