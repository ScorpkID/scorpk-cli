import * as http from 'http';
import type { AddressInfo } from 'net';

const DONE_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Scorpk</title>
<style>body{font:15px system-ui,sans-serif;background:#0a0a0c;color:#f5f5f6;display:flex;
align-items:center;justify-content:center;height:100vh;margin:0}</style></head>
<body><p>Listo — ya podés volver a la terminal.</p></body></html>`;

export interface PendingCliLogin {
  port: number;
  waitForHandoff: () => Promise<string>;
  close: () => void;
}

/**
 * Levanta un servidor HTTP efímero en 127.0.0.1 para recibir el código de
 * handoff que scorpk.tech redirige de vuelta después del login — mismo
 * patrón que usan `gh auth login`/`vercel login`. Nunca escucha en 0.0.0.0
 * (loopback only), y se cierra apenas recibe la primera request válida.
 */
export function startLocalCallbackServer(): Promise<PendingCliLogin> {
  return new Promise((resolveServer, rejectServer) => {
    let resolveHandoff: (code: string) => void;
    let rejectHandoff: (err: Error) => void;
    const handoffPromise = new Promise<string>((res, rej) => {
      resolveHandoff = res;
      rejectHandoff = rej;
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }
      const handoff = url.searchParams.get('handoff');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(DONE_HTML);
      if (handoff) {
        resolveHandoff(handoff);
      } else {
        rejectHandoff(new Error('El login no devolvió un código válido.'));
      }
      server.close();
    });

    server.on('error', rejectServer);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolveServer({
        port,
        waitForHandoff: () => handoffPromise,
        close: () => server.close(),
      });
    });
  });
}
