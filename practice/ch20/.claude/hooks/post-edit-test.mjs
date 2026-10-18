#!/usr/bin/env node
// PostToolUse hook：Edit/Write 改到 .ts/.js 後跑一次 npm test 當快速檢查
// 失敗時退出碼 2，把測試尾段輸出回饋給 Claude 讓它自己修
import { spawnSync } from "node:child_process";

const CODE_FILE = /\.(ts|js|mjs|cjs)$/i;
const TAIL_LINES = 30;

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch (err) {
    console.error(`post-edit-test：無法解析 hook 輸入（${err.message}），略過`);
    process.exit(0);
  }
  const filePath = input.tool_input?.file_path ?? "";
  // hooks 自己的腳本不觸發，避免改 hook 時被測試結果干擾
  if (!CODE_FILE.test(filePath) || /[\\/]\.claude[\\/]/.test(filePath)) process.exit(0);

  const cwd = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
  const result = spawnSync("npm", ["test", "--silent"], {
    cwd,
    encoding: "utf8",
    shell: true, // Windows 上 npm 是 npm.cmd，需要 shell
    timeout: 60_000,
  });
  if (result.error) {
    console.error(`post-edit-test：無法執行 npm test（${result.error.message}）`);
    process.exit(0);
  }
  if (result.status !== 0) {
    const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim().split("\n").slice(-TAIL_LINES).join("\n");
    console.error(`npm test 失敗（改動：${filePath}），請修正：\n${out}`);
    process.exit(2);
  }
  console.log("npm test 通過");
  process.exit(0);
});
