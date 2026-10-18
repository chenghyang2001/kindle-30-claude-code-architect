"""故意寫壞的小程式，給 code-reviewer 子代理練習用（第 10 章演練）。"""
import requests

API_KEY = "sk-live-1234567890abcdef"  # 問題：硬編碼 API key


def average(numbers):
    # 問題：空 list 會除以零
    return sum(numbers) / len(numbers)


def add_item(item, bucket=[]):
    # 問題：可變預設參數，多次呼叫會共用同一個 list
    bucket.append(item)
    return bucket


def fetch_price(symbol):
    try:
        resp = requests.get(
            f"https://api.example.com/price?symbol={symbol}&key={API_KEY}"
        )
        return resp.json()["price"]
    except:  # 問題：裸 except 吞掉所有錯誤
        return 0


if __name__ == "__main__":
    print(average([1, 2, 3]))
    print(add_item("a"))
    print(add_item("b"))  # 預期 ['b']，實際 ['a', 'b']
    print(average([]))  # ZeroDivisionError
