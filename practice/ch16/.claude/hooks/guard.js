// Guard（守衛）：PreToolUse 擋下 Bash 中的 rm -rf，exit 2 讓 Claude 看到 stderr 理由
const { readStdin } = require('./lib');

const input = readStdin();
const cmd = (input.tool_input && input.tool_input.command) || '';

// 涵蓋 rm -rf / rm -fr / rm -Rf / rm -r -f / rm --recursive --force 等寫法
const patterns = [
  /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\b/i,
  /\brm\s+(?=.*(-r\b|-R\b|--recursive))(?=.*(-f\b|--force)).*/,
];

if (patterns.some((re) => re.test(cmd))) {
  process.stderr.write(`[Guard] 已阻擋危險指令：${cmd}\n請改用更精確的刪除方式（例如逐一刪除指定檔案）。\n`);
  process.exit(2);
}
process.exit(0);
