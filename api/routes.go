package api

import "net/http"

func RegisterRoutes(mux *http.ServeMux, h *Handler) {
	mux.HandleFunc("/event", withCORS(h.PostEvent))
	mux.HandleFunc("/chain", withCORS(h.GetChain))
	mux.HandleFunc("/verify", withCORS(h.GetVerify))
	mux.HandleFunc("/tamper", withCORS(h.PostTamper))
	mux.HandleFunc("/reset", withCORS(h.PostReset))
	mux.HandleFunc("/simulate", withCORS(h.PostSimulate))
	mux.HandleFunc("/events", withCORS(h.GetEvents))
	mux.HandleFunc("/healthz", withCORS(h.Healthz))

	mux.Handle("/legacy/", http.StripPrefix("/legacy", http.FileServer(http.Dir("frontend"))))
	mux.Handle("/", http.FileServer(http.Dir("frontend/dashboard")))
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}
