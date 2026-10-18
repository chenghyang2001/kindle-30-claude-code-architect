"""PreToolUse 掛鉤：禁止 git push --force / -f；--force-with-lease 放行。"""
import json
import re
import shlex
import sys


def is_force_push(command: str) -> bool:
    # 以 ; && || | 切成多段，逐段檢查
    for segment in re.split(r"&&|\|\||[;|\n]", command):
        try:
            tokens = shlex.split(segment)
        except ValueError:
            tokens = segment.split()
        if "git" not in tokens or "push" not in tokens:
            continue
        args = tokens[tokens.index("push") + 1:]
        for a in args:
            if a == "--force":
                return True
            # 短旗標叢集，如 -f、-fu、-uf
            if re.fullmatch(r"-[a-zA-Z]*f[a-zA-Z]*", a):
                return True
            # +refspec 也是強推
            if a.startswith("+") and len(a) > 1:
                return True
    return False


def main() -> int:
    data = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    if data.get("tool_name") != "Bash":
        return 0
    command = data.get("tool_input", {}).get("command", "")
    if is_force_push(command):
        sys.stderr.write("[block_force_push] 禁止強制推送；如確有需要請改用 --force-with-lease。\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
