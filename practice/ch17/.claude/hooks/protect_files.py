"""PreToolUse 掛鉤：禁止 Write/Edit 受保護檔案。

受保護：.git/ 目錄內任何檔、各種 lock 檔、*.pem / *.key 憑證、.env。
"""
import fnmatch
import json
import sys

PROTECTED_DIRS = [".git"]
PROTECTED_NAMES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".env"]
PROTECTED_GLOBS = ["*.pem", "*.key", "*.p12"]


def is_protected(path: str) -> str | None:
    """回傳命中的規則說明；未命中回傳 None。"""
    parts = [p for p in path.replace("\\", "/").split("/") if p]
    if not parts:
        return None
    if any(p in PROTECTED_DIRS for p in parts[:-1]):
        return ".git/ 目錄"
    name = parts[-1]
    if name in PROTECTED_NAMES:
        return name
    for g in PROTECTED_GLOBS:
        if fnmatch.fnmatch(name.lower(), g):
            return g
    return None


def main() -> int:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    if data.get("tool_name") not in ("Write", "Edit", "MultiEdit"):
        return 0
    path = data.get("tool_input", {}).get("file_path", "")
    rule = is_protected(path)
    if rule:
        sys.stderr.write(f"[protect_files] 受保護檔案（{rule}），禁止修改：{path}\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
