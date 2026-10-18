// PostToolUse（Write|Edit）：把寫檔事件追加到 logs/tool-writes.log
const fs = require("fs");
const path = require("path");
// Git Bash 可能給 /c/Users/... 形式，轉成 Windows 路徑讓 Node 認得
const root = (process.env.CLAUDE_PROJECT_DIR || process.cwd()).replace(/^\/([a-zA-Z])\//, "$1:/");
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const evt = JSON.parse(raw || "{}");
    const file = evt.tool_input?.file_path ?? "(unknown)";
    const line = `${new Date().toISOString()}\t${evt.tool_name ?? "?"}\t${file}\n`;
    fs.mkdirSync(path.join(root, "logs"), { recursive: true });
    fs.appendFileSync(path.join(root, "logs", "tool-writes.log"), line, "utf8");
  } catch (err) {
    // 記 log 失敗只回報到 stderr，不阻擋工具
    console.error(`post-tool-log 失敗：${err.message}`);
  }
  process.exit(0);
});
