'use client';

import React from 'react';
import { ErrorFallback } from '../../components/ui/ErrorFallback';

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
