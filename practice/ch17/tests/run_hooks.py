"""逐一把測試 JSON 餵給 .claude/hooks/ 的五支腳本，印出結果表。

判定方式：
- exit 2 → 擋（block）
- exit 0 且 stdout JSON 的 permissionDecision == "ask" → 詢問（ask）
- 其他 exit 0 → 放行（allow）
用法：PYTHONUTF8=1 python tests/run_hooks.py
"""
import json
import subprocess
import sys
from pathlib import Path

HOOK_DIR = Path(__file__).resolve().parent.parent / ".claude" / "hooks"

# 機密樣本以字串拼接產生，避免本檔被 block_secrets 自己攔下
FAKE_AWS = "AKIA" + "IOSFODNN7EXAMPLE"
FAKE_PEM = "-----BEGIN " + "RSA PRIVATE KEY-----\nMIIE..."
FAKE_PWD = "pass" + "word=\"hunter2\""
DANGER_RM = "rm -rf " + "/"


def bash(cmd):
    return {"tool_name": "Bash", "tool_input": {"command": cmd}}


def write(path, content="hello"):
    return {"tool_name": "Write", "tool_input": {"file_path": path, "content": content}}


def edit(path, new):
    return {"tool_name": "Edit", "tool_input": {"file_path": path, "old_string": "x", "new_string": new}}


CASES = [
    # (腳本, 說明, 輸入, 預期)
    ("block_dangerous.py", DANGER_RM, bash(DANGER_RM), "block"),
    ("block_dangerous.py", f"echo '{DANGER_RM}'", bash(f"echo '{DANGER_RM}'"), "block"),
    ("block_dangerous.py", "sudo rm -fr ~", bash("sudo rm -fr ~"), "block"),
    ("block_dangerous.py", "mkfs.ext4 /dev/sda1", bash("mkfs.ext4 /dev/sda1"), "block"),
    ("block_dangerous.py", "dd if=/dev/zero of=/dev/sda", bash("dd if=/dev/zero of=/dev/sda"), "block"),
    ("block_dangerous.py", ":(){ :|:& };:", bash(":(){ :|:& };:"), "block"),
    ("block_dangerous.py", "chmod -R 777 /var", bash("chmod -R 777 /var"), "block"),
    ("block_dangerous.py", "rm -rf ./build", bash("rm -rf ./build"), "allow"),
    ("block_dangerous.py", "ls -la /", bash("ls -la /"), "allow"),
    ("protect_files.py", "Write .git/config", write("/repo/.git/config"), "block"),
    ("protect_files.py", "Edit package-lock.json", edit("C:\\repo\\package-lock.json", "{}"), "block"),
    ("protect_files.py", "Write certs/server.pem", write("certs/server.pem"), "block"),
    ("protect_files.py", "Write src/app.py", write("src/app.py"), "allow"),
    ("protect_files.py", "Write .github/ci.yml", write(".github/ci.yml"), "allow"),
    ("block_secrets.py", "Write 含 AWS key", write("cfg.py", f"KEY='{FAKE_AWS}'"), "block"),
    ("block_secrets.py", "Write 含私鑰", write("id_rsa.txt", FAKE_PEM), "block"),
    ("block_secrets.py", "Edit 硬編碼 password", edit("db.py", FAKE_PWD), "block"),
    ("block_secrets.py", "password 取自環境變數", edit("db.py", "password=os.environ['DB_PW']"), "allow"),
    ("block_secrets.py", "一般程式碼", write("app.py", "print('hi')"), "allow"),
    ("block_force_push.py", "git push --force", bash("git push --force origin main"), "block"),
    ("block_force_push.py", "git push -f", bash("git push -f"), "block"),
    ("block_force_push.py", "git push origin +main", bash("git push origin +main"), "block"),
    ("block_force_push.py", "--force-with-lease", bash("git push --force-with-lease origin main"), "allow"),
    ("block_force_push.py", "git push -u origin feat", bash("git push -u origin feat"), "allow"),
    ("confirm_deploy.py", "npm run deploy", bash("npm run deploy"), "ask"),
    ("confirm_deploy.py", "vercel --prod", bash("vercel --prod"), "ask"),
    ("confirm_deploy.py", "kubectl apply -f k8s.yaml", bash("kubectl apply -f k8s.yaml"), "ask"),
    ("confirm_deploy.py", "kubectl get pods", bash("kubectl get pods"), "allow"),
    ("confirm_deploy.py", "vercel (preview)", bash("vercel"), "allow"),
]


def run(script, payload):
    proc = subprocess.run(
        [sys.executable, str(HOOK_DIR / script)],
        input=json.dumps(payload).encode("utf-8"),
        capture_output=True,
    )
    if proc.returncode == 2:
        return "block"
    if proc.returncode == 0:
        out = proc.stdout.decode("utf-8").strip()
        if out:
            try:
                decision = json.loads(out)["hookSpecificOutput"]["permissionDecision"]
                return decision
            except (ValueError, KeyError):
                return f"bad-json"
        return "allow"
    return f"exit{proc.returncode}"


def main():
    rows, failed = [], 0
    for script, desc, payload, expected in CASES:
        actual = run(script, payload)
        ok = actual == expected
        failed += not ok
        rows.append((script, desc, expected, actual, "✅" if ok else "❌"))
    print("| 腳本 | 輸入 | 預期 | 實際 | 結果 |")
    print("|---|---|---|---|---|")
    for r in rows:
        print("| " + " | ".join(f"`{c}`" if i == 1 else c for i, c in enumerate(r)) + " |")
    print(f"\n共 {len(rows)} 案，通過 {len(rows) - failed}，失敗 {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
