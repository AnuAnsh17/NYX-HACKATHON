package api

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"github.com/AnuAnsh17/nyx-hackathon/chain"
	"github.com/AnuAnsh17/nyx-hackathon/verifier"
)

type Handler struct {
	chain       *chain.Chain
	broadcaster *Broadcaster
	simRunning  atomic.Bool
}

func NewHandler(c *chain.Chain, b *Broadcaster) *Handler {
	return &Handler{chain: c, broadcaster: b}
}

func (h *Handler) PostEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		writeError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		return
	}
	var req struct {
		Data string `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if strings.TrimSpace(req.Data) == "" {
		writeError(w, http.StatusBadRequest, "data field required")
		return
	}
	block := h.chain.Append(req.Data)
	if bs, err := json.Marshal(block); err == nil {
		h.broadcaster.Publish(string(bs))
	}
	writeJSON(w, http.StatusOK, block)
}

func (h *Handler) GetChain(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, h.chain.GetChain())
}

func (h *Handler) PostReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	h.chain.Reset()
	writeJSON(w, http.StatusOK, map[string]any{
		"status":       "reset",
		"chain_length": 1,
	})
}

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"status":       "ok",
		"chain_length": len(h.chain.GetChain()),
	})
}

func (h *Handler) GetVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, verifier.Verify(h.chain.GetChain()))
}

func (h *Handler) PostTamper(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req struct {
		Index *int `json:"index"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if req.Index == nil {
		writeError(w, http.StatusBadRequest, "index field required")
		return
	}
	index := *req.Index
	if err := h.chain.Tamper(index); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"tampered": index,
		"data":     "TAMPERED",
	})
}

func (h *Handler) GetEvents(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming unsupported")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ch, unsubscribe := h.broadcaster.Subscribe()
	defer unsubscribe()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// ──────────────────────────────────────────────────────────
// Simulation handler
// ──────────────────────────────────────────────────────────

var demoEventNames = []string{
	"LOAN:disbursement_check",
	"KYC:aadhaar_verified",
	"AUDIT:quarterly_review",
	"COMPLIANCE:rbi_report",
	"TRANSACTION:emi_received",
	"RISK:credit_score_pull",
	"ONBOARD:new_borrower",
	"ALERT:fraud_flag_cleared",
	"REVIEW:manager_approval",
	"SANCTION:limit_update",
}

func (h *Handler) PostSimulate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	mode := r.URL.Query().Get("mode")
	if mode != "demo" && mode != "stress" {
		writeError(w, http.StatusBadRequest, "mode must be 'demo' or 'stress'")
		return
	}

	if !h.simRunning.CompareAndSwap(false, true) {
		writeError(w, http.StatusConflict, "simulation already running")
		return
	}

	switch mode {
	case "demo":
		go h.runDemo()
	case "stress":
		go h.runStress()
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status": "started",
		"mode":   mode,
	})
}

func (h *Handler) runDemo() {
	defer h.simRunning.Store(false)

	count := 20
	for i := 0; i < count; i++ {
		name := demoEventNames[rand.Intn(len(demoEventNames))]
		data := fmt.Sprintf("%s_%d", name, time.Now().UnixMilli())
		block := h.chain.Append(data)
		if bs, err := json.Marshal(block); err == nil {
			h.broadcaster.Publish(string(bs))
		}
		// 400–600ms jitter
		delay := time.Duration(400+rand.Intn(200)) * time.Millisecond
		time.Sleep(delay)
	}
}

func (h *Handler) runStress() {
	defer h.simRunning.Store(false)

	count := 3000
	for i := 0; i < count; i++ {
		data := fmt.Sprintf("STRESS:event_%d_%d", i, time.Now().UnixNano())
		block := h.chain.Append(data)
		if bs, err := json.Marshal(block); err == nil {
			h.broadcaster.Publish(string(bs))
		}
		// tiny yield to prevent total CPU starvation
		if i%50 == 0 {
			time.Sleep(time.Millisecond)
		}
	}
}
