import { useState } from "react";
import Layout from "@/components/layout/layout";
import DashboardCards from "@/components/dashboard/dashboard-cards";
import DashboardTable from "@/components/dashboard/dashboard-table";
import WorkflowStatus from "@/components/dashboard/workflow-status";
import Notifications from "@/components/dashboard/notifications";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [fiscalYear, setFiscalYear] = useState(currentYear);

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-600">Dashboard</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <select
                className="rounded-md border border-neutral-300 text-sm p-2 pr-8 bg-white"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(parseInt(e.target.value))}
              >
                <option value={currentYear + 1}>Fiscal Year {currentYear + 1}</option>
                <option value={currentYear}>Fiscal Year {currentYear}</option>
                <option value={currentYear - 1}>Fiscal Year {currentYear - 1}</option>
              </select>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Report
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <DashboardCards fiscalYear={fiscalYear} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent AIP Items */}
          <DashboardTable />

          {/* System Workflow & Notifications */}
          <div className="space-y-6">
            {/* Workflow Status */}
            <WorkflowStatus />

            {/* Recent Notifications */}
            <Notifications />
          </div>
        </div>
      </div>
    </Layout>
  );
}
