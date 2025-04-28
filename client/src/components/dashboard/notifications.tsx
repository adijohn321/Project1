export default function Notifications() {
  const notifications = [
    {
      id: 1,
      icon: "bell",
      iconClass: "text-primary",
      title: "Budget approval needed",
      description: "Health Center Equipment request requires your approval",
      time: "2 hours ago",
      isUnread: true,
    },
    {
      id: 2,
      icon: "check-circle",
      iconClass: "text-emerald-500",
      title: "AIP Item Approved",
      description: "Road Rehabilitation Project approved by council",
      time: "Yesterday",
      isUnread: false,
    },
    {
      id: 3,
      icon: "exclamation-triangle",
      iconClass: "text-amber-500",
      title: "Reconciliation Required",
      description: "Budget-to-accounting reconciliation needed for Q2",
      time: "2 days ago",
      isUnread: false,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-600">Notifications</h3>
        <a href="#" className="text-primary text-sm hover:underline">
          View All
        </a>
      </div>
      <div className="overflow-hidden">
        <ul className="divide-y divide-neutral-200">
          {notifications.map((notification) => (
            <li key={notification.id} className={notification.isUnread ? "p-4 bg-blue-50" : "p-4"}>
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  {notification.icon === "bell" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${notification.iconClass}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  )}
                  {notification.icon === "check-circle" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${notification.iconClass}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {notification.icon === "exclamation-triangle" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${notification.iconClass}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-600">{notification.title}</p>
                  <p className="text-xs text-neutral-500">{notification.description}</p>
                  <p className="text-xs text-neutral-400 mt-1">{notification.time}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
