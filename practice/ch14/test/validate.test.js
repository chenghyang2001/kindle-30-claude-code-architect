// src/validate.js 的單元測試（node:test + node:assert/strict）
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isValidEmail, isStrongPassword } = require("../src/validate");

describe("isValidEmail", () => {
  // ---------- happy ----------
  it("should return true when email 是標準格式 user@example.com", () => {
    // Arrange
    const email = "user@example.com";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, true);
  });

  it("should return true when 網域含多層子網域", () => {
    // Arrange
    const email = "first.last@mail.example.co.uk";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, true);
  });

  // ---------- edge ----------
  it("should return true when @ 前後各只有最少字元 a@b.c", () => {
    // Arrange
    const email = "a@b.c";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, true);
  });

  it("should return false when 輸入為空字串", () => {
    // Arrange
    const email = "";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 只有空白字元", () => {
    // Arrange
    const email = "   ";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when @ 前為空", () => {
    // Arrange
    const email = "@example.com";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when @ 後為空", () => {
    // Arrange
    const email = "user@";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 網域不含 .", () => {
    // Arrange
    const email = "user@localhost";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 網域以 . 開頭", () => {
    // Arrange
    const email = "user@.example.com";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 網域以 . 結尾", () => {
    // Arrange
    const email = "user@example.";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 沒有 @", () => {
    // Arrange
    const email = "user.example.com";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 含兩個 @", () => {
    // Arrange
    const email = "a@b@example.com";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 只有一個 @ 符號", () => {
    // Arrange
    const email = "@";
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  // ---------- error（非字串回傳 false、不拋錯）----------
  it("should return false when 輸入為 null", () => {
    // Arrange
    const email = null;
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 輸入為 undefined", () => {
    // Arrange / Act
    const result = isValidEmail(undefined);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 輸入為數字", () => {
    // Arrange
    const email = 123;
    // Act
    const result = isValidEmail(email);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 輸入為物件或陣列", () => {
    // Arrange
    const inputs = [{}, ["a@b.com"]];
    // Act
    const results = inputs.map((input) => isValidEmail(input));
    // Assert
    assert.deepEqual(results, [false, false]);
  });

  it("should not throw when 輸入為非字串", () => {
    // Arrange
    const inputs = [null, undefined, 0, NaN, true, Symbol("x")];
    // Act / Assert
    for (const input of inputs) {
      assert.doesNotThrow(() => isValidEmail(input));
    }
  });
});

describe("isStrongPassword", () => {
  // ---------- happy ----------
  it("should return true when 密碼含大小寫與數字且長度足夠", () => {
    // Arrange
    const password = "Abcdefg123";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, true);
  });

  it("should return true when 密碼另含特殊字元", () => {
    // Arrange
    const password = "Abc!@#$%1x";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, true);
  });

  // ---------- edge（長度邊界）----------
  it("should return true when 密碼剛好 8 字元", () => {
    // Arrange
    const password = "Abcdef12";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, true);
  });

  it("should return false when 密碼只有 7 字元", () => {
    // Arrange
    const password = "Abcde12";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, false);
  });

  it("should return true when 密碼剛好 64 字元", () => {
    // Arrange
    const password = "Aa1" + "x".repeat(61);
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(password.length, 64);
    assert.equal(result, true);
  });

  it("should return false when 密碼為 65 字元", () => {
    // Arrange
    const password = "Aa1" + "x".repeat(62);
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(password.length, 65);
    assert.equal(result, false);
  });

  it("should return false when 密碼為空字串", () => {
    // Arrange
    const password = "";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, false);
  });

  // ---------- edge（字元類別缺一）----------
  it("should return false when 缺少大寫字母", () => {
    // Arrange
    const password = "abcdefg123";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 缺少小寫字母", () => {
    // Arrange
    const password = "ABCDEFG123";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 缺少數字", () => {
    // Arrange
    const password = "Abcdefghij";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, false);
  });

  it("should return false when 只有特殊字元", () => {
    // Arrange
    const password = "!@#$%^&*()";
    // Act
    const result = isStrongPassword(password);
    // Assert
    assert.equal(result, false);
  });

  // ---------- error（非字串拋 TypeError）----------
  it("should throw TypeError when 輸入為 null", () => {
    // Arrange / Act / Assert
    assert.throws(() => isStrongPassword(null), TypeError);
  });

  it("should throw TypeError when 輸入為 undefined", () => {
    // Arrange / Act / Assert
    assert.throws(() => isStrongPassword(undefined), TypeError);
  });

  it("should throw TypeError when 輸入為數字", () => {
    // Arrange / Act / Assert
    assert.throws(() => isStrongPassword(12345678), {
      name: "TypeError",
      message: "password must be a string",
    });
  });

  it("should throw TypeError when 輸入為陣列", () => {
    // Arrange / Act / Assert
    assert.throws(() => isStrongPassword(["Abcdef12"]), TypeError);
  });
});
