// 示範用工具模組（第 12 章演練：故意埋入問題）
const fs = require("fs");
const path = require("path");

// 同步讀取整個大型 log 檔 —— 會阻塞 event loop，且未處理檔案不存在
function loadLog(fileName) {
  const content = fs.readFileSync(
    path.join(__dirname, "..", "logs", fileName),
    "utf8",
  );
  return content.split("\n");
}

// 解析設定 —— JSON.parse 未包 try/catch，格式錯就整個程序崩潰
function parseConfig(raw) {
  const config = JSON.parse(raw);
  return config.settings.timeout;
}

// 讀取使用者指定的檔案 —— 路徑未檢查（路徑穿越）
function readUserFile(userPath) {
  return fs.readFileSync("./uploads/" + userPath, "utf8");
}

// 非同步任務未 await、未 catch —— 未處理的 Promise rejection
function fireAndForget(task) {
  task().then((r) => console.log("done", r));
}

// 每次呼叫都重新讀檔計數 —— 迴圈內重複 I/O
function countErrors(files) {
  let total = 0;
  for (const f of files) {
    const lines = loadLog(f);
    for (const line of lines) {
      if (line.includes("ERROR")) total++;
    }
  }
  return total;
}

module.exports = {
  loadLog,
  parseConfig,
  readUserFile,
  fireAndForget,
  countErrors,
};
