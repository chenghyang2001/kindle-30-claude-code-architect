"""PreToolUse 掛鉤：攔截具破壞性的 Bash 指令。

擋下：rm -rf /（含 ~、/*、$HOME）、mkfs、dd if=、fork bomb、chmod -R 777。
擋下時以 exit code 2 結束，stderr 內容會回饋給 Claude。
"""
import json
import re
import sys

DANGEROUS_PATTERNS = [
    # rm 同時帶遞迴與強制旗標，且目標是根目錄、家目錄或 /*
    (r"\brm\s+(?:-[a-zA-Z]*\s+)*-[a-zA-Z]*(?:r[a-zA-Z]*f|f[a-zA-Z]*r)[a-zA-Z]*\s+(?:--no-preserve-root\s+)?(?:/\*?|~/?|\$HOME/?)(?:\s|$|;|&|\||['\"`)])",
     "rm -rf 指向根目錄／家目錄"),
    (r"\brm\s+-[rR]\s+-f\s+/(?:\s|$|['\"`)])|\brm\s+-f\s+-[rR]\s+/(?:\s|$|['\"`)])", "rm -r -f /"),
    (r"\bmkfs(?:\.\w+)?\b", "mkfs 格式化磁碟"),
    (r"\bdd\s+if=", "dd if= 直接寫入裝置"),
    (r":\s*\(\s*\)\s*\{", "fork bomb :(){ :|:& };:"),
    (r"\bchmod\s+(?:-[a-zA-Z]*R[a-zA-Z]*\s+777|777\s+-R)\b", "chmod -R 777"),
]


def main() -> int:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    if data.get("tool_name") != "Bash":
        return 0
    command = data.get("tool_input", {}).get("command", "")
    for pattern, label in DANGEROUS_PATTERNS:
        if re.search(pattern, command):
            sys.stderr.write(f"[block_dangerous] 已攔截危險指令（{label}）：{command}\n")
            return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
