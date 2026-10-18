// 測試輔助：每個測試開一個獨立 server（埠 0 = 隨機），用完關閉
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.ts";

export async function startServer(): Promise<{
  base: string;
  close: () => Promise<void>;
}> {
  const server = createApp();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      ),
  };
}

export function sendJson(
  base: string,
  path: string,
  body: unknown,
  method = "POST",
): Promise<Response> {
  return fetch(base + path, {
    method,
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
