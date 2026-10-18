// hook 共用：把事件追加寫入 .claude/logs/hooks.log，作為「hook 有參與」的證據
const fs = require('node:fs');
const path = require('node:path');

function projectDir() {
  return process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
}

function writeLog(event, detail) {
  try {
    const dir = path.join(projectDir(), '.claude', 'logs');
    fs.mkdirSync(dir, { recursive: true });
    const line = `${new Date().toISOString()}\t${event}\t${detail}\n`;
    fs.appendFileSync(path.join(dir, 'hooks.log'), line, 'utf8');
  } catch (err) {
    // log 失敗不應中斷 Claude 的工具呼叫
    process.stderr.write(`[hook-log] 寫入失敗：${err.message}\n`);
  }
}

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    process.stderr.write(`[hook] stdin JSON 解析失敗：${err.message}\n`);
    return {};
  }
}

module.exports = { writeLog, readStdinJson, projectDir };
