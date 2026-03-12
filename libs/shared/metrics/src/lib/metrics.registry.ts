import { Registry, openMetricsContentType } from 'prom-client';

export const metricsRegistry = new Registry(openMetricsContentType);
