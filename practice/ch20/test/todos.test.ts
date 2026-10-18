import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { startServer, sendJson } from "./helpers.ts";

let base: string;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ base, close } = await startServer());
});
afterEach(async () => close());

describe("happy path", () => {
  it("GET /todos 初始為空陣列", async () => {
    const res = await fetch(`${base}/todos`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });

  it("POST 建立 → GET 列表與單筆 → DELETE 刪除", async () => {
    const created = await sendJson(base, "/todos", { title: "買牛奶" });
    assert.equal(created.status, 201);
    const todo = await created.json();
    assert.equal(todo.title, "買牛奶");
    assert.equal(todo.done, false);
    assert.equal(typeof todo.id, "number");

    const list = await (await fetch(`${base}/todos`)).json();
    assert.equal(list.length, 1);

    assert.equal((await fetch(`${base}/todos/${todo.id}`)).status, 200);

    const del = await fetch(`${base}/todos/${todo.id}`, { method: "DELETE" });
    assert.equal(del.status, 204);
    assert.deepEqual(await (await fetch(`${base}/todos`)).json(), []);
  });
});

describe("edge cases", () => {
  it("title 前後空白會被修剪", async () => {
    const todo = await (
      await sendJson(base, "/todos", { title: "  寫測試  " })
    ).json();
    assert.equal(todo.title, "寫測試");
  });

  it("title 剛好 200 字可接受、201 字拒絕", async () => {
    assert.equal(
      (await sendJson(base, "/todos", { title: "a".repeat(200) })).status,
      201,
    );
    assert.equal(
      (await sendJson(base, "/todos", { title: "a".repeat(201) })).status,
      400,
    );
  });

  it("中文與 emoji 標題正確往返", async () => {
    const todo = await (
      await sendJson(base, "/todos", { title: "繳費 💸" })
    ).json();
    const got = await (await fetch(`${base}/todos/${todo.id}`)).json();
    assert.equal(got.title, "繳費 💸");
  });

  it("刪除後 id 不會被重用", async () => {
    const a = await (await sendJson(base, "/todos", { title: "a" })).json();
    await fetch(`${base}/todos/${a.id}`, { method: "DELETE" });
    const b = await (await sendJson(base, "/todos", { title: "b" })).json();
    assert.notEqual(a.id, b.id);
  });
});

describe("error cases", () => {
  const badBodies: Array<[string, unknown]> = [
    ["缺 title", {}],
    ["title 非字串", { title: 123 }],
    ["title 空白", { title: "   " }],
    ["body 是陣列", [{ title: "x" }]],
    ["JSON 壞掉", "{not json"],
    ["空 body", ""],
  ];
  for (const [name, body] of badBodies) {
    it(`POST 400：${name}`, async () => {
      const res = await sendJson(base, "/todos", body);
      assert.equal(res.status, 400);
      assert.equal(typeof (await res.json()).error, "string");
    });
  }

  it("GET/DELETE 不存在的 id → 404", async () => {
    assert.equal((await fetch(`${base}/todos/999`)).status, 404);
    assert.equal(
      (await fetch(`${base}/todos/999`, { method: "DELETE" })).status,
      404,
    );
  });

  it("非法 id（abc、0、-1、1.5）→ 400", async () => {
    for (const id of ["abc", "0", "-1", "1.5"]) {
      assert.equal(
        (await fetch(`${base}/todos/${id}`)).status,
        400,
        `id=${id}`,
      );
    }
  });

  it("未知路徑 → 404，不支援方法 → 405", async () => {
    assert.equal((await fetch(`${base}/nope`)).status, 404);
    assert.equal((await fetch(`${base}/todos`, { method: "PUT" })).status, 405);
  });

  it("超大 body → 413", async () => {
    const res = await sendJson(base, "/todos", { title: "x".repeat(20_000) });
    assert.equal(res.status, 413);
  });
});
