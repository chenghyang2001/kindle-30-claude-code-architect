"""示範用應用程式（故意放入資安問題供審查）。"""
import sqlite3

DB_PASSWORD = "SuperSecret123!"  # 故意的硬編碼密碼


def find_user(conn: sqlite3.Connection, name: str):
    # 故意的 SQL 注入：字串組合
    cursor = conn.execute(f"SELECT * FROM users WHERE name = '{name}'")
    return cursor.fetchall()


if __name__ == "__main__":
    conn = sqlite3.connect(":memory:")
    conn.execute("CREATE TABLE users (name TEXT)")
    print(find_user(conn, "alice"))
