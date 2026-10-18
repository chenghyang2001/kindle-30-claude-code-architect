// 進入點：npm start
import { createApp } from "./app.ts";

const port = Number(process.env.PORT ?? 3000);
const server = createApp();
server.on("error", (err) => {
  console.error(`伺服器啟動失敗（port ${port}）：`, err.message);
  process.exit(1);
});
server.listen(port, () =>
  console.log(`Todo API 已啟動：http://localhost:${port}`),
);
