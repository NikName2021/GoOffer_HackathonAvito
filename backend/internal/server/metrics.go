package server

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func newMetrics() (http.Handler, func(http.Handler) http.Handler) {
	registry := prometheus.NewRegistry()
	requests := prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "gooffer",
		Subsystem: "http",
		Name:      "requests_total",
		Help:      "Total number of HTTP requests processed by the application.",
	}, []string{"code", "method"})
	duration := prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "gooffer",
		Subsystem: "http",
		Name:      "request_duration_seconds",
		Help:      "Duration of HTTP requests processed by the application.",
	}, []string{"method"})
	inFlight := prometheus.NewGauge(prometheus.GaugeOpts{
		Namespace: "gooffer",
		Subsystem: "http",
		Name:      "requests_in_flight",
		Help:      "Current number of HTTP requests being processed.",
	})

	registry.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
		requests,
		duration,
		inFlight,
	)

	metricsHandler := promhttp.InstrumentMetricHandler(
		registry,
		promhttp.HandlerFor(registry, promhttp.HandlerOpts{EnableOpenMetrics: true}),
	)
	instrument := func(next http.Handler) http.Handler {
		return promhttp.InstrumentHandlerInFlight(
			inFlight,
			promhttp.InstrumentHandlerDuration(
				duration,
				promhttp.InstrumentHandlerCounter(requests, next),
			),
		)
	}

	return metricsHandler, instrument
}
