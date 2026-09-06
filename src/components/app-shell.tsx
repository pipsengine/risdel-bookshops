import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Icon } from "@/lib/icons";
import { appConfig } from "@/config/app";
import { can } from "@/lib/authz";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  altPermission?: string;
  soon?: boolean;
};

const nav: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "home", permission: "dashboard.view" },
      {
        label: "Organisation",
        href: "/organisation",
        icon: "org",
        permission: "organisation.overview.view"
      }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Sales", href: "#", icon: "sales", soon: true },
      { label: "Catalogue", href: "#", icon: "book", soon: true },
      { label: "Inventory", href: "#", icon: "box", soon: true },
      { label: "Purchasing", href: "#", icon: "cart", soon: true },
      { label: "Customers", href: "#", icon: "users", soon: true },
      { label: "Academic Sales", href: "#", icon: "school", soon: true },
      { label: "Suppliers", href: "#", icon: "supplier", soon: true },
      { label: "Finance", href: "#", icon: "finance", soon: true },
      { label: "Fulfilment", href: "#", icon: "truck", soon: true }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { label: "Reports & Analytics", href: "#", icon: "report", soon: true },
      { label: "Approvals", href: "#", icon: "approve", soon: true },
      { label: "Notifications", href: "#", icon: "bell", soon: true },
      { label: "Documents", href: "#", icon: "doc", soon: true }
    ]
  },
  {
    label: "System",
    items: [
      {
        label: "Administration",
        href: "/administration/security",
        icon: "admin",
        permission: "admin.users.manage",
        altPermission: "security.overview.view"
      },
      {
        label: "Data Provider",
        href: "/administration/data-provider",
        icon: "admin",
        permission: "admin.data-provider.view",
        altPermission: "admin.system.view"
      }
    ]
  }
];

function visible(user: NonNullable<Awaited<ReturnType<typeof getSession>>>, item: NavItem) {
  if (!item.permission) return true;
  return can(user, item.permission) || (item.altPermission ? can(user, item.altPermission) : false);
}

export async function AppShell({
  children,
  active = "Dashboard"
}: {
  children: React.ReactNode;
  active?: string;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.mustChangePassword && active !== "Security") redirect("/security/change-password");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">R</div>
          <div>
            <strong>Risdel Bookshops</strong>
            <small>RISDEL ENTERPRISE</small>
          </div>
        </div>
        <nav className="nav">
          {nav.map((section) => {
            const items = section.items.filter((i) => visible(user, i));
            if (!items.length) return null;
            return (
              <div key={section.label}>
                <div className="nav-label">{section.label}</div>
                {items.map((item) => (
                  <Link
                    key={item.label}
                    className={`nav-item ${active === item.label ? "active" : ""}`}
                    href={item.href}
                  >
                    <span className="nav-icon">
                      <Icon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                    {item.soon && <span className="soon">SOON</span>}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="user-card">
            <div className="avatar">{user.name.charAt(0)}</div>
            <div className="user-info">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <form action={logout}>
              <button className="plain-icon" title="Sign out">
                <Icon name="logout" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-only" aria-label="Open menu">
              ☰
            </button>
            <div className="breadcrumbs">
              Risdel Bookshops &nbsp;/&nbsp; <strong>{active}</strong>
            </div>
          </div>
          <div className="top-actions">
            <span className="branch-chip">◉ {appConfig.branch}</span>
            <button className="icon-btn" aria-label="Search">
              <Icon name="search" />
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <Icon name="bell" />
            </button>
            <div className="profile-menu">
              <Link href="/security/change-password" title="Account security">
                <div className="avatar small">{user.name.charAt(0)}</div>
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
