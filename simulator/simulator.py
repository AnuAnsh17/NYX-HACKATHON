import requests
import random
import string
import time
import sys
import json

BASE_URL = "http://localhost:8080"

ACTORS = [
    "NBFC-BAJAJ-001", "NBFC-MUTHOOT-002", "NBFC-TATA-003",
    "NBFC-MAHINDRA-004", "NBFC-HDFC-005", "NBFC-ADITYA-006",
    "NBFC-SHRIRAM-007", "NBFC-CHOLAMANDALAM-008",
]

RESOURCES = [
    "ACC", "LOAN", "KYC", "TXN", "CONSENT", "CRED", "REPAY", "AUDIT",
]

EVENT_TYPES = [
    ("loan_disbursed",        "LOAN_DISB"),
    ("loan_application",      "LOAN_APPL"),
    ("repayment_received",    "REPAY_RCV"),
    ("repayment_missed",      "REPAY_MSS"),
    ("kyc_initiated",         "KYC_INIT"),
    ("kyc_updated",           "KYC_UPD"),
    ("kyc_rejected",          "KYC_REJ"),
    ("consent_logged",        "CNSNT_LOG"),
    ("consent_revoked",       "CNSNT_REV"),
    ("data_access_request",   "DAR"),
    ("fraud_flag_raised",     "FRAUD_FLG"),
    ("account_frozen",        "ACC_FRZ"),
    ("credit_score_updated",  "CRED_UPD"),
    ("interest_accrued",      "INT_ACC"),
    ("regulatory_report_filed","REG_RPT"),
]


# EventGenerator

def txn_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

def generate_event():
    event_name, event_code = random.choice(EVENT_TYPES)
    actor = random.choice(ACTORS)
    resource = random.choice(RESOURCES)
    amount = round(random.uniform(1000, 2500000), 2)
    ref = f"{resource}-{txn_id()}"

    payload = {
        "event":     event_code,
        "actor_id":  actor,
        "ref":       ref,
        "amount":    amount,
        "currency":  "INR",
        "risk":      random.choice(["LOW", "MEDIUM", "HIGH"]),
    }
    return f"{event_name}|{json.dumps(payload, separators=(',', ':'))}"


# VerifierClient

def verify():
    try:
        res = requests.get(f"{BASE_URL}/verify", timeout=5).json()
    except Exception as e:
        print(f"[ERROR] Could not reach /verify: {e}")
        return

    blocks = res.get("blocks", [])
    chain_len = len(blocks)
    print(f"[DEBUG] Chain length: {chain_len}")

    if res.get("valid"):
        print("[OK] Chain VALID -- all blocks intact\n")
    else:
        broken = [b for b in blocks if b.get("status") == "BROKEN"]
        print(f"[!!] Chain BROKEN -- {len(broken)}/{chain_len} block(s) compromised\n")
        for b in broken[:5]:
            print(f"    Block #{b['index']:>3} | stored:   {b.get('stored_hash','')[:20]}...")
            print(f"              | expected: {b.get('expected_hash','')[:20]}...")
        if len(broken) > 5:
            print(f"    ... and {len(broken) - 5} more broken blocks")
        print()


# AttackEngine

def tamper(index):
    try:
        res = requests.post(f"{BASE_URL}/tamper", json={"index": index}, timeout=5).json()
        print(f"[!] Tamper confirmed -> block #{res.get('tampered')} data overwritten to '{res.get('data')}'")
    except Exception as e:
        print(f"[ERROR] Tamper failed: {e}")


def get_chain_length():
    try:
        res = requests.get(f"{BASE_URL}/healthz", timeout=5).json()
        return res.get("chain_length", 0)
    except Exception as e:
        print(f"[ERROR] Healthz failed: {e}")
        return 0


# Orchestrator

def run_simulation(event_count=50, tamper_index=5, delay=0.2):
    print("=" * 60)
    print("  DCL BLACKBOX SIMULATOR - ALYUCA / Team NYX")
    print("  HackX 2.0 | Cyber Defence & Digital Trust")
    print("=" * 60)
    print()

    # Phase 1 - Normal ingestion
    print(f"[+] Phase 1: Ingesting {event_count} NBFC events (ISO 20022 schema)...\n")
    success = 0
    start = time.time()

    for i in range(event_count):
        data = generate_event()
        try:
            res = requests.post(f"{BASE_URL}/event", json={"data": data}, timeout=5).json()
            print(f"  [{i+1:03d}/{event_count}] {data[:60]}")
            print(f"           Hash -> {res.get('hash','')[:28]}...")
            success += 1
        except Exception as e:
            print(f"  [{i+1:03d}/{event_count}] ERROR -> {e}")
        time.sleep(delay)

    elapsed = time.time() - start
    rate = success / elapsed if elapsed > 0 else 0
    print(f"\n[STATS] {success}/{event_count} events ingested | {elapsed:.1f}s | {rate:.1f} req/s")
    print()
    print("[+] Phase 1 complete - verifying chain integrity...")
    verify()

    # Phase 2 - Adversarial tamper
    chain_len = get_chain_length()
    if chain_len <= tamper_index:
        print(f"[ABORT] Chain too short ({chain_len} blocks) to safely tamper index {tamper_index}.")
        sys.exit(1)

    print("[!] Phase 2: Adversarial attack initiated...")
    print(f"[!] Targeting block #{tamper_index} - simulating insider data mutation\n")
    time.sleep(2)

    tamper(tamper_index)
    time.sleep(1)

    print()
    print("[!!] Phase 2 complete - verifying chain after attack...")
    verify()

    print("=" * 60)
    print("  BLACKBOX TEST COMPLETE")
    print(f"  Events ingested : {success}")
    print(f"  Tamper target   : block #{tamper_index}")
    print("  Result          : If BROKEN above -> invariant PROVEN")
    print("=" * 60)


if __name__ == "__main__":
    event_count  = int(sys.argv[1])   if len(sys.argv) > 1 else 50
    tamper_index = int(sys.argv[2])   if len(sys.argv) > 2 else 5
    delay        = float(sys.argv[3]) if len(sys.argv) > 3 else 0.2
    run_simulation(event_count=event_count, tamper_index=tamper_index, delay=delay)
