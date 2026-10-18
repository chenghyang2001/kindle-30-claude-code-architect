// Stop：有未 commit 的變更時提醒（只提醒，exit 0 不擋）
const { execSync } = require("child_process");
// Git Bash 可能給 /c/Users/... 形式，轉成 Windows 路徑讓 Node 認得
const root = (process.env.CLAUDE_PROJECT_DIR || process.cwd()).replace(/^\/([a-zA-Z])\//, "$1:/");
try {
  const out = execSync("git status --porcelain", { cwd: root, encoding: "utf8" }).trim();
  if (out) {
    const n = out.split(/\r?\n/).length;
    const msg = `⚠️ 提醒：還有 ${n} 個未 commit 的變更（只提醒，不阻擋）`;
    console.log(JSON.stringify({ systemMessage: msg }));
  }
} catch (err) {
  console.log(JSON.stringify({ systemMessage: `stop hook：無法讀取 git 狀態（${err.message}）` }));
}
process.exit(0);
