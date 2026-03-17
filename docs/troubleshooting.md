# Troubleshooting

## Services not starting (host-based)

- Check that required ports are available (8080, 6001–6012)
- Verify all environment variables are set — services fail on missing secrets (`JWT_SECRET`, `SERVICE_MASTER_SECRET`, `OTP_SALT`)
- Confirm `pnpm infra:up` is running (Redis + Kafka required)

## Docker stack not starting

- Run `pnpm stack:up:build` to force a full image rebuild after code changes
- Confirm `certs/` directory exists with all service certificates — run `pnpm certs:generate` if missing
- Check individual service logs: `docker logs tec-shop-auth-service`
- Services wait for health checks before starting dependents; allow 2–3 minutes on first boot

## Authentication issues

- Verify `JWT_SECRET` is at least 32 characters
- Verify `SERVICE_MASTER_SECRET` is set for inter-service calls
- Check database connections
- Confirm SMTP configuration for OTP delivery

## mTLS certificate errors

- Regenerate: `pnpm certs:clean && pnpm certs:generate`
- For the Docker stack, certs are bind-mounted from `./certs/` — ensure files exist on the host before `docker compose up`
- For Kubernetes, re-run `pnpm k8s:secrets` after regenerating certs, then restart affected deployments:
  ```bash
  kubectl rollout restart deployment -n tec-shop
  ```

## Kafka events not processing

- Host-based: confirm `KAFKA_BROKER=localhost:9092` in `.env` and `pnpm infra:up` is running
- Docker stack: `KAFKA_BROKER` is overridden to `kafka:29092` automatically — no change needed
- Check that the `kafka-service` consumer is running
- Verify topic names match `KafkaTopics` constants in `@tec-shop/kafka-events`

## order-service fails to connect to PostgreSQL

If the startup script's automatic Prisma push failed, run it manually:

```bash
ORDER_SERVICE_DB_URL="your-neon-connection-string" \
  npx nx run @tec-shop/order-schema:db-push
```

## Kubernetes pods stuck in `ErrImagePull` or `ImagePullBackOff`

- Images were not loaded into kind. Run `pnpm k8s:build` to build and load all images.
- Confirm `imagePullPolicy: Never` is set — check with:
  ```bash
  kubectl describe pod <pod-name> -n tec-shop
  ```

## Kubernetes pods crash-looping (`CrashLoopBackOff`)

- Check pod logs: `kubectl logs <pod-name> -n tec-shop --previous`
- Most common causes: missing secret key (re-run `pnpm k8s:secrets`), missing cert file, or wrong service hostname in ConfigMap
- Verify the ConfigMap is populated:
  ```bash
  kubectl describe configmap tec-shop-config -n tec-shop
  ```

## Kafka pods not ready in kind

Bitnami Kafka (KRaft mode) can take 60–90 seconds to elect a controller. Wait for `kafka-controller-0` to show `Running` before deploying services:

```bash
pnpm k8s:status
```
