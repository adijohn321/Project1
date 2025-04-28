import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Receipt, 
  Book, 
  CreditCard, 
  PiggyBank, 
  DollarSign, 
  Users, 
  FileSpreadsheet,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isSidebarOpen: boolean;
}

export default function Sidebar({ isSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, role, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Define navigation items with access control
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
      active: location === "/",
      module: "all" // Everyone can access the dashboard
    },
    {
      section: "Planning",
      items: [
        {
          title: "Annual Investment Plan",
          href: "/planning/aip",
          icon: <FileText className="w-5 h-5 mr-3" />,
          active: location === "/planning/aip",
          module: "planning"
        },
        {
          title: "Development Plans",
          href: "/planning/development",
          icon: <BarChart3 className="w-5 h-5 mr-3" />,
          active: location === "/planning/development",
          module: "planning"
        }
      ]
    },
    {
      section: "Budget",
      items: [
        {
          title: "Budget Preparation",
          href: "/budget/preparation",
          icon: <Receipt className="w-5 h-5 mr-3" />,
          active: location === "/budget/preparation",
          module: "budget"
        },
        {
          title: "Budget Obligation",
          href: "/budget/obligation",
          icon: <FileText className="w-5 h-5 mr-3" />,
          active: location === "/budget/obligation",
          module: "budget"
        }
      ]
    },
    {
      section: "Accounting",
      items: [
        {
          title: "Journal Entries",
          href: "/accounting/journal-entries",
          icon: <Book className="w-5 h-5 mr-3" />,
          active: location === "/accounting/journal-entries",
          module: "accounting"
        },
        {
          title: "Voucher Management",
          href: "/accounting/vouchers",
          icon: <Receipt className="w-5 h-5 mr-3" />,
          active: location === "/accounting/vouchers",
          module: "accounting"
        }
      ]
    },
    {
      section: "Treasury",
      items: [
        {
          title: "Collections",
          href: "/treasury/collections",
          icon: <PiggyBank className="w-5 h-5 mr-3" />,
          active: location === "/treasury/collections",
          module: "treasury"
        },
        {
          title: "Disbursements",
          href: "/treasury/disbursements",
          icon: <CreditCard className="w-5 h-5 mr-3" />,
          active: location === "/treasury/disbursements",
          module: "treasury"
        }
      ]
    },
    {
      section: "HRIS",
      items: [
        {
          title: "Employee Records",
          href: "/hris/employees",
          icon: <Users className="w-5 h-5 mr-3" />,
          active: location === "/hris/employees",
          module: "hris"
        },
        {
          title: "Payroll",
          href: "/hris/payroll",
          icon: <FileSpreadsheet className="w-5 h-5 mr-3" />,
          active: location === "/hris/payroll",
          module: "hris"
        }
      ]
    }
  ];
  
  // Check if user has access to a module
  const hasModuleAccess = (itemModule: string) => {
    if (!role) return false;
    if (itemModule === "all") return true;
    if (role.module === "admin") return true;
    return role.module === itemModule;
  };
  
  return (
    <aside 
      className={cn(
        "bg-white border-r border-neutral-200 w-64 fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition duration-200 ease-in-out z-10",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      )} 
      style={{ top: "57px", height: "calc(100% - 57px)" }}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Logged in as:</p>
              <p className="text-sm font-semibold text-primary">{role?.name || "User"}</p>
            </div>
            <div className="bg-green-100 px-2 py-1 rounded-full">
              <span className="text-xs text-success font-medium">Active</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Main Navigation</p>
          <ul>
            {/* Dashboard Link - Everyone can access */}
            <li>
              <Link href="/">
                <a className={cn(
                  "flex items-center px-4 py-2 text-neutral-600 hover:bg-neutral-100",
                  location === "/" && "text-primary bg-blue-50 border-l-4 border-primary"
                )}>
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  <span>Dashboard</span>
                </a>
              </Link>
            </li>
            
            {/* Render module-specific nav items */}
            {navItems.filter(item => item.section).map((section, idx) => {
              // Check if user has access to any item in this section
              const hasAccessToSection = section.items?.some(item => 
                hasModuleAccess(item.module)
              );
              
              if (!hasAccessToSection) return null;
              
              return (
                <li key={idx} className="mt-6">
                  <p className="px-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    {section.section}
                  </p>
                  <ul>
                    {section.items?.map((item, itemIdx) => {
                      if (!hasModuleAccess(item.module)) return null;
                      
                      return (
                        <li key={itemIdx}>
                          <Link href={item.href}>
                            <a className={cn(
                              "flex items-center px-4 py-2 text-neutral-600 hover:bg-neutral-100",
                              item.active && "text-primary bg-blue-50 border-l-4 border-primary"
                            )}>
                              {item.icon}
                              <span>{item.title}</span>
                            </a>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-200">
          <ul>
            <li>
              <a href="#" className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded">
                <Settings className="w-5 h-5 mr-3" />
                <span>Settings</span>
              </a>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="flex items-center px-2 py-2 text-neutral-600 hover:bg-neutral-100 rounded w-full text-left"
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
