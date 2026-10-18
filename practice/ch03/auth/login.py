"""示範用登入模組（受 hook 保護，不可被 Claude 修改）。"""
import os


def login(username: str, password: str) -> bool:
    """比對環境變數中的帳密（示範用）。"""
    expected_user = os.environ.get("APP_USER")
    expected_pass = os.environ.get("APP_PASS")
    if expected_user is None or expected_pass is None:
        raise RuntimeError("缺少環境變數 APP_USER / APP_PASS")
    return username == expected_user and password == expected_pass
