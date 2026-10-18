"""簡單問候工具：示範 commit-message skill 用的小檔案"""
import sys


def greet(name: str) -> str:
    """回傳問候語；空名字時改用「訪客」避免輸出空白。"""
    clean_name = name.strip() if name is not None else ""
    return f"哈囉，{clean_name or '訪客'}！"


if __name__ == "__main__":
    assert greet("Peter") == "哈囉，Peter！"
    assert greet("  ") == "哈囉，訪客！"
    print(greet(sys.argv[1] if len(sys.argv) > 1 else ""))
