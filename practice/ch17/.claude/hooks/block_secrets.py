"""PreToolUse 掛鉤：禁止把機密寫進檔案。

偵測：AWS Access Key ID、PEM 私鑰開頭、硬編碼的 password=。
password 若取自環境變數（os.environ / getenv / process.env / ${VAR}）則放行。
"""
import json
import re
import sys

SECRET_PATTERNS = [
    (r"\bAKIA[0-9A-Z]{16}\b", "AWS Access Key ID"),
    (r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----", "私鑰"),
    (r"(?i)\bpassword\s*=\s*(?!\s*(?:os\.environ|os\.getenv|getenv|process\.env|\$\{|\$[A-Z_]))[\"']?[^\s\"'),;]+",
     "硬編碼 password="),
]


def collect_text(tool_input: dict) -> str:
    """把 Write 的 content、Edit 的 new_string、MultiEdit 的 edits 合併成一段文字。"""
    chunks = [tool_input.get("content", ""), tool_input.get("new_string", "")]
    for edit in tool_input.get("edits", []) or []:
        chunks.append(edit.get("new_string", ""))
    return "\n".join(c for c in chunks if c)


def main() -> int:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    if data.get("tool_name") not in ("Write", "Edit", "MultiEdit"):
        return 0
    text = collect_text(data.get("tool_input", {}))
    for pattern, label in SECRET_PATTERNS:
        if re.search(pattern, text):
            sys.stderr.write(f"[block_secrets] 內容疑似含機密（{label}），已攔截；請改用環境變數。\n")
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
