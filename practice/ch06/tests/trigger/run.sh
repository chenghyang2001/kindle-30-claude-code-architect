#!/bin/bash
# 用法：run.sh <輸出目錄標籤>；平行跑 5 個 prompt，保存 stream-json
set -uo pipefail
S="$(cd "$(dirname "$0")" && pwd)"; TAG="$1"; mkdir -p "$S/out-$TAG"
cd "$HOME/workspace/k30-ch06-practice" || { echo "找不到專案目錄"; exit 1; }
for f in "$S"/[PN][0-9].txt; do
  id=$(basename "$f" .txt)
  ( env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT claude -p "$(cat "$f")" \
      --output-format stream-json --verbose --max-turns 4 --disallowedTools Write Edit NotebookEdit Bash \
      > "$S/out-$TAG/$id.jsonl" 2> "$S/out-$TAG/$id.err" ) &
done
wait
for f in "$S/out-$TAG"/*.jsonl; do
  id=$(basename "$f" .jsonl)
  skills=$(grep -o '"name":"Skill","input":{"skill":"[^"]*"' "$f" | sed 's/.*"skill":"//;s/"//' | sort -u | tr '\n' ',')
  fmt=$(grep -c '根本原因' "$f")
  echo "$id skills=[${skills}] 含四段格式=$([ "$fmt" -gt 0 ] && echo Y || echo N)"
done
