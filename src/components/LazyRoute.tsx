import { Suspense, type ReactNode, type ComponentType } from 'react';
import { ModuleErrorBoundary } from '@/components/ModuleErrorBoundary';
import { Loader2 } from 'lucide-react';

interface LazyRouteProps {
  /** The lazy loaded component */
  component: ComponentType;
  /** Module name for error boundary (Arabic) */
  moduleName?: string;
  /** Fallback path when error occurs (default: "/") */
  fallbackPath?: string;
}

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">جاري التحميل...</p>
    </div>
  </div>
);

/**
 * LazyRoute - Wrapper for lazy loaded route components
 * Combines Suspense with ModuleErrorBoundary for better error handling
 * 
 * @example
 * <Route path="customers" element={<LazyRoute component={CustomersList} moduleName="العملاء" />} />
 */
export function LazyRoute({ component: Component, moduleName, fallbackPath = '/' }: LazyRouteProps): ReactNode {
  return (
    <ModuleErrorBoundary moduleName={moduleName} fallbackPath={fallbackPath}>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ModuleErrorBoundary>
  );
}
