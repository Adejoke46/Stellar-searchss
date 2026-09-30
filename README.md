# 🔍 StellarSearch — Pay-Per-Query Web Search for AI Agents

> **Stellar Hackathon 2026 · Agents on Stellar**
> Zero mock data. Real x402 payments. Real Serper.dev Search. Real Groq AI. Real Freighter wallet.

---

## What it is

StellarSearch is a pay-per-query web search API for autonomous AI agents. Every paid request costs **0.001 USDC**, settled on Stellar in ~5 seconds using the x402 protocol. No subscriptions, no API keys for the end user — agents pay per request and get real web, image, and news results back.

---

## Endpoints

Base URL: `http://localhost:3001` (Express server) or `/api` (Vercel serverless functions).

| Endpoint | Method | Price | Description |
|---|---|---|---|
| `/search` | `GET` | **0.001 USDC** (x402) | Web search via Serper.dev. Params: `q` (required, ≤256 chars), `count` (default 5, max 20), `freshness` (`pd`/`pw`/`pm`), `suggestions=1` for Groq-powered related queries |
| `/images` | `GET` | **0.001 USDC** (x402) | Image search via Serper.dev. Returns `imageUrl`, `thumbnailUrl`, `sourceUrl`, dimensions. Params: `q` (required), `count` (default 10, max 10) |
| `/news` | `GET` | **0.001 USDC** (x402) | News search via Serper.dev. Returns articles with `title`, `url`, `snippet`, `source`, `publishedAt`. Params: `q` (required), `count` (default 10, max 20), `freshness` (`pd`/`pw`/`pm`) |
| `/ai/chat` | `POST` | Free | Groq Llama 3.3 70B assistant. JSON body `{ messages: [...] }`. Streams SSE when `Accept: text/event-stream` or `?stream=1` |
| `/health` | `GET` | Free | Live server stats: uptime, total queries, USDC settled, avg latency, API key configuration status |
| `/` | `GET` | Free | Service metadata and endpoint index |

All three paid routes use the same x402 config — 0.001 USDC, `stellar:testnet`, `payTo` = `STELLAR_RECEIVING_ADDRESS`, settled through the configured facilitator.

```bash
# Paid routes — each returns 402 until paid, then 200 with results
curl "http://localhost:3001/search?q=stellar+x402&count=5"
curl "http://localhost:3001/images?q=stellar+explorer"
curl "http://localhost:3001/news?q=stellar+news&freshness=pw"

# Free routes
curl -X POST http://localhost:3001/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Summarize x402 in one sentence"}]}'
curl http://localhost:3001/health
```

---

## Real stack (no mocks)

| Layer | Real package / service |
|---|---|
| Payment protocol | `@x402/express` + `@x402/stellar` + `@x402/core` |
| Blockchain | Stellar Testnet (via Horizon API) |
| Facilitator | x402 facilitator (`FACILITATOR_URL`, default `https://www.x402.org/facilitator`) |
| Wallet connect | `@stellar/freighter-api` (real Freighter extension) |
| Balances / tx | Stellar Horizon REST API (live, not mocked) |
| Search results | Serper.dev API (real Google search results) |
| AI assistant | `groq-sdk` · Llama 3.3 70B (real Groq API) |
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |

---

## Setup

### 1. Clone and install

```bash
git clone <this-repo>
cd stellar-search
npm install
```

### 2. Get your keys (all free)

