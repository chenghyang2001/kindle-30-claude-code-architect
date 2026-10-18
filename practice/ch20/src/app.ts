// 路由與 HTTP 處理；createApp 不 listen，方便測試在隨機埠啟動
import http from "node:http";
import { TodoStore } from "./store.ts";
import { parseId, validateCreateBody, validateUpdateBody } from "./validate.ts";

const MAX_BODY_BYTES = 10_000;

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload?: unknown,
): void {
  if (payload === undefined) {
    res.writeHead(status).end();
    return;
  }
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "請求內容過大");
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (text.length === 0) throw new HttpError(400, "請求內容不可為空");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "JSON 格式錯誤");
  }
}

function requireId(raw: string): number {
  const id = parseId(raw);
  if (!id.ok) throw new HttpError(400, id.error);
  return id.value;
}

type Handler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: string[],
) => Promise<void> | void;

export function createApp(store: TodoStore = new TodoStore()): http.Server {
  // 路由表：[方法, 路徑正規式, 處理函式]；新增端點只要在這裡加一列
  const routes: Array<[string, RegExp, Handler]> = [
    ["GET", /^\/todos$/, (_req, res) => sendJson(res, 200, store.list())],
    [
      "POST",
      /^\/todos$/,
      async (req, res) => {
        const body = validateCreateBody(await readJson(req));
        if (!body.ok) throw new HttpError(400, body.error);
        sendJson(res, 201, store.create(body.value.title));
      },
    ],
    [
      "GET",
      /^\/todos\/([^/]+)$/,
      (_req, res, [rawId]) => {
        const todo = store.get(requireId(rawId));
        if (!todo) throw new HttpError(404, "找不到該待辦事項");
        sendJson(res, 200, todo);
      },
    ],
    [
      "PATCH",
      /^\/todos\/([^/]+)$/,
      async (req, res, [rawId]) => {
        // 先驗 id 再讀 body，非法 id 不必解析內容
        const id = requireId(rawId);
        const body = validateUpdateBody(await readJson(req));
        if (!body.ok) throw new HttpError(400, body.error);
        const todo = store.update(id, body.value);
        if (!todo) throw new HttpError(404, "找不到該待辦事項");
        sendJson(res, 200, todo);
      },
    ],
    [
      "DELETE",
      /^\/todos\/([^/]+)$/,
      (_req, res, [rawId]) => {
        if (!store.remove(requireId(rawId)))
          throw new HttpError(404, "找不到該待辦事項");
        sendJson(res, 204);
      },
    ],
  ];

  return http.createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    try {
      const pathMatches = routes.filter(([, pattern]) => pattern.test(path));
      if (pathMatches.length === 0) throw new HttpError(404, "找不到路徑");
      const route = pathMatches.find(([method]) => method === req.method);
      if (!route) throw new HttpError(405, "不支援的 HTTP 方法");
      const params = path.match(route[1])!.slice(1);
      await route[2](req, res, params);
    } catch (err) {
      if (err instanceof HttpError) {
        sendJson(res, err.status, { error: err.message });
      } else {
        // 不把內部錯誤細節回給客戶端
        console.error("未預期錯誤：", err);
        sendJson(res, 500, { error: "伺服器內部錯誤" });
      }
    }
  });
}
