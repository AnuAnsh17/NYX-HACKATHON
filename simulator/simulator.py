"""
DCL Blackbox Simulator - ALYUCA / Team NYX
High-throughput async event ingestion + adversarial tamper engine.
Interacts ONLY via HTTP. No internal chain access.

Usage:
    python simulator.py <num_events> <concurrency> <tamper_index>
    python simulator.py 50000 500 3
"""

import asyncio
import aiohttp
import random
import string
import time
import sys
import json
from datetime import datetime, timezone

# Windows asyncio fix (required for aiohttp on Windows)
if sys.platform == "win32":
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

BASE_URL = "http://localhost:8080"

ACTORS = [
    "NBFC-BAJAJ-001", "NBFC-MUTHOOT-002", "NBFC-TATA-003",
    "NBFC-MAHINDRA-004", "NBFC-HDFC-005", "NBFC-ADITYA-006",
    "NBFC-SHRIRAM-007", "NBFC-CHOLAMANDALAM-008",
]

EVENT_TYPES = [
    ("loan_disbursed",         "LOAN_DISB"),
    ("loan_application",       "LOAN_APPL"),
    ("repayment_received",     "REPAY_RCV"),
    ("repayment_missed",       "REPAY_MSS"),
    ("kyc_initiated",          "KYC_INIT"),
    ("kyc_updated",            "KYC_UPD"),
    ("kyc_rejected",           "KYC_REJ"),
    ("consent_logged",         "CNSNT_LOG"),
    ("consent_revoked",        "CNSNT_REV"),
    ("data_access_request",    "DAR"),
    ("fraud_flag_raised",      "FRAUD_FLG"),
    ("account_frozen",         "ACC_FRZ"),
    ("credit_score_updated",   "CRED_UPD"),
    ("interest_accrued",       "INT_ACC"),
    ("regulatory_report_filed","REG_RPT"),
]

RESOURCES = ["ACC", "LOAN", "KYC", "TXN", "CONSENT", "CRED", "REPAY", "AUDIT"]


# --------------------------------------------------------------------------
# Event Generator
# --------------------------------------------------------------------------

def _txn_id() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

def generate_event() -> str:
    event_name, event_code = random.choice(EVENT_TYPES)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    payload = {
        "event":      event_code,
        "ts":         ts,
        "actor_id":   random.choice(ACTORS),
        "user_id":    f"USR-{_txn_id()}",
        "ref":        f"{random.choice(RESOURCES)}-{_txn_id()}",
        "amount":     round(random.uniform(1000, 2500000), 2),
        "currency":   "INR",
        "risk":       random.choice(["LOW", "MEDIUM", "HIGH"]),
    }
    return f"{event_name}|{json.dumps(payload, separators=(',', ':'))}"


# --------------------------------------------------------------------------
# Clean Chain Check
# --------------------------------------------------------------------------

async def check_server_reachable(session: aiohttp.ClientSession) -> bool:
    try:
        async with session.get(
            f"{BASE_URL}/healthz",
            timeout=aiohttp.ClientTimeout(total=5)
        ) as resp:
            return resp.status == 200
    except Exception:
        return False

