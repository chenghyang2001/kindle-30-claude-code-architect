// PreToolUse：擋 .env 存取與 rm -rf；exit 2 = 阻擋並把 stderr 回饋給 Claude
const path = require('node:path');
const { writeLog, readStdinJson } = require('./log');

const RM_RF = /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|-r\s+-f|-f\s+-r|--recursive\s+--force|--force\s+--recursive)\b/;
// .env 或 .env.local 等；.env.example 是範本，允許
const ENV_IN_CMD = /(^|[\s'"\/=<])\.env(\.(?!example\b)[\w-]+)?(?=$|[\s'"|;&>)])/;

function isEnvFile(p) {
  if (!p) return false;
  const base = path.basename(String(p));
  return /^\.env(\.[\w-]+)?$/.test(base) && base !== '.env.example';
}

function check(input) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  if (tool === 'Bash') {
    const cmd = ti.command || '';
    if (RM_RF.test(cmd)) return `禁止執行 rm -rf：${cmd}`;
    if (ENV_IN_CMD.test(cmd)) return `禁止在指令中存取 .env：${cmd}`;
    return null;
  }
  const target = ti.file_path || ti.path || ti.notebook_path;
  if (isEnvFile(target)) return `禁止 ${tool} 存取機密檔 ${target}`;
  if (tool === 'Grep' && ti.glob && /\.env/.test(ti.glob) && !/example/.test(ti.glob)) {
    return `禁止 Grep 搜尋 .env：${ti.glob}`;
  }
  return null;
}

function main() {
  const input = readStdinJson();
  const reason = check(input);
  if (reason) {
    writeLog('PreToolUse:BLOCK', `${input.tool_name}\t${reason}`);
    process.stderr.write(`[guard] ${reason}（由專案 PreToolUse hook 阻擋）\n`);
    process.exit(2);
  }
  writeLog('PreToolUse:allow', input.tool_name || '?');
  process.exit(0);
}

if (require.main === module) main();
module.exports = { check, isEnvFile };
