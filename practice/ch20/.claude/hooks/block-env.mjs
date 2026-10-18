#!/usr/bin/env node
// PreToolUse hook：阻擋任何工具讀寫 .env 類機密檔（.env.example 例外）
// 退出碼 2 = 阻擋，stderr 內容會回饋給 Claude
import { basename } from "node:path";

const ENV_FILE = /^\.env(\..+)?$/;
const ALLOWED = new Set([".env.example", ".env.sample"]);

function isSecretEnvPath(p) {
  if (typeof p !== "string" || p.length === 0) return false;
  const name = basename(p.replace(/\\/g, "/"));
  return ENV_FILE.test(name) && !ALLOWED.has(name);
}

// Bash 指令裡出現 .env 檔名（但不是 .env.example）就擋
function bashTouchesEnv(cmd) {
  if (typeof cmd !== "string") return false;
  const tokens = cmd.match(/[^\s"'`;|&<>()]*\.env(\.[\w-]+)?\b/g) ?? [];
  return tokens.some((t) => isSecretEnvPath(t));
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch (err) {
    // 解析失敗時放行，避免 hook 自己壞掉卡死所有工具
    console.error(`block-env：無法解析 hook 輸入（${err.message}），放行`);
    process.exit(0);
  }
  const ti = input.tool_input ?? {};
  const hit =
    isSecretEnvPath(ti.file_path) ||
    isSecretEnvPath(ti.path) ||
    isSecretEnvPath(ti.notebook_path) ||
    bashTouchesEnv(ti.command);
  if (hit) {
    console.error("已阻擋：.env 含機密，禁止讀寫。需要範本請改用 .env.example。");
    process.exit(2);
  }
  process.exit(0);
});
