// PostToolUse（Write|Edit）：輕量格式化（去行尾空白、補結尾換行）＋ .js 語法檢查＋記 log
// 沒裝 prettier，所以用零依賴的最小格式化；語法錯誤時 exit 2 回饋給 Claude
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { writeLog, readStdinJson } = require('./log');

const FORMAT_EXT = new Set(['.js', '.json', '.md']);

function formatFile(file) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(/[ \t]+$/gm, '').replace(/\n*$/, '\n');
  if (after !== before) fs.writeFileSync(file, after, 'utf8');
  return after !== before;
}

function syntaxCheck(file) {
  try {
    execFileSync(process.execPath, ['--check', file], { encoding: 'utf8', stdio: 'pipe' });
    return null;
  } catch (err) {
    return (err.stderr || err.message || '').toString().trim();
  }
}

function main() {
  const input = readStdinJson();
  const file = (input.tool_input || {}).file_path;
  if (!file || !fs.existsSync(file)) {
    writeLog('PostToolUse:skip', `${input.tool_name}\t找不到檔案 ${file}`);
    return;
  }
  const ext = path.extname(file);
  if (!FORMAT_EXT.has(ext)) {
    writeLog('PostToolUse:log', `${input.tool_name}\t${file}`);
    return;
  }
  let changed = false;
  try {
    changed = formatFile(file);
  } catch (err) {
    writeLog('PostToolUse:error', `格式化失敗 ${file}：${err.message}`);
  }
  const syntaxErr = ext === '.js' ? syntaxCheck(file) : null;
  writeLog('PostToolUse:format', `${input.tool_name}\t${file}\tformatted=${changed}\tsyntax=${syntaxErr ? 'FAIL' : 'ok'}`);
  if (syntaxErr) {
    process.stderr.write(`[post-write] ${file} 語法錯誤：\n${syntaxErr}\n`);
    process.exit(2);
  }
}

if (require.main === module) main();
