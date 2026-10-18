import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { startServer, sendJson } from "./helpers.ts";

let base: string;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ base, close } = await startServer());
});
afterEach(async () => close());

async function createTodo(title = "原標題"): Promise<{ id: number }> {
  return (await sendJson(base, "/todos", { title })).json();
}

function patch(path: string, body: unknown): Promise<Response> {
  return sendJson(base, path, body, "PATCH");
}

describe("PATCH /todos/:id", () => {
  describe("happy path", () => {
    it("只更新 title，done 維持不變", async () => {
      const { id } = await createTodo();
      const res = await patch(`/todos/${id}`, { title: "新標題" });
      assert.equal(res.status, 200);
      const updated = await res.json();
      assert.equal(updated.title, "新標題");
      assert.equal(updated.done, false);

      const got = await (await fetch(`${base}/todos/${id}`)).json();
      assert.equal(got.title, "新標題");
    });

    it("只更新 done，title 維持不變", async () => {
      const { id } = await createTodo();
      const res = await patch(`/todos/${id}`, { done: true });
      assert.equal(res.status, 200);
      const got = await (await fetch(`${base}/todos/${id}`)).json();
      assert.equal(got.done, true);
      assert.equal(got.title, "原標題");
    });

    it("同時更新 title 與 done，id 與 createdAt 不變", async () => {
      const original = await (
        await sendJson(base, "/todos", { title: "a" })
      ).json();
      const updated = await (
        await patch(`/todos/${original.id}`, { title: "b", done: true })
      ).json();
      assert.deepEqual(updated, { ...original, title: "b", done: true });
    });
  });

  describe("edge cases", () => {
    it("title 前後空白會被修剪", async () => {
      const { id } = await createTodo();
      const updated = await (
        await patch(`/todos/${id}`, { title: "  修剪我  " })
      ).json();
      assert.equal(updated.title, "修剪我");
    });

    it("title 剛好 200 字可接受、201 字拒絕且不改動資料", async () => {
      const { id } = await createTodo();
      assert.equal(
        (await patch(`/todos/${id}`, { title: "a".repeat(200) })).status,
        200,
      );
      assert.equal(
        (await patch(`/todos/${id}`, { title: "b".repeat(201) })).status,
        400,
      );
      const got = await (await fetch(`${base}/todos/${id}`)).json();
      assert.equal(got.title, "a".repeat(200));
    });

    it("中文與 emoji 標題正確往返", async () => {
      const { id } = await createTodo();
      await patch(`/todos/${id}`, { title: "繳費 💸" });
      const got = await (await fetch(`${base}/todos/${id}`)).json();
      assert.equal(got.title, "繳費 💸");
    });

    it("重複送相同內容仍回 200（冪等），done 可改回 false", async () => {
      const { id } = await createTodo();
      for (let i = 0; i < 2; i++) {
        assert.equal((await patch(`/todos/${id}`, { done: true })).status, 200);
      }
      const back = await (await patch(`/todos/${id}`, { done: false })).json();
      assert.equal(back.done, false);
    });

    it("只更新目標 todo，不影響其他筆", async () => {
      const a = await createTodo("a");
      const b = await createTodo("b");
      await patch(`/todos/${a.id}`, { done: true });
      const gotB = await (await fetch(`${base}/todos/${b.id}`)).json();
      assert.equal(gotB.done, false);
    });
  });

  describe("error cases", () => {
    const badBodies: Array<[string, unknown]> = [
      ["空物件", {}],
      ["未知欄位", { priority: 1 }],
      ["合法欄位混未知欄位", { title: "x", extra: true }],
      ["title 非字串", { title: 123 }],
      ["title 空白", { title: "   " }],
      ["title 為 null", { title: null }],
      ["done 非布林（字串）", { done: "true" }],
      ["done 非布林（數字）", { done: 1 }],
      ["body 是陣列", [{ done: true }]],
      ["body 是 null", "null"],
      ["JSON 壞掉", "{not json"],
      ["空 body", ""],
    ];
    for (const [name, body] of badBodies) {
      it(`400：${name}`, async () => {
        const { id } = await createTodo();
        const res = await patch(`/todos/${id}`, body);
        assert.equal(res.status, 400);
        assert.equal(typeof (await res.json()).error, "string");
      });
    }

    it("驗證失敗時資料不被部分更新", async () => {
      const { id } = await createTodo();
      await patch(`/todos/${id}`, { done: true, title: "" });
      const got = await (await fetch(`${base}/todos/${id}`)).json();
      assert.equal(got.done, false);
      assert.equal(got.title, "原標題");
    });

    it("不存在的 id → 404", async () => {
      const res = await patch("/todos/999", { done: true });
      assert.equal(res.status, 404);
      assert.equal(typeof (await res.json()).error, "string");
    });

    it("非法 id（abc、0、-1、1.5）→ 400", async () => {
      for (const id of ["abc", "0", "-1", "1.5"]) {
        const res = await patch(`/todos/${id}`, { done: true });
        assert.equal(res.status, 400, `id=${id}`);
        assert.equal(typeof (await res.json()).error, "string");
      }
    });

    it("PATCH /todos（集合路徑）→ 405", async () => {
      const res = await patch("/todos", { done: true });
      assert.equal(res.status, 405);
    });

    it("超大 body → 413", async () => {
      const { id } = await createTodo();
      const res = await patch(`/todos/${id}`, { title: "x".repeat(20_000) });
      assert.equal(res.status, 413);
    });
  });
});