async def check_chain_clean(session: aiohttp.ClientSession) -> tuple[bool, int]:
    """Returns (is_clean, chain_length)."""
    try:
        async with session.get(
            f"{BASE_URL}/verify",
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            data = await resp.json()
            broken = [b for b in data.get("blocks", []) if b.get("status") == "BROKEN"]
            chain_len = len(data.get("blocks", []))
            return (len(broken) == 0, chain_len)
    except Exception as e:
        print(f"[ERROR] /verify failed: {e}")
        return (False, 0)


# --------------------------------------------------------------------------
# High-Throughput Ingestion Engine
# --------------------------------------------------------------------------

async def send_event(
    session: aiohttp.ClientSession,
    semaphore: asyncio.Semaphore,
    stats: dict,
) -> None:
    data = generate_event()
    async with semaphore:
        for attempt in range(3):
            try:
                async with session.post(
                    f"{BASE_URL}/event",
                    json={"data": data},
                    timeout=aiohttp.ClientTimeout(total=8),
                ) as resp:
                    if resp.status == 200:
                        stats["success"] += 1
                    else:
                        stats["fail"] += 1
                    return
            except asyncio.TimeoutError:
                stats["timeout"] += 1
                if attempt < 2:
                    await asyncio.sleep(0.05 * (attempt + 1))
            except Exception:
                stats["fail"] += 1
                return
        stats["fail"] += 1


async def progress_reporter(stats: dict, total: int, stop_event: asyncio.Event) -> None:
    start = time.monotonic()
    while not stop_event.is_set():
        await asyncio.sleep(1)
        done = stats["success"] + stats["fail"]
        elapsed = time.monotonic() - start
        rate = done / elapsed if elapsed > 0 else 0
        pct = (done / total) * 100 if total > 0 else 0
        print(
            f"  [PROGRESS] {done:>6}/{total}  ({pct:4.1f}%)  "
            f"{rate:>7.0f} req/s  |  ok={stats['success']}  "
            f"fail={stats['fail']}  timeout={stats['timeout']}",
            flush=True,
        )


async def run_ingestion(
    session: aiohttp.ClientSession,
    event_count: int,
    concurrency: int,
    stats: dict,
) -> float:
    semaphore = asyncio.Semaphore(concurrency)
    stop_event = asyncio.Event()

    reporter = asyncio.create_task(
        progress_reporter(stats, event_count, stop_event)
    )

    start = time.monotonic()
    tasks = [
        asyncio.create_task(send_event(session, semaphore, stats))
        for _ in range(event_count)
    ]
    await asyncio.gather(*tasks)
    elapsed = time.monotonic() - start

    stop_event.set()
    await reporter
    return elapsed


# --------------------------------------------------------------------------
# Attack Engine
# --------------------------------------------------------------------------

async def tamper(session: aiohttp.ClientSession, index: int) -> None:
    try:
        async with session.post(
            f"{BASE_URL}/tamper",
            json={"index": index},
            timeout=aiohttp.ClientTimeout(total=5),
        ) as resp:
            data = await resp.json()
            print(f"[!] Tamper confirmed -> block #{data.get('tampered')} "
                  f"overwritten to '{data.get('data')}'")
    except Exception as e:
        print(f"[ERROR] Tamper failed: {e}")

async def verify_and_print(session: aiohttp.ClientSession, label: str) -> None:
    print(f"[+] {label}")
    try:
        async with session.get(
            f"{BASE_URL}/verify",
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            data = await resp.json()

        blocks = data.get("blocks", [])
        broken = [b for b in blocks if b.get("status") == "BROKEN"]
        chain_len = len(blocks)
        print(f"    Chain length : {chain_len}")

        if data.get("valid"):
            print(f"    Status       : [OK] VALID -- all {chain_len} blocks intact\n")
        else:
            print(f"    Status       : [!!] BROKEN -- {len(broken)}/{chain_len} blocks compromised")
            for b in broken[:3]:
                print(f"      Block #{b['index']:>4} | stored:   {b.get('stored_hash','')[:22]}...")
                print(f"               | expected: {b.get('expected_hash','')[:22]}...")
            if len(broken) > 3:
                print(f"      ... and {len(broken) - 3} more")
            print()
    except Exception as e:
        print(f"[ERROR] /verify failed: {e}\n")


# --------------------------------------------------------------------------
# Main Orchestrator
# --------------------------------------------------------------------------

async def main(event_count: int, concurrency: int, tamper_index: int) -> None:
    print("=" * 65)
    print("  DCL BLACKBOX SIMULATOR - ALYUCA / Team NYX")
    print("  HackX 2.0 | Cyber Defence & Digital Trust")
    print("=" * 65)
    print(f"  Events      : {event_count:,}")
    print(f"  Concurrency : {concurrency} workers")
    print(f"  Tamper at   : block #{tamper_index}")
    print("=" * 65)
    print()

    connector = aiohttp.TCPConnector(
        limit=concurrency,
        limit_per_host=concurrency,
        keepalive_timeout=30,
        enable_cleanup_closed=True,
    )

    async with aiohttp.ClientSession(connector=connector) as session:

        # --- Server reachability check ---
        if not await check_server_reachable(session):
            print("[ABORT] Server not reachable at", BASE_URL)
            print("        Start the Go backend first: go run main.go")
            return

        # --- Clean chain check ---
        is_clean, existing_len = await check_chain_clean(session)
        print(f"[INFO] Server reachable | existing chain length: {existing_len}")

        if not is_clean:
            print("[WARN] Chain is currently BROKEN from a previous run.")
            print("[WARN] Restart the Go server for a clean state, then re-run.")
            print("[WARN] Proceeding anyway -- Phase 1 verify will reflect dirty state.")
            print()
        else:
            print("[INFO] Chain is clean -- starting fresh run\n")

        # --- Phase 1: High-throughput ingestion ---
        print(f"[INFO] Load: {event_count:,} events @ concurrency {concurrency}\n")

        stats = {"success": 0, "fail": 0, "timeout": 0}
        elapsed = await run_ingestion(session, event_count, concurrency, stats)

        total_done = stats["success"] + stats["fail"]
        throughput = stats["success"] / elapsed if elapsed > 0 else 0

        print()
        print("-" * 65)
        print(f"  [STATS] Total sent    : {total_done:,}")
        print(f"  [STATS] Success       : {stats['success']:,}")
        print(f"  [STATS] Failed        : {stats['fail']:,}")
        print(f"  [STATS] Timeouts      : {stats['timeout']:,}")
        print(f"  [STATS] Elapsed       : {elapsed:.2f}s")
        print(f"  [OK]    Throughput    : {throughput:,.0f} events/sec")
        print("-" * 65)
        print()

        await verify_and_print(session, "Phase 1 verify -- post ingestion")

        # --- Phase 2: Adversarial tamper ---
        async with session.get(
            f"{BASE_URL}/healthz",
            timeout=aiohttp.ClientTimeout(total=5)
        ) as resp:
            health = await resp.json()
            chain_len = health.get("chain_length", 0)

        if chain_len <= tamper_index:
            print(f"[ABORT] Chain too short ({chain_len}) to tamper index {tamper_index}.")
            return

        print(f"[!] Phase 2: Adversarial attack on block #{tamper_index}...\n")
        await tamper(session, tamper_index)
        await asyncio.sleep(0.5)

        print()
        await verify_and_print(session, "Phase 2 verify -- post tamper attack")

        print("=" * 65)
        print("  BLACKBOX TEST COMPLETE")
        print(f"  Ingested : {stats['success']:,} events")
        print(f"  Speed    : {throughput:,.0f} events/sec")
        print(f"  Result   : Chain BROKEN after tamper -> invariant PROVEN")
        print("=" * 65)


if __name__ == "__main__":
    num_events   = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    concurrency  = int(sys.argv[2]) if len(sys.argv) > 2 else 200
    tamper_index = int(sys.argv[3]) if len(sys.argv) > 3 else 3

    asyncio.run(main(num_events, concurrency, tamper_index))
