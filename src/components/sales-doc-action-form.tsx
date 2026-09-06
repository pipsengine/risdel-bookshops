"use client";
import type React from "react";
import { useActionState } from "react";import type { SalesDocState } from "@/app/actions/sales-documents";
export function SalesDocActionForm({action,children,submitLabel,className=""}:{action:(s:SalesDocState,fd:FormData)=>Promise<SalesDocState>;children:React.ReactNode;submitLabel:string;className?:string}){const [state,formAction,pending]=useActionState<SalesDocState,FormData>(action,{});return <form action={formAction} className={className}>{children}{state.error&&<div className="form-error">{state.error}</div>}{state.success&&<div className="form-success">{state.success}</div>}<button className="btn btn-primary" disabled={pending}>{pending?"Processing…":submitLabel}</button></form>}
