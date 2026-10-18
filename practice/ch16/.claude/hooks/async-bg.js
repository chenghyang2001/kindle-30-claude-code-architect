// 背景 hook：async:true 的 PostToolUse，sleep 3 秒後寫 async.log
// 記錄 start / end 時間戳，用來與 pipeline.log 比對是否阻塞主流程
const { readStdin, ts, appendLog } = require('./lib');

const input = readStdin();
const file = (input.tool_input && input.tool_input.file_path) || '-';
const start = ts();
setTimeout(() => {
  appendLog('async.log', `start=${start}\tend=${ts()}\t${input.tool_name}\t${file}`);
  process.exit(0);
}, 3000);
