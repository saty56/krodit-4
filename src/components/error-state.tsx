"use client";

import { AlertCircleIcon } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
}

export const ErrorState = ({ title, description }: ErrorStateProps) => {
  return (
    <div className="py-4 px-8 flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg shadow-sm p-10">
        <AlertCircleIcon className="size-6 text-red-500" />
        <div className="flex flex-col items-center justify-center gap-y-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};