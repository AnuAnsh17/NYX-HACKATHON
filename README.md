# DCL — Deep Compliance Layer

> **We don't store logs. We store proof.**

A tamper-evident cryptographic logging engine built in Go. Every event is sealed into a SHA-256 hash chain — mutation of any block breaks the chain deterministically, and the verifier pinpoints the exact index where tampering began.

Built from scratch by **Team NYX** for **HackX 2.0 — Code for Bharat 5.0** (domain: Cyber Defence & Digital Trust).

---

## Who Is This For?

DCL targets **NBFCs, fintechs, and regulated entities** that need tamper-evident audit trails under:

- **DPDP Act 2023 §8(5)** — Tamper evidence for personal data processing logs
- **BSA 2023 §61** — Audit trail integrity for financial record-keeping
- **RBI Master Direction** — Log retention and non-repudiation for lending platforms

Any compliance officer, auditor, or regulator can independently verify chain integrity with a single API call — no proprietary tools required.

---

## Core Invariant

```
H(i) = SHA-256( index || data || prev_hash || timestamp )
```

Each block's hash commits to the previous block. Modify any stored field and the chain breaks — every downstream block inherits the failure. There is nowhere for a silent edit to hide.

---

## What This Is (and Isn't)

| ✅ What it is | ❌ What it is NOT |
|---|---|
| Single-node, append-only cryptographic log | A blockchain (no consensus, no mining) |
| Deterministic tamper detection engine | A database replacement |
| Real-time compliance monitoring dashboard | Legally admissible on its own (BSA 63(4) certificates are out of scope for V1) |
| Forensic evidence generation system | A production-hardened enterprise product (yet) |

---

## Architecture

```
         ┌───────────────────────────────────────────────┐
         │  Frontend (HTML + Vanilla JS + Chart.js)      │
         │  /         — Mission Control Dashboard        │
         │  /reports  — Forensic Evidence Review         │
         └──────────────┬────────────────────────────────┘
                        │  HTTP + SSE (text/event-stream)
                        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  main.go  —  net/http mux, graceful shutdown (SIGINT)       │
  │                                                             │
  │  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   │
  │  │   api/       │   │   chain/     │   │   verifier/    │   │
  │  │  handlers    │──▶│  Block       │◀──│  per-block    │   │
  │  │  SSE hub     │   │  Chain       │   │  VALID/BROKEN  │   │
  │  │  routes      │   │  ComputeHash │   │                │   │
  │  │  simulate    │   │  Reset       │   │                │   │
  │  └──────────────┘   └──────────────┘   └────────────────┘   │
  └─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

**Go 1.21+ — standard library only.** `go.mod` lists zero third-party modules.

| Layer | Technology |
|---|---|
| HTTP server | `net/http` |
| Cryptography | `crypto/sha256` |
| Concurrency | `sync.RWMutex`, `sync/atomic` |
| Storage | In-memory `[]Block` (append-only) |
| Real-time | Server-Sent Events |
| Frontend | Vanilla HTML/CSS/JS, Chart.js |

---

## API Contract

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/event` | Seal an event into the chain, returns new Block |
| `GET` | `/chain` | Full chain as `[]Block` |
| `GET` | `/verify` | Per-block VALID/BROKEN status + overall `valid` flag |
| `POST` | `/tamper` | Overwrite `block[i].Data` without recomputing hash |
| `POST` | `/reset` | Reset chain to fresh genesis block |
| `POST` | `/simulate?mode=demo` | Run 20+genesis smooth demo events (400–600ms) |
| `POST` | `/simulate?mode=stress` | Fire 1500 events for throughput validation |
| `GET` | `/events` | SSE stream — new blocks broadcast in real-time |
| `GET` | `/healthz` | `{"status":"ok","chain_length":N}` |
| `GET` | `/reports` | Forensic Evidence Review page |

---

## Features

### Mission Control Dashboard (`/`)

