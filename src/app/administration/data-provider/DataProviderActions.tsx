"use client";

import { useActionState } from "react";
import {
  testDataProviderConnection,
  validateDataProviderStructure,
  type DiagnosticsActionState
} from "@/app/actions/data-provider";

const initial: DiagnosticsActionState = {};

export function DataProviderActions() {
  const [testState, testAction, testPending] = useActionState(testDataProviderConnection, initial);
  const [validateState, validateAction, validatePending] = useActionState(
    validateDataProviderStructure,
    initial
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <form action={testAction}>
          <button className="btn btn-primary" disabled={testPending} type="submit">
            {testPending ? "Testing…" : "Test connection"}
          </button>
        </form>
        <form action={validateAction}>
          <button className="btn btn-secondary" disabled={validatePending} type="submit">
            {validatePending ? "Validating…" : "Validate structure"}
          </button>
        </form>
      </div>
      {testState.message && (
        <div className={testState.ok ? "muted" : "error"} role="status">
          Connection: {testState.message}
          {testState.checkedAt ? ` (${testState.checkedAt})` : ""}
        </div>
      )}
      {validateState.message && (
        <div className={validateState.ok ? "muted" : "error"} role="status">
          Structure: {validateState.message}
        </div>
      )}
    </div>
  );
}