| Key | Where to get it |
|---|---|
| `STELLAR_RECEIVING_ADDRESS` | [Stellar Lab](https://laboratory.stellar.org/#account-creator?network=test) — generate + fund testnet keypair |
| `SERPER_API_KEY` | [serper.dev](https://serper.dev/) — free tier: 2.5k queries/month |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) — free |

No facilitator API key is required — `FACILITATOR_URL` defaults to the public
`https://www.x402.org/facilitator` endpoint (see `.env.example`).

### 3. Configure

```bash
cp .env.example .env
# Fill in the keys above
```

### 4. Install Freighter

Install the [Freighter browser extension](https://freighter.app), create a testnet wallet, and fund it with USDC at [Stellar Lab](https://laboratory.stellar.org).

### 5. Run

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm run dev
# → http://localhost:5173
```

### 6. Test the x402 flow

```bash
npm run test:search "Stellar blockchain"
```

---

## How the x402 payment flow works

The same middleware guards all three paid routes — `/search`, `/images`, and `/news`:

```
Agent (wallet)          Server (Express)              Facilitator          Serper.dev
     │                       │                            │                    │
     │── GET /search?q=… ───▶│                            │                    │
     │                       │                            │                    │
     │◀── 402 + payment ─────│  x402 middleware            │                    │
     │    requirements       │  (price/network/payTo)     │                    │
     │                       │                            │                    │
     │  sign Soroban auth entry (Freighter prompt)         │                    │
     │                       │                            │                    │
     │── GET /search ───────▶│                            │                    │
     │   + X-Payment: <sig>  │                            │                    │
     │                       │── verify + settle 0.001 ──▶│                    │
     │                       │       USDC on Stellar      │                    │
     │                       │◀── settlement confirmed ───│                    │
     │                       │── POST /search ─────────────────────────────────▶│
     │◀── 200 + results ────│◀── organic results ──────────────────────────────│
     │   + txHash            │                            │                    │
```

The same handshake applies to `GET /images` and `GET /news` — only the upstream
Serper endpoint changes (`/search`, `/images`, `/news` respectively). `POST /ai/chat`
and `GET /health` are not payment-gated.

```
Claude Code / any MCP client
     │
     ├── web_search      → GET /search  → 0.001 USDC  → Serper.dev /search
     ├── image_search    → GET /images  → 0.001 USDC  → Serper.dev /images
     ├── news_search     → GET /news   → 0.001 USDC  → Serper.dev /news
     ├── ai_summarize    → Groq directly (free)
     ├── check_balance   → Stellar Horizon REST (free)
     └── get_search_stats→ GET /health (free)
```

1. Agent hits a paid route — the `@x402/express` middleware intercepts
2. Returns `HTTP 402 Payment Required` with price + network + `payTo` address
3. The x402 client signs a Soroban authorization entry via Freighter wallet
4. Retries with `X-Payment` header containing the signed entry
5. The facilitator verifies the signature and settles 0.001 USDC on Stellar testnet
6. Server receives confirmation and forwards the query to Serper.dev
7. Results are returned with the `txHash` from the `X-Payment-Response` header

The MCP server sits in front of the same Express routes, so an agent using Claude Code
pays through the identical x402 flow.

---

## Project structure

```
stellar-search/
├── src/                                # React frontend (Vite + TS)
│   ├── App.tsx                         # Router + layout
│   ├── main.tsx                        # Entry point
│   ├── index.css                       # Tailwind entry
│   ├── components/
│   │   ├── ai/
│   │   │   └── GroqAssistant.tsx       # Real Groq AI chat (SSE streaming)
│   │   ├── layout/
│   │   │   ├── AnimatedBackground.tsx  # Canvas animation
│   │   │   ├── Navbar.tsx
│   │   │   ├── LiveTicker.tsx
│   │   │   └── Footer.tsx
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchResults.tsx       # Web / image / news result renderers
│   │   │   ├── SearchSuggestions.tsx   # Groq related-query chips
│   │   │   └── PaymentFlowVisualizer.tsx
│   │   ├── ui/
│   │   │   ├── StatsGrid.tsx           # Polls real /health endpoint
│   │   │   └── ZeroBalanceBanner.tsx
│   │   └── wallet/
│   │       └── WalletPanel.tsx         # Real Freighter connect + live balances
│   ├── hooks/
│   │   ├── useFreighterWallet.ts       # Real Freighter + Horizon integration
│   │   └── useSearch.ts                # Calls /search, /images, /news
│   ├── lib/
│   │   ├── constants.ts                # Network, Horizon, USDC, AMOUNT_USDC
│   │   └── stellar.ts                  # Horizon helpers
│   ├── pages/
│   │   ├── SearchPage.tsx
│   │   ├── DocsPage.tsx
│   │   └── DashboardPage.tsx           # Live Horizon tx history
│   └── types/index.ts
├── server/                             # Express + x402 backend (npm run server)
│   ├── index.ts                        # /search, /images, /news, /ai/chat, /health
│   ├── corsConfig.ts                   # CORS allow-list from env
│   └── logger.ts                       # Winston payment logging
├── api/                                # Vercel serverless mirror of the paid routes
│   ├── index.ts                        # Service metadata
│   ├── search.ts                       # GET /api/search — x402 protected
│   ├── health.ts                       # GET /api/health
│   └── ai/chat.ts                      # POST /api/ai/chat — Groq
├── mcp-server/
│   └── index.ts                        # MCP tools (see below)
├── scripts/
│   ├── setup.sh                        # One-shot env setup
│   └── test-search.ts                  # End-to-end x402 test script
├── public/favicon.svg
├── .env.example
├── claude_mcp.json
└── README.md
```

### MCP tools

`mcp-server/index.ts` exposes six tools to any MCP client:

| Tool | Backing route | Price |
|---|---|---|
| `web_search` | `GET /search` | 0.001 USDC |
| `image_search` | `GET /images` | 0.001 USDC |
| `news_search` | `GET /news` | 0.001 USDC |
| `ai_summarize` | Groq API directly | Free |
| `check_balance` | Stellar Horizon REST | Free |
| `get_search_stats` | `GET /health` | Free |

---

## Claude Code / MCP integration

```json
// claude_mcp.json
{
  "mcpServers": {
    "stellar-search": {
      "command": "npx",
      "args": ["tsx", "./mcp-server/index.ts"],
      "env": {
        "GROQ_API_KEY": "your_groq_api_key",
        "SEARCH_API_URL": "http://localhost:3001"
      }
    }
  }
}
```

Then tell Claude Code: `"Search for the latest Stellar x402 examples"` — it calls `web_search`, the server pays via x402, and Claude gets real results. The same client can call `image_search` and `news_search` for visual and current-events lookups.

---

## Hackathon requirements

| Requirement | ✓ |
|---|---|
| Open-source repo + README | ✅ |
| 2–3 min video demo | Record showing: connect Freighter → search → see 402 → payment settles → results |
| Real Stellar testnet transactions | ✅ Every paid request (`/search`, `/images`, `/news`) settles 0.001 USDC via the x402 facilitator |
| x402 protocol | ✅ `@x402/express` + `@x402/stellar` |
| Addresses explicit demand signal | ✅ "pay-per-query web search instead of monthly subscriptions" |
