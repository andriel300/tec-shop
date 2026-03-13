import { Registry, openMetricsContentType } from 'prom-client';
import type { OpenMetricsContentType } from 'prom-client';

export const metricsRegistry = new Registry<OpenMetricsContentType>();
metricsRegistry.setContentType(openMetricsContentType);
