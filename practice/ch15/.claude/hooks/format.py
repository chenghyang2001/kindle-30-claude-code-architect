"""PostToolUse hook：Write/Edit 後自動格式化 .py / .js 檔。

stdin 收到 Claude Code 傳來的 JSON，從 tool_input.file_path 取得目標檔。
格式化失敗不該中斷 Claude 的工作，所以一律 exit 0，只在 stderr 留訊息。
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path


def strip_trailing_whitespace(path: Path) -> bool:
    """去行尾空白並確保結尾恰有一個換行；回傳是否有變更。"""
    original = path.read_text(encoding="utf-8")
    lines = [line.rstrip() for line in original.splitlines()]
    cleaned = "\n".join(lines).rstrip("\n") + "\n" if lines else ""
    if cleaned != original:
        path.write_text(cleaned, encoding="utf-8", newline="\n")
        return True
    return False


def run_tool(cmd: list[str]) -> bool:
    """執行外部格式化工具，成功回傳 True。"""
    try:
        proc = subprocess.run(cmd, capture_output=True, encoding="utf-8", timeout=60)
        return proc.returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def format_python(path: Path) -> str:
    # ruff format 會連行尾空白一起處理；沒裝 ruff 才退回簡易清理
    if run_tool([sys.executable, "-m", "ruff", "format", str(path)]):
        return "ruff format"
    strip_trailing_whitespace(path)
    return "strip-whitespace"


def format_js(path: Path) -> str:
    npx = shutil.which("npx")
    # --no-install：本機沒有 prettier 就直接失敗，避免 hook 偷偷上網下載
    if npx and run_tool([npx, "--no-install", "prettier", "--write", str(path)]):
        return "prettier"
    strip_trailing_whitespace(path)
    return "strip-whitespace"


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"format.py：stdin 不是合法 JSON：{e}", file=sys.stderr)
        return 0
    file_path = (payload.get("tool_input") or {}).get("file_path")
    if not file_path:
        return 0
    path = Path(file_path)
    if not path.is_file():
        return 0
    try:
        if path.suffix == ".py":
            method = format_python(path)
        elif path.suffix in (".js", ".mjs", ".cjs"):
            method = format_js(path)
        else:
            return 0
    except (OSError, UnicodeDecodeError) as e:
        print(f"format.py：格式化 {path} 失敗：{e}", file=sys.stderr)
        return 0
    print(f"format.py：已用 {method} 格式化 {path.name}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
