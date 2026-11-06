# ADR-002: Zero-Incremental-Spend Strategy

- Status: Accepted
- Date: 2026-11-06

## Context
The target is zero incremental spending. The user reports USD 100 in remaining AWS promotional credits and a configured USD 20 limit.

## Decision
Treat USD 0 as the target spend. Treat the reported USD 20 setting as an alert until verified; do not assume it blocks charges. Do not create resources with a charge unless the estimated cost and approval are explicit.

## Consequences
- Prefer the existing host, local WSL resources, and eligible free allocations.
- Avoid always-on paid managed services.
- Stop and remove temporary resources after evidence capture, while preserving required data and the live Voyage deployment.
- Record any substitution for a service named in the assignment and verify whether faculty accepts it.
