{{/*
Expand the name of the chart.
*/}}
{{- define "tec-shop.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "tec-shop.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "tec-shop.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "tec-shop.labels" -}}
helm.sh/chart: {{ include "tec-shop.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ include "tec-shop.name" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Selector labels for a given service.
Usage: {{ include "tec-shop.selectorLabels" (dict "name" "api-gateway") }}
*/}}
{{- define "tec-shop.selectorLabels" -}}
app: {{ .name }}
app.kubernetes.io/name: {{ .name }}
{{- end }}

{{/*
Build the full image reference for a service.
Usage: {{ include "tec-shop.image" (dict "global" .Values.global "service" .Values.services.apiGateway) }}
*/}}
{{- define "tec-shop.image" -}}
{{- printf "%s/%s:%s" .global.registry .service.image.name .global.imageTag }}
{{- end }}

{{/*
Return the namespace to use.
*/}}
{{- define "tec-shop.namespace" -}}
{{- .Values.global.namespace | default "tec-shop" }}
{{- end }}
