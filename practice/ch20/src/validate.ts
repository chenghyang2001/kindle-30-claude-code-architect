// 輸入驗證：回傳 { ok: true, value } 或 { ok: false, error }，不丟例外，讓路由層統一轉 400
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_TITLE_LENGTH = 200;

export function parseId(raw: string): Result<number> {
  if (!/^[1-9]\d*$/.test(raw)) return { ok: false, error: "id 必須是正整數" };
  return { ok: true, value: Number(raw) };
}

export function validateTitle(title: unknown): Result<string> {
  if (typeof title !== "string")
    return { ok: false, error: "title 必須是字串" };
  const trimmed = title.trim();
  if (trimmed.length === 0) return { ok: false, error: "title 不可為空" };
  if (trimmed.length > MAX_TITLE_LENGTH)
    return { ok: false, error: `title 不可超過 ${MAX_TITLE_LENGTH} 字` };
  return { ok: true, value: trimmed };
}

export function validateCreateBody(body: unknown): Result<{ title: string }> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "請求內容必須是 JSON 物件" };
  }
  const title = validateTitle((body as Record<string, unknown>).title);
  if (!title.ok) return title;
  return { ok: true, value: { title: title.value } };
}

const UPDATABLE_FIELDS = new Set(["title", "done"]);

export function validateUpdateBody(
  body: unknown,
): Result<{ title?: string; done?: boolean }> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "請求內容必須是 JSON 物件" };
  }
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  // 拒絕未知欄位，避免使用者打錯欄位名卻以為更新成功
  const unknown = keys.find((key) => !UPDATABLE_FIELDS.has(key));
  if (unknown !== undefined)
    return { ok: false, error: `不支援的欄位：${unknown}` };
  if (keys.length === 0)
    return { ok: false, error: "至少要提供 title 或 done 其中一個欄位" };

  const changes: { title?: string; done?: boolean } = {};
  if ("title" in record) {
    const title = validateTitle(record.title);
    if (!title.ok) return title;
    changes.title = title.value;
  }
  if ("done" in record) {
    if (typeof record.done !== "boolean")
      return { ok: false, error: "done 必須是布林值" };
    changes.done = record.done;
  }
  return { ok: true, value: changes };
}
