"use client";
import React, { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { setupGlobalErrorHandler } from "@/lib/errorLogger";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  
  useEffect(() => {
    // Setup global error handling
    setupGlobalErrorHandler();
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors />
      </QueryClientProvider>
    </SessionProvider>
  );
}


