import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "compliant":
      return "text-emerald-400 bg-emerald-500/20";
    case "partial":
      return "text-amber-400 bg-amber-500/20";
    case "gap":
      return "text-rose-400 bg-rose-500/20";
    default:
      return "text-gray-400 bg-gray-500/20";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-rose-400 bg-rose-500/20 border-rose-500/30";
    case "high":
      return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    case "medium":
      return "text-amber-400 bg-amber-500/20 border-amber-500/30";
    case "low":
      return "text-blue-400 bg-blue-500/20 border-blue-500/30";
    default:
      return "text-gray-400 bg-gray-500/20 border-gray-500/30";
  }
}

export function getConfidenceLabel(confidence: string | null): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence - manual review recommended";
    default:
      return "Unknown";
  }
}

export function getReadinessLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: "Ready",
      color: "text-emerald-400",
      description: "Your organisation appears well-positioned for certification",
    };
  }
  if (score >= 50) {
    return {
      label: "Needs Work",
      color: "text-amber-400",
      description: "Remediation required in several areas before certification",
    };
  }
  return {
    label: "Not Ready",
    color: "text-rose-400",
    description: "Significant gaps exist that require attention",
  };
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

