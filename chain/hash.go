package chain

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
)

func computeHash(index int, data, prevHash, timestamp string) string {
	raw := strconv.Itoa(index) + data + prevHash + timestamp
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}
