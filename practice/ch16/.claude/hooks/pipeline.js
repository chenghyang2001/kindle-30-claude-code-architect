// Pipeline（管線）：PostToolUse 寫檔後依序執行「格式化 → 寫 log」
// 任一步失敗就中斷後續步驟，並在 log 註明失敗位置
const fs = require('fs');
const path = require('path');
const { toNative, readStdin, ts, appendLog } = require('./lib');

const input = readStdin();
const file = toNative(input.tool_input && input.tool_input.file_path);
if (!file || !fs.existsSync(file)) process.exit(0);

// 步驟 1：格式化（JSON 重排縮排；文字檔去行尾空白、統一 LF、結尾一個換行）
function format(f) {
  const ext = path.extname(f).toLowerCase();
  const before = fs.readFileSync(f, 'utf8');
  let after = before;
  if (ext === '.json') {
    after = JSON.stringify(JSON.parse(before), null, 2) + '\n';
  } else if (['.js', '.mjs', '.cjs', '.ts', '.md', '.txt'].includes(ext)) {
    after = before.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n*$/, '\n');
  } else {
    return 'skip';
  }
  if (after !== before) {
    fs.writeFileSync(f, after, 'utf8');
    return 'formatted';
  }
  return 'unchanged';
}

// 步驟 2：寫一行 log
const steps = [
  ['format', () => format(file)],
  ['log', (prev) => appendLog('pipeline.log', `${ts()}\t${input.tool_name}\t${file}\tformat=${prev}`)],
];

let prev;
for (const [name, fn] of steps) {
  try {
    prev = fn(prev);
  } catch (e) {
    appendLog('pipeline.log', `${ts()}\t${input.tool_name}\t${file}\tFAILED at ${name}: ${e.message}`);
    process.stderr.write(`[Pipeline] 步驟 ${name} 失敗：${e.message}\n`);
    process.exit(1); // 非阻擋性錯誤，只提示
  }
}
process.exit(0);
