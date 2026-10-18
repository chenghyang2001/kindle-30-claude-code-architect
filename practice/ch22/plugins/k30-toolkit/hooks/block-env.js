// PreToolUse hook：目標檔名是 .env 或 .env.*（.env.example 除外）時以 exit 2 擋下
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const filePath = (input.tool_input && input.tool_input.file_path) ?? "";
    const base = filePath.split(/[\/]/).pop();
    if (/^\.env(\..+)?$/.test(base) && base !== ".env.example") {
      console.error(`k30-toolkit：禁止存取機密檔 ${base}`);
      process.exit(2);
    }
    process.exit(0);
  } catch (e) {
    // JSON 解析失敗時放行，避免 hook 壞掉卡死所有工具
    console.error(`k30-toolkit hook 解析失敗：${e.message}`);
    process.exit(0);
  }
});
