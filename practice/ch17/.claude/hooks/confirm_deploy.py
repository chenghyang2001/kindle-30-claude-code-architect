"""PreToolUse 掛鉤：部署類指令一律要求人工確認。

命中時輸出 JSON（permissionDecision = "ask"），exit 0；未命中則不輸出。
"""
import json
import re
import sys

DEPLOY_PATTERNS = [
    (r"\bdeploy\b", "deploy"),
    (r"\bvercel\b.*--prod\b", "vercel --prod"),
    (r"\bkubectl\s+apply\b", "kubectl apply"),
]


def main() -> int:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    if data.get("tool_name") != "Bash":
        return 0
    command = data.get("tool_input", {}).get("command", "")
    for pattern, label in DEPLOY_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            out = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": f"[confirm_deploy] 偵測到部署指令（{label}），請人工確認：{command}",
                }
            }
            sys.stdout.write(json.dumps(out, ensure_ascii=False))
            return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
