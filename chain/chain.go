package chain

import (
	"sync"
	"time"
)

type Chain struct {
	mu     sync.RWMutex
	blocks []Block
}

func New() *Chain {
	const (
		genesisData     = "GENESIS"
		genesisPrevHash = "0000000000000000000000000000000000000000000000000000000000000000"
	)
	timestamp := time.Now().UTC().Format(time.RFC3339Nano)
	genesis := Block{
		Index:     0,
		Data:      genesisData,
		Timestamp: timestamp,
		PrevHash:  genesisPrevHash,
		Hash:      computeHash(0, genesisData, genesisPrevHash, timestamp),
	}
	return &Chain{blocks: []Block{genesis}}
}

func (c *Chain) Append(data string) Block {
	c.mu.Lock()
	defer c.mu.Unlock()

	prev := c.blocks[len(c.blocks)-1]
	index := prev.Index + 1
	timestamp := time.Now().UTC().Format(time.RFC3339Nano)
	hash := computeHash(index, data, prev.Hash, timestamp)

	block := Block{
		Index:     index,
		Data:      data,
		Timestamp: timestamp,
		PrevHash:  prev.Hash,
		Hash:      hash,
	}
	c.blocks = append(c.blocks, block)
	return block
}

func (c *Chain) GetChain() []Block {
	c.mu.RLock()
	defer c.mu.RUnlock()

	out := make([]Block, len(c.blocks))
	copy(out, c.blocks)
	return out
}
