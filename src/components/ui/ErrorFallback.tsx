import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "This page couldn't load",
  message = "An unexpected error occurred while loading this section of the seller dashboard."
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Icon Container */}
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-red-500/20 dark:bg-red-500/10 blur-xl rounded-full scale-150 animate-pulse" />
          <div className="relative bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 rounded-2xl shadow-lg shadow-red-500/20">
            <AlertCircle className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-850 dark:text-white font-outfit">
            {title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {message}
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-left">
              <p className="text-xs font-mono text-red-650 dark:text-red-400 break-all">
                {error.message || String(error)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {resetErrorBoundary ? (
            <button
              onClick={resetErrorBoundary}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Try Reloading
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/15 hover:shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          )}
          <a
            href="/seller"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-sm font-bold rounded-xl shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            Seller Hub
          </a>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
