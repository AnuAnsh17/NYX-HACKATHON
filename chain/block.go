package chain

// Block is one link in the tamper-evident log.
//
// Hash commits to (Index, Data, PrevHash, Timestamp) via ComputeHash.
// Any mutation of a stored field — without recomputing Hash — is
// detectable by the verifier and cascades to every downstream block.
type Block struct {
	Index     int    `json:"index"`
	Data      string `json:"data"`
	Timestamp string `json:"timestamp"`
	PrevHash  string `json:"prev_hash"`
	Hash      string `json:"hash"`
}
