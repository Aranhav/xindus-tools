"use client";

import type { TrackingEvent } from "@/types/tracking";
import { getEventColor, dotColor, lineColor } from "./helpers";

export function Timeline({ events }: { events: TrackingEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No tracking events available.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {events.map((ev, idx) => {
        const color = getEventColor(ev.event);
        const isLast = idx === events.length - 1;

        return (
          <div key={idx} className="relative flex gap-4">
            {/* Left column: date/time */}
            <div className="w-28 shrink-0 pt-0.5 text-right">
              <p className="text-xs font-medium text-foreground">{ev.date}</p>
              <p className="text-xs text-muted-foreground">{ev.time}</p>
            </div>

            {/* Dot + line */}
            <div className="relative flex flex-col items-center">
              <div
                className={`z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-background ${dotColor[color]}`}
              />
              {!isLast && (
                <div
                  className={`w-px flex-1 border-l-2 ${lineColor[color]}`}
                />
              )}
            </div>

            {/* Right column: event + office */}
            <div className={`pb-6 pt-0.5 ${isLast ? "pb-0" : ""}`}>
              <p className="text-sm font-medium text-foreground">{ev.event}</p>
              <p className="text-xs text-muted-foreground">{ev.office}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
