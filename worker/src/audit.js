import { randomId } from './crypto.js';

// Audit actor identity is resolved from the session authenticated earlier in the
// same request, so callers cannot spoof it.
export function createAudit(env, state) {
  async function auditLog(actorName, actorRole, org, actionType, entityType, entityId, summary, oldVal = null, newVal = null, actorUserId = null) {
    const session = state.activeSession;
    const resolvedActorName = session?.full_name || actorName || 'System';
    const resolvedActorRole = session?.role_code || actorRole || 'Staff';
    const resolvedActorUserId = session?.user_id || actorUserId || null;

    const id = randomId();
    await env.DB.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, actor_name, actor_role, organization, action_type, entity_type, entity_id, delta_summary, old_values, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      resolvedActorUserId,
      resolvedActorName,
      resolvedActorRole,
      session?.bank_name || org || 'Surge Solutions',
      actionType,
      entityType,
      entityId,
      summary,
      oldVal ? JSON.stringify(oldVal) : null,
      newVal ? JSON.stringify(newVal) : null
    ).run();
  }

  return { auditLog };
}

export async function getAssetReadiness(env, asset) {
  const injunctionRow = await env.DB.prepare(`
    SELECT li.injunction_active, li.verification_status, li.instrument_ref
    FROM legal_instruments li
    JOIN enforcement_cases ec ON li.case_id = ec.id
    WHERE ec.asset_id = ? AND li.injunction_active = 1
  `).bind(asset.id).first();
  const activeInjunction = !!injunctionRow;

  const title = await env.DB.prepare(`
    SELECT tr.verification_status,
      EXISTS(SELECT 1 FROM documents d WHERE d.id = tr.document_id AND d.asset_id = tr.asset_id) AS has_document
    FROM title_records tr WHERE tr.asset_id = ?
  `).bind(asset.id).first();
  const titleVerified = title?.verification_status === 'Verified' && title.has_document === 1;

    const enforcement = await env.DB.prepare(`
      SELECT ec.status,
        COUNT(li.id) AS instrument_count,
        SUM(CASE WHEN li.verification_status = 'Verified' AND EXISTS (
          SELECT 1 FROM documents d
          WHERE d.asset_id = ec.asset_id
            AND d.category = 'Legal Instrument'
            AND d.title = li.instrument_type || ' ' || li.instrument_ref
        ) THEN 1 ELSE 0 END) AS verified_instrument_count
      FROM enforcement_cases ec
      LEFT JOIN legal_instruments li ON li.case_id = ec.id
      WHERE ec.asset_id = ?
      GROUP BY ec.id
    `).bind(asset.id).first();
    const instrumentsVerified = !!enforcement &&
      enforcement.instrument_count > 0 &&
      enforcement.instrument_count === enforcement.verified_instrument_count;
    const legalClearanceIssued = enforcement?.status === 'Cleared' && instrumentsVerified;

    const valuation = await env.DB.prepare(`
      SELECT v.status, v.review_required, v.expiry_date,
        EXISTS(SELECT 1 FROM documents d WHERE d.id = v.document_id AND d.asset_id = v.asset_id) AS has_document
    FROM valuations v WHERE asset_id = ?
    ORDER BY valuation_date DESC, rowid DESC LIMIT 1
  `).bind(asset.id).first();
  const valuationValid = !!valuation && (
    valuation.status === 'Valid' &&
    valuation.review_required === 0 &&
    valuation.has_document === 1 &&
    Date.parse(`${valuation.expiry_date}T23:59:59Z`) >= Date.now()
  );

  const imageCount = await env.DB.prepare(`SELECT COUNT(*) as c FROM asset_images WHERE asset_id = ?`).bind(asset.id).first();
  const photoRequirementMet = (imageCount?.c || 0) >= 1;
  const reservePriceSet = !!asset.reserve_price && asset.reserve_price > 0;
  const gates = [
    {
      gate: 'LG-2 Injunction & Legal Clear',
      passed: !activeInjunction && legalClearanceIssued,
      detail: activeInjunction
        ? `Active Injunction on ${injunctionRow.instrument_ref}`
        : legalClearanceIssued
          ? 'All enforcement instruments verified and legal clearance issued'
          : 'Enforcement instruments and legal clearance are pending'
    },
    { gate: 'TL-2 Title Perfection', passed: titleVerified, detail: titleVerified ? 'Title and deed verified by Surge' : 'Title details and supporting deed pending verification' },
    { gate: 'VL-1 Valuation Validity Window', passed: valuationValid, detail: valuation ? `${valuation.status}${valuation.review_required ? ' - review required' : ''}; expires ${valuation.expiry_date}` : 'No valuation submitted' },
    { gate: 'AS-4 Photo Documentation', passed: photoRequirementMet, detail: `${imageCount?.c || 0} media assets verified` },
    { gate: 'AS-8 Reserve Price Guard', passed: reservePriceSet, detail: `GHS ${asset.reserve_price?.toLocaleString()}` }
  ];
  return { allPass: gates.every(gate => gate.passed) && !asset.legal_hold_active, gates };
}
