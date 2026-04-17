package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// Commit 1 scaffold: server boots, every contract route is registered
// and returns 501 Not Implemented. Real handlers land in Commit 4
// (POST /event, GET /chain), Commit 5 (GET /verify), and Commit 6
// (POST /tamper, GET /events). SIGINT / SIGTERM trigger graceful
// shutdown with a 5-second drain window.
func main() {
	mux := http.NewServeMux()

	notImpl := func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "not implemented", http.StatusNotImplemented)
	}
	for _, route := range []string{
		"/event",
		"/chain",
		"/verify",
		"/tamper",
		"/events",
		"/healthz",
	} {
		mux.HandleFunc(route, notImpl)
	}

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		log.Printf("DCL Clean Room V1 — listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
			return
		}
		serverErr <- nil
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		log.Fatalf("server exited unexpectedly: %v", err)
	case sig := <-stop:
		log.Printf("shutdown signal received: %s", sig)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("graceful shutdown failed: %v", err)
	}
	log.Println("server stopped cleanly")
}
