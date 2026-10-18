// 共用工具：讀 stdin JSON、時間戳、附加 log
const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// 把 Git Bash 式路徑（/c/Users/...）轉成 Windows 路徑，其餘原樣返回
function toNative(p) {
  if (!p) return p;
  const m = process.platform === 'win32' && /^\/([a-zA-Z])(\/.*)?$/.exec(p);
  return m ? `${m[1].toUpperCase()}:${m[2] || '/'}` : p;
}

// 專案根目錄：優先用 Claude Code 提供的 CLAUDE_PROJECT_DIR，否則用 hook 所在位置往上兩層
const PROJECT_DIR = toNative(process.env.CLAUDE_PROJECT_DIR) || path.resolve(__dirname, '..', '..');
const HOOK_DIR = __dirname;

function ts() {
  return new Date().toISOString();
}

function appendLog(name, line) {
  fs.appendFileSync(path.join(HOOK_DIR, name), line + '\n', 'utf8');
}

module.exports = { toNative, readStdin, PROJECT_DIR, HOOK_DIR, ts, appendLog };
