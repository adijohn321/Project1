export default function WorkflowStatus() {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-600">System Workflow Status</h3>
      </div>
      <div className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute h-full w-0.5 bg-neutral-200 left-1.5 top-0"></div>

          <div className="relative flex items-start mb-4">
            <div className="flex-shrink-0 h-4 w-4 rounded-full bg-emerald-500 mt-1"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Planning</p>
              <p className="text-xs text-neutral-400">AIP data entry complete for current period</p>
            </div>
          </div>

          <div className="relative flex items-start mb-4">
            <div className="flex-shrink-0 h-4 w-4 rounded-full bg-primary mt-1"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Budget</p>
              <p className="text-xs text-neutral-400">Processing obligation requests</p>
            </div>
          </div>

          <div className="relative flex items-start mb-4">
            <div className="flex-shrink-0 h-4 w-4 rounded-full bg-amber-500 mt-1"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Accounting</p>
              <p className="text-xs text-neutral-400">Vouchers pending review</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="flex-shrink-0 h-4 w-4 rounded-full bg-neutral-300 mt-1"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-400">Treasury</p>
              <p className="text-xs text-neutral-400">Awaiting voucher processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
