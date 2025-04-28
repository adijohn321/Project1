import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requiredModule,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredModule?: string;
}) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // If a specific module access is required, check user's role
  if (requiredModule && role) {
    if (role.module !== requiredModule && role.module !== "admin") {
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-neutral-600">
              You don't have permission to access this section.
            </p>
          </div>
        </Route>
      );
    }
  }

  return <Route path={path} component={Component} />;
}
