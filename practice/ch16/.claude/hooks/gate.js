// Gate（閘門）：Stop hook。有測試檔且 node --test 失敗 → 回傳 decision:block 讓 Claude 繼續修
// stop_hook_active 為 true 代表已經被擋過一次，直接放行，避免無限迴圈
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { readStdin, PROJECT_DIR, ts, appendLog } = require('./lib');

const input = readStdin();
if (input.stop_hook_active) {
  appendLog('gate.log', `${ts()}\tstop_hook_active=true → 放行（防無限迴圈）`);
  process.exit(0);
}

// 找測試檔：*.test.js / *.spec.js / test 目錄，略過 node_modules 與 .claude
function findTests(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.claude'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) findTests(p, out);
    else if (/\.(test|spec)\.(c|m)?js$/.test(ent.name)) out.push(p);
  }
  return out;
}

let tests;
try {
  tests = findTests(PROJECT_DIR);
} catch (e) {
  // 掃描失敗時寧可放行，也不要讓 Stop hook 卡死 session
  appendLog('gate.log', `${ts()}	掃描測試檔失敗（${e.message}）→ 放行`);
  process.exit(0);
}
if (tests.length === 0) {
  appendLog('gate.log', `${ts()}\t無測試檔 → 放行`);
  process.exit(0);
}

const r = spawnSync(process.execPath, ['--test', ...tests], { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 60000 });
if (r.status === 0) {
  appendLog('gate.log', `${ts()}\t${tests.length} 個測試檔全數通過 → 放行`);
  process.exit(0);
}

const tail = ((r.stdout || '') + (r.stderr || '')).split('\n').slice(-30).join('\n');
appendLog('gate.log', `${ts()}\t測試失敗 → block`);
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: `[Gate] node --test 失敗，請修正程式碼讓測試通過後再結束。\n${tail}`,
}));
process.exit(0);
