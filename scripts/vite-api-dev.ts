// Serves the /api/* Vercel functions inside `vite dev`, so the whole app runs
// locally with one command. Each api/<name>.ts exports Web-standard handlers
// (GET/POST taking a Request and returning a Response), exactly as on Vercel.
import type { Plugin } from "vite";
import { loadEnv } from "vite";

export function apiDevServer(): Plugin {
  return {
    name: "brook-api-dev",
    configureServer(server) {
      Object.assign(process.env, loadEnv("development", process.cwd(), ""));
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const match = url.pathname.match(/^\/api\/([a-z-]+)$/);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          const handler = mod[req.method ?? "GET"];
          if (typeof handler !== "function") {
            res.statusCode = 405;
            return res.end("Method not allowed");
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers.set(k, v);
          }
          headers.set("x-forwarded-for", req.socket.remoteAddress ?? "127.0.0.1");
          const request = new Request(url, { method: req.method, headers, body });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          console.error(err);
          res.statusCode = 500;
          res.end("Dev API error");
        }
      });
    },
  };
}
