"""PreToolUse hook：阻擋 Read/Write/Edit 存取 .env 或 .env.* 檔。

exit 2 = 阻擋這次工具呼叫，stderr 內容會回饋給 Claude 當作原因。
"""
import json
import sys
from pathlib import PurePath


def is_env_file(file_path: str) -> bool:
    name = PurePath(file_path.replace("\\", "/")).name
    return name == ".env" or name.startswith(".env.")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        # 安全 hook 採 fail-closed：看不懂輸入就擋下，而不是放行
        print(f"block_env.py：stdin 不是合法 JSON，保守阻擋：{e}", file=sys.stderr)
        return 2
    tool_input = payload.get("tool_input") or {}
    file_path = tool_input.get("file_path") or ""
    if file_path and is_env_file(file_path):
        tool = payload.get("tool_name", "?")
        print(
            f"已阻擋：{tool} 不可存取機密檔 {PurePath(file_path).name}（.env / .env.* 受 block_env hook 保護）",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
