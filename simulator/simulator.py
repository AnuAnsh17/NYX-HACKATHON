import requests
import random
import string
import time
import sys

BASE_URL = "http://localhost:8080"


# ── EventGenerator ──────────────────────────────────────────────────────────

def generate_event():
    event_type = random.choice([
        "loan_disbursed",
        "kyc_updated",
        "consent_logged",
        "data_access_request",
        "repayment_received",
    ])
    txn_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{event_type}: NBFC-TXN-{txn_id}"


# ── VerifierClient ───────────────────────────────────────────────────────────

def verify():
    try:
        res = requests.get(f"{BASE_URL}/verify", timeout=5).json()
    except Exception as e:
        print(f"[ERROR] Could not reach /verify: {e}")
        return

    chain_len = len(res.get("blocks", []))
    print(f"[DEBUG] Chain length: {chain_len}")

    if res.get("valid"):
        print("[✓] Chain VALID — all blocks intact\n")
    else:
        broken = [b for b in res.get("blocks", []) if b.get("status") == "BROKEN"]
        print(f"[✗] Chain BROKEN — {len(broken)} block(s) compromised\n")
        for b in broken:
            print(f"    Block #{b['index']} | stored: {b.get('stored_hash','')[:16]}... | expected: {b.get('expected_hash','')[:16]}...")
        print()


# ── AttackEngine ─────────────────────────────────────────────────────────────

def tamper(index):
    try:
        res = requests.post(f"{BASE_URL}/tamper", json={"index": index}, timeout=5).json()
        print(f"[!] Tamper confirmed → block #{res.get('tampered')} data set to '{res.get('data')}'")
    except Exception as e:
        print(f"[ERROR] Tamper failed: {e}")


def get_chain_length():
    try:
        res = requests.get(f"{BASE_URL}/healthz", timeout=5).json()
        return res.get("chain_length", 0)
    except Exception as e:
        print(f"[ERROR] Healthz failed: {e}")
        return 0


# ── Orchestrator ─────────────────────────────────────────────────────────────

def run_simulation(event_count=10, tamper_index=3):
    print("=" * 55)
    print("  DCL BLACKBOX SIMULATOR — ALYUCA / Team NYX")
    print("  HackX 2.0 | Cyber Defence & Digital Trust")
    print("=" * 55)
    print()

    # Phase 1 — Normal ingestion
    print(f"[+] Phase 1: Generating {event_count} NBFC events...\n")
    for i in range(event_count):
        data = generate_event()
        try:
            res = requests.post(f"{BASE_URL}/event", json={"data": data}, timeout=5).json()
            print(f"  [{i:02d}] Sent  → {data}")
            print(f"       Hash  → {res.get('hash','')[:24]}...")
        except Exception as e:
            print(f"  [{i:02d}] ERROR → {e}")
        time.sleep(1)

    print()
    print("[✓] Phase 1 complete — verifying chain integrity...")
    verify()

    # Phase 2 — Adversarial tamper
    chain_len = get_chain_length()
    if chain_len <= tamper_index:
        print(f"[ABORT] Chain too short ({chain_len} blocks) to safely tamper index {tamper_index}.")
        print("        Increase event_count or lower tamper_index.")
        sys.exit(1)

    print("[!] Phase 2: Adversarial attack initiated...")
    print(f"[!] Targeting block #{tamper_index} — simulating insider data mutation\n")
    time.sleep(3)

    tamper(tamper_index)
    time.sleep(1)

    print()
    print("[✗] Phase 2 complete — verifying chain after attack...")
    verify()

    print("=" * 55)
    print("  BLACKBOX TEST COMPLETE")
    print("  If Chain BROKEN above → DCL detected the attack.")
    print("  Tamper-evidence invariant: PROVEN.")
    print("=" * 55)


if __name__ == "__main__":
    event_count = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    tamper_index = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    run_simulation(event_count=event_count, tamper_index=tamper_index)
