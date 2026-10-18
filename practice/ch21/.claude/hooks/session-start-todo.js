// SessionStart：印出 TODO.md 今日待辦（stdout 會注入給 Claude 當 context）
const fs = require("fs");
const path = require("path");
// Git Bash 可能給 /c/Users/... 形式，轉成 Windows 路徑讓 Node 認得
const root = (process.env.CLAUDE_PROJECT_DIR || process.cwd()).replace(/^\/([a-zA-Z])\//, "$1:/");
const todoPath = path.join(root, "TODO.md");
try {
  const lines = fs.readFileSync(todoPath, "utf8").split(/\r?\n/);
  const pending = lines.filter((l) => /^\s*- \[ \]/.test(l));
  const today = new Date().toISOString().slice(0, 10);
  console.log(`📋 今日待辦（${today}，共 ${pending.length} 項未完成）`);
  pending.forEach((l) => console.log(l.trim()));
} catch (err) {
  // 沒有 TODO.md 不該擋住 session 啟動
  console.log(`📋 找不到 TODO.md（${err.code || err.message}），略過今日待辦`);
}
