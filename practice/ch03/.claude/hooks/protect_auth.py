"""PreToolUse hook：禁止 Write/Edit 修改 auth/ 底下的檔案。"""
import json
import os
import sys
from pathlib import PurePath


def is_under_auth(file_path: str, project_dir: str) -> bool:
    """判斷 file_path 是否位於專案的 auth/ 目錄底下（支援絕對/相對、正反斜線）。"""
    normalized = file_path.replace("\\", "/")
    root = project_dir.replace("\\", "/").rstrip("/")
    # 絕對路徑先轉成相對專案根目錄，比對時忽略大小寫（Windows 路徑不分大小寫）
    if root and normalized.lower().startswith(root.lower() + "/"):
        normalized = normalized[len(root) + 1:]
    parts = PurePath(normalized).parts
    return len(parts) > 0 and parts[0].lower() == "auth"


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        # 解析失敗不擋，避免 hook 壞掉時卡死所有寫檔
        print(f"protect_auth: 無法解析 stdin JSON：{e}", file=sys.stderr)
        sys.exit(0)

    file_path = (payload.get("tool_input") or {}).get("file_path")
    if file_path is None:
        sys.exit(0)

    project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
    if is_under_auth(file_path, project_dir):
        print(f"🚫 已阻擋：auth/ 目錄受保護，禁止修改 {file_path}", file=sys.stderr)
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    main()
