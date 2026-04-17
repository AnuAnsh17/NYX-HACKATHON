package api

import "sync"

type Broadcaster struct {
	mu      sync.Mutex
	clients map[chan string]struct{}
}

func NewBroadcaster() *Broadcaster {
	return &Broadcaster{
		clients: make(map[chan string]struct{}),
	}
}

func (b *Broadcaster) Subscribe() (chan string, func()) {
	ch := make(chan string, 16)
	b.mu.Lock()
	b.clients[ch] = struct{}{}
	b.mu.Unlock()

	unsubscribe := func() {
		b.mu.Lock()
		defer b.mu.Unlock()
		if _, ok := b.clients[ch]; ok {
			delete(b.clients, ch)
			close(ch)
		}
	}
	return ch, unsubscribe
}

func (b *Broadcaster) Publish(data string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for ch := range b.clients {
		select {
		case ch <- data:
		default:
		}
	}
}
