package chain

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
)

// GenesisPrevHash is the canonical prev_hash for block 0 (64 zero chars).
const GenesisPrevHash = "0000000000000000000000000000000000000000000000000000000000000000"

// ComputeHash realises the tamper-evidence invariant:
//
//	H(i) = SHA256( strconv.Itoa(index) || data || prev_hash || timestamp )
//
// Inputs are concatenated as raw bytes in that exact order. Changing any
// field invalidates both H(i) and every downstream block's prev_hash
// reference, so tamper is deterministically detectable end-to-end.
func ComputeHash(index int, data, prevHash, timestamp string) string {
	raw := strconv.Itoa(index) + data + prevHash + timestamp
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
