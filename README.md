# DCL Clean Room V1

> **We don't store logs. We store proof.**

A tamper-evident logging engine in Go. Original work built from
scratch by **Team NYX** for **HackX 2.0 — Code for Bharat 5.0**
(domain: Cyber Defence & Digital Trust).

## Invariant

```
H(i) = SHA256( index || data || prev_hash || timestamp )
```

Every block's hash commits to the previous block. Mutation of any
stored field breaks the chain deterministically — the verifier
points at the exact index where tamper began, and every downstream
block inherits the break. There is nowhere for a silent edit to
hide.

## This is NOT

- **Not a blockchain.** No consensus, no distributed ledger, no
  mining. Single-node, append-only log with cryptographic linking.
- **Not legally admissible yet.** BSA 63(4) certificates are out
  of scope for the V1 demo slice — honest framing for judges.

## Architecture

```
             ┌─────────────────────────────────────────┐
             │  Frontend (plain HTML + vanilla JS)     │
             │  /  — live chain viz + tamper controls  │
             └──────────────┬──────────────────────────┘
                            │  HTTP + SSE (text/event-stream)
                            ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  main.go  —  net/http mux, graceful shutdown (SIGINT)        │
  │                                                              │
  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
  │  │   api/       │   │   chain/     │   │   verifier/      │  │
  │  │  handlers    │──▶│  Block,      │◀──│  per-block       │  │
  │  │  SSE hub     │   │  Chain,      │   │  VALID / BROKEN  │  │
  │  │  routes      │   │  ComputeHash │   │                  │  │
  │  └──────────────┘   └──────────────┘   └──────────────────┘  │
  │         ▲                   │                                │
  │         │     Append()      │                                │
  │         └─── callback ──────┘                                │
  │         (api registers on startup; chain stays HTTP-free)    │
  └─────────────────────────────────────────────────────────────┘
```

> Diagram will be replaced with a rendered PNG in Commit 10.

## Stack

Go 1.21+ **standard library only**. `go.mod` lists zero third-party
modules — judges can verify. HTTP via `net/http`, SHA-256 via
`crypto/sha256`, concurrency via `sync.RWMutex`, in-memory
`[]Block` storage, Server-Sent Events for the live dashboard.

## API contract

| Method | Path       | Purpose                                          |
|--------|------------|--------------------------------------------------|
| POST   | `/event`   | Append event to chain, returns new Block         |
| GET    | `/chain`   | Full chain as `[]Block`                          |
| GET    | `/verify`  | Per-block VALID / BROKEN status + overall `valid`|
| POST   | `/tamper`  | Overwrite block[i].Data without updating hash    |
| GET    | `/events`  | SSE stream of new blocks                         |
| GET    | `/healthz` | `{"status":"ok","chain_length":N}`               |

## Build

```bash
go build ./...
go vet ./...
go test -race ./...
```

## Run

```bash
go run .
```

Server listens on `:8080`. Dashboard will be served at
`http://localhost:8080` once the frontend lands (Commit 8).

## Demo script (placeholder — expanded in Commit 10)

1. Start the server.
2. Ingest NBFC-style events via the Python simulator.
3. Watch the dashboard chain grow live via SSE.
4. Click **Tamper** on block 3. Hash is not recomputed.
5. Call `GET /verify`. Blocks 0–2 show `VALID`, blocks 3..N show
   `BROKEN`. Dashboard cascades red in 150 ms steps.
6. Hit `POST /event` again. New block's `prev_hash` references the
   broken hash — the break propagates forever.

## Frontend (Next.js SOC Dashboard)

```bash
cd frontend/new-ui
npm install
npm run dev
```

Dashboard connects to Go backend at `localhost:8080`.
Start the backend first, then the frontend, then the Python simulator.

## Structure

```
nyx-hackathon/
├── main.go         HTTP server boot, graceful shutdown
├── chain/          Block struct, hash formula, append-only engine
├── api/            HTTP handlers, routes, SSE broadcaster
├── verifier/       Chain integrity check, per-block status
└── frontend/       Plain HTML + vanilla JS dashboard
```

## Commit narrative (10 commits, ~2h cadence)

1. init: clean room DCL project setup with Go module
2. feat: implement Block struct and SHA-256 hash formula
3. feat: append-only chain engine with mutex and genesis
4. feat: HTTP server with POST /event and GET /chain
5. feat: chain verifier and GET /verify endpoint
6. feat: tamper simulation endpoint and SSE event stream
7. test: race-clean test suite — 5 invariant cases
8. feat: frontend chain visualiser with live SSE
9. feat: tamper cascade animation and integrity status panel
10. feat: NBFC simulator integration, README, demo polish

---

Team NYX · HackX 2.0 · 2026
