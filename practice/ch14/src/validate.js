// email 與密碼強度驗證（第 14 章演練用，刻意埋一個邊界 bug）

/**
 * 驗證 email 格式。
 * 規格：必須是字串；恰好一個 @；@ 前後都不可為空；網域部分需含 . 且 . 不在頭尾。
 * 非字串輸入回傳 false（不拋錯）。
 * @param {unknown} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const parts = email.trim().split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length === 0 || domain.length === 0) return false;
  if (!domain.includes(".")) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

/**
 * 驗證密碼強度。
 * 規格：長度「至少 8 字元」（8 字元也要通過）、最多 64 字元；
 * 需同時包含大寫字母、小寫字母、數字。
 * 非字串輸入拋出 TypeError。
 * @param {unknown} password
 * @returns {boolean}
 */
function isStrongPassword(password) {
  if (typeof password !== "string") {
    throw new TypeError("password must be a string");
  }
  // 修正：規格為「至少 8 字元（含 8）」，原本 <= 8 會誤擋剛好 8 字元的密碼（off-by-one）
  if (password.length < 8 || password.length > 64) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

module.exports = { isValidEmail, isStrongPassword };
