"use client";
import { useActionState } from "react";
import { createRole,type RoleState } from "@/app/actions/roles";
const initial:RoleState={};
export function CreateRoleForm(){const [state,action,pending]=useActionState(createRole,initial);return <form action={action} className="form-stack"><div className="field"><label>Role name *</label><input className="input" name="name" required placeholder="e.g. Customer Service Officer"/></div><div className="field"><label>Description</label><textarea className="input" name="description" rows={3} placeholder="What this role is responsible for"/></div>{state.error&&<div className="alert alert-danger">{state.error}</div>}{state.success&&<div className="alert alert-success">{state.success}</div>}<div className="form-actions"><button className="btn btn-primary" disabled={pending}>{pending?'Creating…':'Create role'}</button></div></form>}
