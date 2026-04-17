package api

import (
	"encoding/json"
	"net/http"

	"github.com/AnuAnsh17/nyx-hackathon/chain"
	"github.com/AnuAnsh17/nyx-hackathon/verifier"
)

type Handler struct {
	chain *chain.Chain
}

func NewHandler(c *chain.Chain) *Handler {
	return &Handler{chain: c}
}

func (h *Handler) PostEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	var req struct {
		Data string `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	block := h.chain.Append(req.Data)
	writeJSON(w, http.StatusOK, block)
}

func (h *Handler) GetChain(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, h.chain.GetChain())
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
	writeError(w, http.StatusNotImplemented, "tamper lands in commit 6")
}

func (h *Handler) GetEvents(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "sse stream lands in commit 6")
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
