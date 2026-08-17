# scorpk-cli

Agente de IA para programar desde la terminal — mismo motor de tools
(archivos, git, terminal, búsqueda) y los mismos proveedores que la
[extensión de VS Code de Scorpk](https://github.com/ScorpkID/scorpk),
portado a Node puro.

## Instalación (desarrollo)

```bash
npm install
npm run build
npm link   # deja `scorpk` disponible global apuntando a este checkout
```

## Uso

```bash
scorpk config set-key anthropic sk-ant-...
scorpk run "agregá un endpoint /health que devuelva 200"
scorpk chat
```

Cada cambio de archivo se muestra como diff antes de aplicarse; `--yes`
lo aplica todo sin preguntar.

`scorpk auth login` conecta con la misma cuenta de scorpk.tech que la
extensión (abre el navegador, un servidor local efímero recibe la vuelta)
— hoy solo identifica el plan Free/Pro para lo que viene después (Modo
equipo, servidores MCP); correr tareas no depende de estar logueado, solo
de tener un proveedor configurado con `config set-key`.

## Qué falta (fuera del MVP)

Modo equipo, servidores MCP activos en una corrida, `go_to_definition`/
diagnósticos (dependen del language server vivo de un editor), y el login
de Hugging Face. El motor de tool-calling y la mayoría de las tools ya
están listos para eso — ver el mapeo de portabilidad en el historial del
proyecto.
