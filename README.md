# BootAI TeamIDE Plugin

Chat interface for [BootAI](https://github.com/dcherrera/bootai) and any OpenAI-compatible LLM endpoint. Built as a [TeamIDE](https://teamide.app) plugin with Quasar components.

## Features

- **Streaming chat** — real-time token streaming via SSE (Server-Sent Events)
- **Multi-endpoint** — connect to multiple LLM servers, switch between them
- **Per-endpoint conversations** — separate chat history for each endpoint
- **Connection testing** — verify endpoint connectivity before chatting
- **Persistent state** — all settings and conversations saved to localStorage
- **Zero runtime dependencies** — raw `fetch()` + SSE parsing, nothing to break

## Screenshot

```
┌──────────────┬──────────────────────────────┬──────────────┐
│  ChatNav     │  ChatMain                    │ ChatContext   │
│              │                              │              │
│ Endpoints:   │  ┌─────────────────────────┐ │ Endpoint:    │
│ [Dell E6510] │  │ You: hello               │ │ ● Dell E6510 │
│              │  │                          │ │              │
│ Conversations│  │ BootAI: Your sentence    │ │ URL:         │
│ [+ New Chat] │  │ effectively conveys...   │ │ 192.168.1.85 │
│              │  │                          │ │              │
│ > Chat 1     │  │ ● Streaming... (19s)     │ │ Model:       │
│   Chat 2     │  │                          │ │ smollm2-135m │
│              │  └─────────────────────────┘ │              │
│              │                              │ Temp: [0.7]  │
│              │  ┌─────────────────────────┐ │ Tokens: [256]│
│              │  │ Type a message...   [⏎] │ │              │
│              │  └─────────────────────────┘ │ [+ Add New]  │
│              │                              │ [Test]  ●    │
└──────────────┴──────────────────────────────┴──────────────┘
```

## Install

Clone or copy the plugin folder into your TeamIDE plugins directory. No build step required — `dist/index.js` is pre-built and committed.

```bash
# Clone directly
git clone https://github.com/dcherrera/BootAI-TeamIDE-Pluggin.git

# Or as a submodule
git submodule add https://github.com/dcherrera/BootAI-TeamIDE-Pluggin.git
```

Open TeamIDE and the "BootAI Chat" module appears in the sidebar with a robot icon.

## Compatible Endpoints

Works with any server that implements the OpenAI chat completions API (`/v1/chat/completions` with SSE streaming):

- **BootAI** — bare-metal UEFI AI inference
- **Ollama** — `http://localhost:11434/v1`
- **LM Studio** — `http://localhost:1234/v1`
- **vLLM** — `http://localhost:8000/v1`
- **LocalAI** — `http://localhost:8080/v1`
- **OpenAI** — `https://api.openai.com/v1` (requires API key)
- Any other OpenAI-compatible server

## Development

```bash
cd BootAI-TeamIDE-Pluggin

# Install dev dependencies
npm install

# Build dist/index.js
npm run build

# Watch mode (rebuild on changes)
npm run dev
```

### Architecture

| File | Purpose |
|------|---------|
| `src/index.ts` | Module definition and lifecycle hooks |
| `src/store.ts` | Pinia store — endpoints, conversations, streaming via raw fetch + SSE |
| `src/ChatNav.vue` | Left panel — endpoint switcher and conversation list |
| `src/ChatMain.vue` | Center panel — message bubbles, streaming display, text input |
| `src/ChatContext.vue` | Right panel — endpoint settings, connection test, add/remove |
| `dist/index.js` | Pre-built IIFE bundle (committed, no build step for users) |

### Build Details

- **Format**: IIFE (single file, no module loader needed)
- **Externals**: Vue, Quasar, and Pinia are provided by the TeamIDE host
- **Bundled**: All plugin code compiled into one file, CSS injected by JS
- **Size**: ~33 KB (6.7 KB gzipped)

## License

MIT
