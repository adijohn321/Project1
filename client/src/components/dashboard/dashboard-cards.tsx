import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface DashboardStats {
  aipProgress: {
    implemented: number;
    total: number;
    percentage: number;
  };
  budgetUtilization: {
    allocated: number;
    used: number;
    percentage: number;
  };
  pendingVouchers: {
    count: number;
    highPriority: number;
  };
}

export default function DashboardCards({ fiscalYear }: { fiscalYear: number }) {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: [`/api/dashboard/stats?fiscalYear=${fiscalYear}`],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 col-span-full">
          <p className="text-red-500">Error loading dashboard statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* AIP Progress */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-500">AIP Progress</h3>
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-neutral-600">{stats.aipProgress.percentage}%</span>
          <span className="text-sm text-neutral-400 ml-2">of Planned Projects</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 mb-1">
          <div
            className="bg-primary h-2 rounded-full"
            style={{ width: `${stats.aipProgress.percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-neutral-400">
          {stats.aipProgress.implemented} of {stats.aipProgress.total} projects implemented
        </p>
      </div>

      {/* Budget Utilization */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-500">Budget Utilization</h3>
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-neutral-600">{stats.budgetUtilization.percentage}%</span>
          <span className="text-sm text-neutral-400 ml-2">of Annual Budget</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 mb-1">
          <div
            className="bg-emerald-500 h-2 rounded-full"
            style={{ width: `${stats.budgetUtilization.percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-neutral-400">
          ₱{(stats.budgetUtilization.used / 1_000_000).toFixed(1)}M of ₱
          {(stats.budgetUtilization.allocated / 1_000_000).toFixed(1)}M allocated
        </p>
      </div>

      {/* Pending Vouchers */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-500">Pending Vouchers</h3>
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-neutral-600">{stats.pendingVouchers.count}</span>
          <span className="text-sm text-neutral-400 ml-2">Need Processing</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2 mb-1">
          <div
            className="bg-amber-500 h-2 rounded-full"
            style={{ width: `${Math.min(stats.pendingVouchers.count * 5, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-neutral-400">{stats.pendingVouchers.highPriority} high priority vouchers</p>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-500">System Status</h3>
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="mb-2">
          <span className="text-2xl font-bold text-emerald-500">All Systems Active</span>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-neutral-500">Planning</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-neutral-500">Budget</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-neutral-500">Accounting</span>
        </div>
        <p className="text-xs text-neutral-400 mt-1">Last sync: Today, {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
