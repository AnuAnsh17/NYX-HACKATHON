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

	"github.com/AnuAnsh17/nyx-hackathon/api"
	"github.com/AnuAnsh17/nyx-hackathon/chain"
)

func main() {
	c := chain.New()
	h := api.NewHandler(c)

	mux := http.NewServeMux()
	api.RegisterRoutes(mux, h)

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
