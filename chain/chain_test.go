package chain_test

import (
	"fmt"
	"strings"
	"sync"
	"testing"

	"github.com/AnuAnsh17/nyx-hackathon/chain"
	"github.com/AnuAnsh17/nyx-hackathon/verifier"
)

func TestGenesisBlock(t *testing.T) {
	c := chain.New()
	blocks := c.GetChain()

	if len(blocks) == 0 {
		t.Fatalf("expected genesis block, got empty chain")
	}
	g := blocks[0]

	if g.Index != 0 {
		t.Errorf("genesis index = %d, want 0", g.Index)
	}
	if g.PrevHash != strings.Repeat("0", 64) {
		t.Errorf("genesis prev_hash = %q, want 64 zeros", g.PrevHash)
	}
	if g.Data != "GENESIS" {
		t.Errorf("genesis data = %q, want %q", g.Data, "GENESIS")
	}
	if g.Hash == "" {
		t.Errorf("genesis hash is empty")
	}
	if expected := chain.Hash(g); g.Hash != expected {
		t.Errorf("genesis hash = %q, want %q", g.Hash, expected)
	}
}

func TestChainLinkage(t *testing.T) {
	c := chain.New()
	for i := 0; i < 5; i++ {
		c.Append(fmt.Sprintf("block-%d", i))
	}
	blocks := c.GetChain()

	if len(blocks) != 6 {
		t.Fatalf("chain length = %d, want 6", len(blocks))
	}
	for i := 1; i < len(blocks); i++ {
		if blocks[i].PrevHash != blocks[i-1].Hash {
			t.Errorf("block[%d].PrevHash = %q, want %q",
				i, blocks[i].PrevHash, blocks[i-1].Hash)
		}
	}
}

func TestTamperCascade(t *testing.T) {
	c := chain.New()
	for i := 0; i < 5; i++ {
		c.Append(fmt.Sprintf("block-%d", i))
	}
	if err := c.Tamper(2); err != nil {
		t.Fatalf("Tamper(2) returned error: %v", err)
	}
	result := verifier.Verify(c.GetChain())

	if result.Valid {
		t.Errorf("result.Valid = true, want false")
	}
	want := []string{"VALID", "VALID", "BROKEN", "BROKEN", "BROKEN", "BROKEN"}
	if len(result.Blocks) != len(want) {
		t.Fatalf("result.Blocks length = %d, want %d", len(result.Blocks), len(want))
	}
	for i, status := range want {
		if result.Blocks[i].Status != status {
			t.Errorf("block[%d].Status = %q, want %q",
				i, result.Blocks[i].Status, status)
		}
	}
}

func TestHashDeterminism(t *testing.T) {
	b := chain.Block{
		Index:     42,
		Data:      "deterministic",
		Timestamp: "2026-04-17T00:00:00Z",
		PrevHash:  strings.Repeat("a", 64),
		Hash:      "ignored-by-hash-function",
	}
	reference := chain.Hash(b)
	for i := 0; i < 100; i++ {
		if got := chain.Hash(b); got != reference {
			t.Fatalf("iter %d: Hash = %q, want %q", i, got, reference)
		}
	}
}

func TestConcurrentAppend(t *testing.T) {
	c := chain.New()
	var wg sync.WaitGroup
	wg.Add(50)
	for i := 0; i < 50; i++ {
		i := i
		go func() {
			defer wg.Done()
			c.Append(fmt.Sprintf("goroutine-%d", i))
		}()
	}
	wg.Wait()

	blocks := c.GetChain()
	if len(blocks) != 51 {
		t.Fatalf("chain length = %d, want 51", len(blocks))
	}
	for i := 1; i < len(blocks); i++ {
		if blocks[i].PrevHash != blocks[i-1].Hash {
			t.Errorf("block[%d].PrevHash = %q != block[%d].Hash = %q",
				i, blocks[i].PrevHash, i-1, blocks[i-1].Hash)
		}
	}
}
