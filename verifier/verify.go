package verifier

import "github.com/AnuAnsh17/nyx-hackathon/chain"

type BlockStatus struct {
	Index        int    `json:"index"`
	Status       string `json:"status"`
	ExpectedHash string `json:"expected_hash"`
	StoredHash   string `json:"stored_hash"`
}

type VerifyResult struct {
	Valid  bool          `json:"valid"`
	Blocks []BlockStatus `json:"blocks"`
}

func Verify(blocks []chain.Block) VerifyResult {
	result := VerifyResult{
		Valid:  true,
		Blocks: make([]BlockStatus, 0, len(blocks)),
	}
	for _, b := range blocks {
		expected := chain.Hash(b)
		status := "VALID"
		if expected != b.Hash {
			status = "BROKEN"
			result.Valid = false
		}
		result.Blocks = append(result.Blocks, BlockStatus{
			Index:        b.Index,
			Status:       status,
			ExpectedHash: expected,
			StoredHash:   b.Hash,
		})
	}
	return result
}
