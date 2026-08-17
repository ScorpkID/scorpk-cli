// v0.1 del CLI: solo dos modos (a diferencia de la extensión, que también
// tiene auto-edit y plan) — manual pide confirmación siempre, auto (--yes)
// no pide nada. Los otros dos modos se pueden sumar después si hace falta.
export type PermissionMode = 'manual' | 'auto';

export interface ApprovalDecision {
  approved: boolean;
  reason?: string;
}

export async function resolveApproval(
  mode: PermissionMode,
  promptUser: () => Promise<boolean>,
): Promise<ApprovalDecision> {
  if (mode === 'auto') return { approved: true };
  return { approved: await promptUser() };
}
