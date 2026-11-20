// The audit log of permission decisions: who tried what, on which row, when,
// whether it was allowed, and why. Admins read their clinic's part of it on
// the audit page; tenancy/clinic-scope.js lists it.
//
// Not every decision is kept. Every refusal is, because a run of refusals is
// how you spot someone probing. Allowed decisions are kept only for the
// sensitive actions below: reading medical notes and changing who may read
// them. Logging every menu link would bury the useful lines.
const AUDITED_WHEN_ALLOWED = new Set(['record:view', 'record:share', 'team:manage']);

// Which clinic's admins see the entry: the clinic of the row, or, for an
// action on no particular row, the clinic of the person who tried.
const clinicOf = (user, resource) => resource?.clinic_id ?? user.clinic_id ?? null;

export function createDecisionLog({ db, clock }) {
  const insert = db.prepare(`INSERT INTO permission_decisions
    (created_at, user_id, action, object, allowed, reason, via, clinic_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  function record(req, { action, resource, decision }) {
    if (decision.allowed && !AUDITED_WHEN_ALLOWED.has(action)) return;
    const object = resource ? `${resource.kind}:${resource.id}` : null;
    insert.run(clock.now(), req.user.id, action, object, decision.allowed ? 1 : 0, decision.reason,
      req.token ? 'api' : 'page', clinicOf(req.user, resource));
  }

  return { record };
}
