# scorpk-cli

Agente de IA para programar desde la terminal — mismo motor de tools
(archivos, git, terminal, búsqueda) y los mismos proveedores que la
[extensión de VS Code de Scorpk](https://github.com/ScorpkID/scorpk),
portado a Node puro, con una sesión de chat interactiva real (banner de
sesión, menú de comandos con `/`, diffs con color, selección de modelo).

## Instalación

Necesitás [Node.js](https://nodejs.org) **22 o más nuevo** (lo pide Ink,
la librería que usa la interfaz del chat).

```bash
npm install -g scorpk
```

### El comando `scorpk` no se reconoce después de instalar

Casi siempre es que la carpeta de binarios globales de npm no está en el
PATH todavía:

1. **Cerrá y abrí de nuevo la terminal** — sobre todo en Windows, una
   consola ya abierta no ve un PATH actualizado.
2. Si sigue sin andar, corré `npm config get prefix` para ver dónde npm
   pone los comandos globales, y confirmá que esa carpeta (o
   `<prefix>/bin` en Mac/Linux) esté en tu PATH.
3. Mientras tanto, `npx scorpk <comando>` funciona sin depender del
   PATH — por ejemplo `npx scorpk chat`.

## Uso

```bash
scorpk config set-key anthropic sk-ant-...
```

Después de guardar la key, te ofrece elegir el modelo de una lista real
(fetcheada del proveedor en el momento) — nunca un valor adivinado. Si en
algún momento querés ver esa lista de nuevo: `scorpk models [proveedor]`.

```bash
scorpk run "agregá un endpoint /health que devuelva 200"
scorpk chat
```

`run` corre una tarea puntual y muestra los cambios con color antes de
aplicarlos (`--yes` para saltear la confirmación). `chat` abre una sesión
interactiva persistente con:

- Banner con tu proveedor/modelo activos, cuenta (si iniciaste sesión) y
  carpeta actual.
- Comandos desde el chat, escribiendo `/`:
  - `/model` — elegir otro modelo del proveedor activo, en vivo.
  - `/provider` — cambiar a otro proveedor ya configurado.
  - `/mode` (o `ctrl+t`) — alternar entre pedir confirmación por cambio
    (`manual`) y aplicar todo automáticamente (`auto`).
  - `/clear` — vaciar el historial de la sesión.
  - `/help` — ver esta lista sin salir.
  - `/exit` — salir.
- Cada cambio de archivo se muestra en una tarjeta con el diff en color;
  Enter/`y` aprueba, Esc/`n` rechaza.

`scorpk auth login` conecta con la misma cuenta de scorpk.tech que la
extensión (abre el navegador, un servidor local efímero recibe la vuelta)
— hoy solo identifica el plan Free/Pro para lo que viene después (Modo
equipo, servidores MCP); usar `run`/`chat` no depende de estar logueado,
solo de tener un proveedor configurado con `config set-key`.

## Qué falta (fuera de esta versión)

Modo equipo, servidores MCP activos en una corrida, `go_to_definition`/
diagnósticos (dependen del language server vivo de un editor), y el login
de Hugging Face.

## Desarrollo (contribuir a este repo)

```bash
npm install
npm run build
npm link   # deja `scorpk` disponible global apuntando a este checkout
```
