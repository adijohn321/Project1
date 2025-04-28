import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AIPItem } from "@shared/schema";

export default function DashboardTable() {
  const { data: aipItems, isLoading, error } = useQuery<AIPItem[]>({
    queryKey: ["/api/dashboard/recent-aip-items"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm col-span-2">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="font-medium text-neutral-600">Recent Annual Investment Plan (AIP) Items</h3>
          <a href="#" className="text-primary text-sm hover:underline">
            View All
          </a>
        </div>
        <div className="p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !aipItems) {
    return (
      <div className="bg-white rounded-lg shadow-sm col-span-2">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h3 className="font-medium text-neutral-600">Recent Annual Investment Plan (AIP) Items</h3>
          <a href="#" className="text-primary text-sm hover:underline">
            View All
          </a>
        </div>
        <div className="p-4">
          <p className="text-red-500">Error loading AIP items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm col-span-2">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-600">Recent Annual Investment Plan (AIP) Items</h3>
        <a href="#" className="text-primary text-sm hover:underline">
          View All
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-neutral-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Project Name
              </th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Sector</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Budget</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {aipItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-neutral-500">
                  No AIP items found
                </td>
              </tr>
            ) : (
              aipItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">{item.projectName}</p>
                      <p className="text-xs text-neutral-400">{item.location}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{item.sector}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">₱{Number(item.budget).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === "approved"
                          ? "bg-green-100 text-emerald-800"
                          : item.status === "in_progress"
                          ? "bg-blue-100 text-primary"
                          : item.status === "draft"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-primary hover:text-primaryDark">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
