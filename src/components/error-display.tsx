"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex items-center gap-4 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="flex-1 text-sm text-destructive">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
