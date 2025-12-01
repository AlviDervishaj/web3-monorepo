"use client";

import { ReactNode } from "react";

interface OpsStatCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
}

export function OpsStatCard({
  title,
  value,
  description,
  icon,
}: OpsStatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        {icon ? (
          <div className="text-muted-foreground" aria-hidden="true">
            {icon}
          </div>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

