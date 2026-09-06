import { getDataProvider, persistenceHealth } from "@/data";
import type { Permission, User } from "@/data/contracts/types";

function providerReady() {
  return persistenceHealth().then(
    (h) => h.status === "Healthy" || h.status === "Degraded"
  );
}

export async function listRoles() {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const [roles, userRoles, rolePerms] = await Promise.all([
    db.roles.findMany({ pageSize: 200 }),
    db.userRoles.listAll(),
    db.rolePermissions.listAll()
  ]);
  return roles.items
    .map((r) => ({
      Id: r.id,
      Code: r.code,
      Name: r.name,
      Description: r.description,
      IsSystem: r.isSystem,
      IsActive: r.isActive,
      UserCount: userRoles.filter((ur) => ur.roleId === r.id).length,
      PermissionCount: rolePerms.filter((rp) => rp.roleId === r.id).length
    }))
    .sort((a, b) => Number(b.IsSystem) - Number(a.IsSystem) || a.Name.localeCompare(b.Name));
}

export async function listUsers() {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const [users, userRoles, roles] = await Promise.all([
    db.users.findMany({ pageSize: 200 }),
    db.userRoles.listAll(),
    db.roles.findMany({ pageSize: 200 })
  ]);
  const roleMap = new Map(roles.items.map((r) => [r.id, r.name]));
  return users.items
    .map((u) => {
      const names = userRoles
        .filter((ur) => ur.userId === u.id)
        .map((ur) => roleMap.get(ur.roleId))
        .filter(Boolean);
      return {
        Id: u.id,
        DisplayName: u.displayName,
        Email: u.email,
        IsActive: u.isActive,
        MustChangePassword: u.mustChangePassword,
        FailedLoginCount: u.failedLoginCount,
        LockedUntil: u.lockedUntil,
        LastLoginAt: u.lastLoginAt,
        CreatedAt: u.createdAt,
        Roles: names.join(", ")
      };
    })
    .sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
}

export async function getRole(id: string) {
  if (!(await providerReady())) return null;
  const db = getDataProvider();
  const role = await db.roles.findById(id);
  if (!role) return null;
  const [allPerms, grants] = await Promise.all([
    db.permissions.findMany({ pageSize: 500 }),
    db.rolePermissions.findByRoleId(id)
  ]);
  const granted = new Set(grants.map((g) => g.permissionId));
  const permissions = allPerms.items
    .map((p: Permission) => ({
      Id: p.id,
      PermissionKey: p.permissionKey,
      Module: p.module,
      Name: p.name,
      Description: p.description,
      Granted: granted.has(p.id)
    }))
    .sort((a, b) => a.Module.localeCompare(b.Module) || a.Name.localeCompare(b.Name));
  return {
    role: {
      Id: role.id,
      Code: role.code,
      Name: role.name,
      Description: role.description,
      IsSystem: role.isSystem,
      IsActive: role.isActive
    },
    permissions
  };
}

export async function securitySummary() {
  if (!(await providerReady())) return { users: 0, active: 0, locked: 0, roles: 0, sessions: 0 };
  const db = getDataProvider();
  const now = Date.now();
  const [users, roles, sessions] = await Promise.all([
    db.users.findMany({ pageSize: 500 }),
    db.roles.findMany({ pageSize: 200, activeOnly: true }),
    db.userSessions.listAll()
  ]);
  return {
    users: users.total,
    active: users.items.filter((u) => u.isActive).length,
    locked: users.items.filter((u) => u.lockedUntil && new Date(u.lockedUntil).getTime() > now).length,
    roles: roles.items.length,
    sessions: sessions.filter(
      (s) => !s.revokedAt && new Date(s.expiresAt).getTime() > now
    ).length
  };
}

export async function loginHistory() {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const [history, users] = await Promise.all([
    db.loginHistory.findMany({ pageSize: 100 }),
    db.users.findMany({ pageSize: 500 })
  ]);
  const userMap = new Map(users.items.map((u) => [u.id, u.displayName]));
  return history.items.map((h) => ({
    Id: h.id,
    Email: h.email,
    WasSuccessful: h.wasSuccessful,
    FailureReason: h.failureReason,
    OccurredAt: h.occurredAt,
    DisplayName: h.userId ? userMap.get(h.userId) ?? null : null
  }));
}

export async function activeSessions() {
  if (!(await providerReady())) return [];
  const db = getDataProvider();
  const [sessions, users] = await Promise.all([
    db.userSessions.listAll(),
    db.users.findMany({ pageSize: 500 })
  ]);
  const userMap = new Map(users.items.map((u: User) => [u.id, u]));
  return sessions
    .map((s) => {
      const u = userMap.get(s.userId);
      return {
        Id: s.id,
        CreatedAt: s.createdAt,
        LastSeenAt: s.createdAt,
        ExpiresAt: s.expiresAt,
        RevokedAt: s.revokedAt,
        DisplayName: u?.displayName ?? "Unknown",
        Email: u?.email ?? ""
      };
    })
    .sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)))
    .slice(0, 100);
}

export async function getUser(id: string) {
  if (!(await providerReady())) return null;
  const db = getDataProvider();
  const user = await db.users.findById(id);
  if (!user) return null;
  const userRoles = await db.userRoles.findByUserId(id);
  let roleId: string | null = null;
  let roleName: string | null = null;
  if (userRoles[0]) {
    const role = await db.roles.findById(userRoles[0].roleId);
    roleId = role?.id ?? null;
    roleName = role?.name ?? null;
  }
  const audits = await db.audit.findMany({ pageSize: 100 });
  const userAudits = audits.items
    .filter((a) => a.entityType === "User" && a.entityId === id)
    .slice(0, 20)
    .map((a) => ({
      Id: a.id,
      Action: a.action,
      Description: a.description,
      OccurredAt: a.occurredAt
    }));
  return {
    user: {
      Id: user.id,
      DisplayName: user.displayName,
      Email: user.email,
      Phone: user.phone,
      JobTitle: user.jobTitle,
      IsActive: user.isActive,
      MustChangePassword: user.mustChangePassword,
      FailedLoginCount: user.failedLoginCount,
      LockedUntil: user.lockedUntil,
      LastLoginAt: user.lastLoginAt,
      CreatedAt: user.createdAt,
      RoleId: roleId,
      RoleName: roleName
    },
    audits: userAudits
  };
}
