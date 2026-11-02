"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/client/api";
import { LocationProvider } from "@/lib/client/location";
import { NavTracker } from "./nav-tracker";
import { ToastProvider } from "./toast";

export function Providers({ children }: { children: ReactNode }) {
  // Cache hanya di memori sesi (PRD 8.1): tidak ada persister ke storage.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => {
              if (err instanceof ApiError && err.code !== "NETWORK") return false;
              return count < 1;
            },
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <LocationProvider>
        <ToastProvider>
          <NavTracker />
          {children}
        </ToastProvider>
      </LocationProvider>
    </QueryClientProvider>
  );
}
