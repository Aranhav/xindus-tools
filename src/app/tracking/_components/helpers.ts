import type { TrackingEvent } from "@/types/tracking";

export function getEventColor(event: string): "success" | "info" | "muted" {
  const lower = event.toLowerCase();
  if (lower.includes("delivered")) return "success";
  if (
    lower.includes("transit") ||
    lower.includes("dispatched") ||
    lower.includes("dispatch") ||
    lower.includes("out for delivery") ||
    lower.includes("arrived") ||
    lower.includes("received")
  )
    return "info";
  return "muted";
}

export const dotColor: Record<string, string> = {
  success: "bg-success",
  info: "bg-info",
  muted: "bg-muted-foreground",
};

export const lineColor: Record<string, string> = {
  success: "border-success/40",
  info: "border-info/40",
  muted: "border-border",
};

/** Get the last (most recent) event from a tracking result's events array. */
export function getLastEvent(events: TrackingEvent[]): TrackingEvent | undefined {
  return events[0];
}
