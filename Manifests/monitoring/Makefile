.PHONY: deploy delete status port-forward-grafana port-forward-prometheus port-forward-jaeger port-forward-all logs-prometheus logs-loki logs-grafana

# Deploy entire monitoring stack
deploy:
	@echo "Creating monitoring namespace..."
	kubectl apply -f namespace.yaml
	@echo "Creating ConfigMap..."
	kubectl apply -f configmap.yaml
	@echo "Deploying Prometheus..."
	kubectl apply -f prometheus.yaml
	@echo "Deploying Grafana..."
	kubectl apply -f grafana.yaml
	@echo "Deploying Loki..."
	kubectl apply -f loki.yaml
	@echo "Deploying Promtail..."
	kubectl apply -f promtail.yaml
	@echo "Deploying Jaeger..."
	kubectl apply -f jaeger.yaml
	@echo "✓ Monitoring stack deployed!"
	@echo ""
	@echo "Run 'make status' to check pod status"
	@echo "Run 'make port-forward-all' to access UIs"

# Delete entire monitoring stack
delete:
	@echo "Deleting monitoring stack..."
	kubectl delete -f jaeger.yaml --ignore-not-found
	kubectl delete -f promtail.yaml --ignore-not-found
	kubectl delete -f loki.yaml --ignore-not-found
	kubectl delete -f grafana.yaml --ignore-not-found
	kubectl delete -f prometheus.yaml --ignore-not-found
	kubectl delete -f configmap.yaml --ignore-not-found
	kubectl delete -f namespace.yaml --ignore-not-found
	@echo "✓ Monitoring stack deleted!"

# Check status of monitoring pods
status:
	@echo "=== Monitoring Pods ==="
	kubectl get pods -n monitoring
	@echo ""
	@echo "=== Monitoring Services ==="
	kubectl get svc -n monitoring

# Wait for pods to be ready
wait:
	@echo "Waiting for pods to be ready..."
	kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=120s
	kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s
	kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=120s
	kubectl wait --for=condition=ready pod -l app=jaeger -n monitoring --timeout=120s
	@echo "✓ All pods ready!"

# Port forwards (run in separate terminals or background)
port-forward-grafana:
	@echo "Grafana: http://localhost:3000 (admin/admin)"
	kubectl port-forward -n monitoring svc/grafana 3000:3000

port-forward-prometheus:
	@echo "Prometheus: http://localhost:9090"
	kubectl port-forward -n monitoring svc/prometheus 9090:9090

port-forward-jaeger:
	@echo "Jaeger: http://localhost:16686"
	kubectl port-forward -n monitoring svc/jaeger 16686:16686

# Port forward all (backgrounded) - access all UIs
port-forward-all:
	@echo "Starting port forwards..."
	@echo "Grafana:    http://localhost:3000 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"
	@echo "Jaeger:     http://localhost:16686"
	@echo ""
	@echo "Press Ctrl+C to stop all"
	@kubectl port-forward -n monitoring svc/grafana 3000:3000 & \
	kubectl port-forward -n monitoring svc/prometheus 9090:9090 & \
	kubectl port-forward -n monitoring svc/jaeger 16686:16686 & \
	wait

# View logs
logs-prometheus:
	kubectl logs -n monitoring -l app=prometheus -f

logs-grafana:
	kubectl logs -n monitoring -l app=grafana -f

logs-loki:
	kubectl logs -n monitoring -l app=loki -f

logs-jaeger:
	kubectl logs -n monitoring -l app=jaeger -f

logs-promtail:
	kubectl logs -n monitoring -l app=promtail -f

# Restart a component
restart-prometheus:
	kubectl rollout restart deployment/prometheus -n monitoring

restart-grafana:
	kubectl rollout restart deployment/grafana -n monitoring

restart-loki:
	kubectl rollout restart deployment/loki -n monitoring

restart-jaeger:
	kubectl rollout restart deployment/jaeger -n monitoring

# Help
help:
	@echo "Monitoring Stack Commands:"
	@echo ""
	@echo "  make deploy              - Deploy entire monitoring stack"
	@echo "  make delete              - Delete entire monitoring stack"
	@echo "  make status              - Check pod and service status"
	@echo "  make wait                - Wait for all pods to be ready"
	@echo ""
	@echo "  make port-forward-all    - Access all UIs (Grafana, Prometheus, Jaeger)"
	@echo "  make port-forward-grafana    - Grafana only (localhost:3000)"
	@echo "  make port-forward-prometheus - Prometheus only (localhost:9090)"
	@echo "  make port-forward-jaeger     - Jaeger only (localhost:16686)"
	@echo ""
	@echo "  make logs-prometheus     - View Prometheus logs"
	@echo "  make logs-grafana        - View Grafana logs"
	@echo "  make logs-loki           - View Loki logs"
	@echo "  make logs-promtail       - View Promtail logs"
	@echo "  make logs-jaeger         - View Jaeger logs"
	@echo ""
	@echo "  make restart-<component> - Restart a component"