- **Hero ring visualization** — cryptographic seal count with animated dot ring
- **Real-time audit stream** — live SSE feed with tokenized log entries
- **Evidence table** — paginated, searchable, with hash truncation + tooltips, icon action buttons, status pills
- **Integrity monitor** — timeline of recent blocks with break detection
- **Charts** — event rate (line), block status (donut), hash entropy (heatmap)
- **Compliance sidebar** — DPDP, BSA, RBI, and internal integrity signals
- **System telemetry** — verify latency, memory usage, network I/O
- **Skeleton loading** — premium loading state with cross-fade hydration

### Simulation System

- **Demo Mode** — 20 events at 400–600ms intervals with realistic NBFC event names (KYC, LOAN, AUDIT, COMPLIANCE, etc.). Smooth animations, perfect for live presentation.
- **Stress Mode** — 1500 events with SSE batching (150ms drain interval), `requestAnimationFrame` render scheduling, chart debouncing (500ms), and CSS animation suppression. Dashboard stays smooth under load.

### Forensic Evidence Review (`/reports`)

- **Executive summary** — total blocks, valid vs broken, first break index, cascade impact
- **Chain topology** — visual linear chain with break highlighting and dashed links
- **Breakpoint analysis** — mismatch explanation with cascade implication
- **Affected segments** — tampered + cascade block listing with badges
- **Evidence hash table** — stored vs expected hash with status pills
- **Compliance signal** — audit integrity, traceability, defensibility (PASS/FAIL)
- **Export** — download chain JSON, verification JSON, or full forensic report

### Performance Optimizations

- SSE events always queued and batch-drained (100ms normal, 150ms stress)
- Render scheduling via `requestAnimationFrame` with deduplication
- Chart updates debounced to max 2×/sec
- Audit log capped at 100 lines, timeline at 20 nodes (8 in stress)
- All heavy CSS animations suppressed during stress mode
- Backend yields every 100 events to prevent CPU starvation

---

## Quick Start

```bash
# Build and verify
go build ./...
go vet ./...

# Run
go run .
```

Server starts on `:8080`.

| Page | URL |
|---|---|
| Mission Control | [http://localhost:8080](http://localhost:8080) |
| Forensic Report | [http://localhost:8080/reports](http://localhost:8080/reports) |

---

## Demo Flow

1. **Start the server** → `go run .`
2. **Open the dashboard** → `http://localhost:8080`
3. **Click RUN DEMO** → watch 20 events seal smoothly with ring animation
4. **Click TAMPER LAST** → chain breaks, compliance cascades red, audit stream logs breach
5. **Open /reports** → forensic report shows breakpoint analysis and affected segments
6. **Click RESET CHAIN** → clean slate for next demo cycle
7. **Click RUN STRESS** → 1500 events fire, dashboard stays smooth with batch rendering
8. **Export** → download chain JSON or full forensic report from /reports

---

## Project Structure

```
nyx-hackathon/
├── main.go                    HTTP server, graceful shutdown
├── chain/
│   ├── chain.go               Append-only engine, mutex-safe, reset
│   └── hash.go                SHA-256 hash formula
├── api/
│   ├── handlers.go            HTTP handlers + simulation (demo/stress)
│   ├── routes.go              Route registration + CORS
│   └── broadcaster.go         SSE pub/sub hub
├── verifier/
│   └── verify.go              Per-block integrity check
├── frontend/dashboard/
│   ├── index.html             Mission Control (dashboard + JS)
│   ├── style.css              Full design system
│   └── reports.html           Forensic Evidence Review page
└── simulator/
    └── simulator.py           Python event generator (legacy)
```

---

## Contributors

**TEAM NYX**

| Name |
|---|---|
| **Anurag Yadav**  | 
| **Akash Jaiswal** | 
| **Hrishabh Soni** | 

---

<p align="center">
  <strong>Team NYX · HackX 2.0 — Code for Bharat 5.0 · 2026</strong><br>
  <em>Cyber Defence & Digital Trust</em>
</p>
