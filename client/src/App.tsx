import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";

// Planning routes
import AnnualInvestmentPlanPage from "@/pages/planning/annual-investment-plan";

// Budget routes
import BudgetPreparation from "@/pages/budget/budget-preparation";
import BudgetObligationPage from "@/pages/budget/budget-obligation";

// Accounting routes
import JournalEntries from "@/pages/accounting/journal-entries";
import VoucherManagement from "@/pages/accounting/voucher-management";

// Treasury routes
import Collections from "@/pages/treasury/collections";
import Disbursements from "@/pages/treasury/disbursements";

// HRIS routes
import EmployeeRecords from "@/pages/hris/employee-records";
import Payroll from "@/pages/hris/payroll";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Planning routes */}
      <ProtectedRoute 
        path="/planning/aip" 
        component={AnnualInvestmentPlanPage} 
        requiredModule="planning" 
      />
      
      {/* Budget routes */}
      <ProtectedRoute 
        path="/budget/preparation" 
        component={BudgetPreparation} 
        requiredModule="budget" 
      />
      <ProtectedRoute 
        path="/budget/obligation" 
        component={BudgetObligationPage} 
        requiredModule="budget" 
      />
      
      {/* Accounting routes */}
      <ProtectedRoute 
        path="/accounting/journal-entries" 
        component={JournalEntries} 
        requiredModule="accounting" 
      />
      <ProtectedRoute 
        path="/accounting/vouchers" 
        component={VoucherManagement} 
        requiredModule="accounting" 
      />
      
      {/* Treasury routes */}
      <ProtectedRoute 
        path="/treasury/collections" 
        component={Collections} 
        requiredModule="treasury" 
      />
      <ProtectedRoute 
        path="/treasury/disbursements" 
        component={Disbursements} 
        requiredModule="treasury" 
      />
      
      {/* HRIS routes */}
      <ProtectedRoute 
        path="/hris/employees" 
        component={EmployeeRecords} 
        requiredModule="hris" 
      />
      <ProtectedRoute 
        path="/hris/payroll" 
        component={Payroll} 
        requiredModule="hris" 
      />
      
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
