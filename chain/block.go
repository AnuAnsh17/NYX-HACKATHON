package chain

type Block struct {
	Index     int    `json:"index"`
	Data      string `json:"data"`
	Timestamp string `json:"timestamp"`
	PrevHash  string `json:"prev_hash"`
	Hash      string `json:"hash"`
}
