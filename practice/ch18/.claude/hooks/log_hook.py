"""通用記錄 hook：從 stdin 讀事件 JSON，往指定 log 附加一行。

用法：python log_hook.py <chain|pipeline> <hook名> [sleep秒數]
- chain：寫入 chain.log，格式「開始時間 結束時間 事件 hook名」
- pipeline：寫入 pipeline.log，格式「時間戳 session_id 事件 hook名」
"""
import json
import os
import sys
import time
from datetime import datetime


def now() -> str:
    """回傳毫秒精度的時間戳字串。"""
    return datetime.now().strftime("%H:%M:%S.%f")[:-3]


def main() -> None:
    mode, name = sys.argv[1], sys.argv[2]
    delay = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    event = data.get("hook_event_name", "?")
    sid = data.get("session_id", "?")
    log_dir = os.path.dirname(os.path.abspath(__file__))

    start = now()
    if delay:
        time.sleep(delay)  # 刻意延遲，用來判斷同事件多個 hook 是平行還是依序
    if mode == "chain":
        line = f"{start} {now()} {event} {name}\n"
        path = os.path.join(log_dir, "chain.log")
    else:
        tool = data.get("tool_name", "")
        line = f"{start} {sid} {event} {name} {tool}".rstrip() + "\n"
        path = os.path.join(log_dir, "pipeline.log")
    with open(path, "a", encoding="utf-8") as f:
        f.write(line)


if __name__ == "__main__":
    main()
