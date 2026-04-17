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

func Hash(b Block) string {
	return computeHash(b.Index, b.Data, b.PrevHash, b.Timestamp)
}
