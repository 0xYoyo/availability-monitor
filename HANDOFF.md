# Handoff

## Read First

1. [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md)
2. [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md)
3. [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md)
4. [README.md](/Users/yoyopc/repos/availability-monitor/README.md)

## Project Intent

Continue building the Metzoke availability monitor in small tested stages. The key product behavior is flexible matching for any 2-night window within a configured Passover date range, with alerts on newly available matching rooms.

## Status At Handoff

- Documentation scaffold exists.
- Empty `src/`, `tests/`, and `docs/` directories exist.
- Tooling bootstrap is complete with Node.js, TypeScript, Vitest, and Playwright.
- The first tested core module exists in [dateWindows.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateWindows.ts).
- Stage 2 pure domain modules now exist in [config.ts](/Users/yoyopc/repos/availability-monitor/src/core/config.ts), [availability.ts](/Users/yoyopc/repos/availability-monitor/src/core/availability.ts), and [state.ts](/Users/yoyopc/repos/availability-monitor/src/core/state.ts).
- Stage 3 app-layer modules now exist in [checker.ts](/Users/yoyopc/repos/availability-monitor/src/core/checker.ts) and [monitor.ts](/Users/yoyopc/repos/availability-monitor/src/core/monitor.ts).
- Stage 4 real adapter code now exists in [ezgoDirect.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/ezgoDirect.ts).
- The repo currently passes `npm test`, `npm run typecheck`, and `npm run build`.
- Next likely milestone is connecting the real adapter into runtime flow and deciding how to handle unsupported general-page checks.

## Guidance for the Next Agent

- Treat [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md) as the main source of product and delivery context.
- Before implementing, verify whether any user decisions have changed since the docs were written.
- Prefer TDD for pure logic and testable interfaces before live-site automation.
- Keep the site-specific checker isolated behind an adapter boundary.
- Use the existing date-window logic as the pattern for the rest of the pure domain layer.
- Reuse the normalized observation and state transition contracts instead of inventing new site-specific shapes.
- Keep the fake checker and monitor-cycle tests intact as the safety net while adding the real adapter.
- Do not hide gaps or shaky signals. If the data is incomplete, prefer `unknown` or `error` and write down why.
- Update this file, [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md), and [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md) before ending the session.

## Recommended Immediate Next Steps

1. Decide how runtime config should choose between the fake checker and the real EZgo direct checker.
2. Wire [ezgoDirect.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/ezgoDirect.ts) into an executable monitoring entrypoint.
3. Decide whether general-page support should use deeper direct-HTTP work or a Playwright fallback.
4. Keep README and continuity docs aligned with each incremental change.

## Suggested Prompt for a Fresh Agent

Read [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md), then [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md), [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md), and [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md). Continue from the current repo state, following the staged plan in the PRD. Work in small increments with TDD, keep documentation synchronized with code changes, and update the handoff files before ending the session.
