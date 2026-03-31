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
- The room-specific direct-HTTP path has now been validated against live site data using the program itself, and the returned 1-night Passover dates matched manual verification.
- The EZgo direct adapter has been hardened with timeout, retry, and embedded-engine-URL caching to improve multi-room scan reliability.
- Stage 5 has started with a notifier contract plus Telegram delivery adapter wired into the one-shot runtime flow.
- Telegram notifier secrets can now be supplied via environment-variable references in runtime config.
- The runtime now auto-loads `.env` and `.env.local`, and the repo includes a runbook plus a GitHub Actions workflow template for a free no-laptop scheduling path.
- Runtime config now supports rolling date expressions like `tomorrow`, which is useful for “start checking from the next day onward” behavior.
- A real end-to-end Telegram delivery test has now succeeded through the program's own runtime path.
- A one-shot runtime flow now exists in [runtimeConfig.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/runtimeConfig.ts), [runMonitorOnce.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/runMonitorOnce.ts), and [monitorOnce.ts](/Users/yoyopc/repos/availability-monitor/src/cli/monitorOnce.ts).
- A starter real-run config now exists in [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json).
- The repo currently passes `npm test`, `npm run typecheck`, and `npm run build`.
- The repo can now run one monitoring cycle via `npm run monitor:once -- --config ./monitor.config.example.json`.
- Next likely milestone is deciding whether to add internal polling/scheduling now or keep one-shot execution and rely on external scheduling, then deciding whether a narrow Playwright fallback is needed at all.

## Current Target Room Pages

- [reservationtp](https://www.metzoke.co.il/reservationtp)
- [reservationtN](https://www.metzoke.co.il/reservationtN)
- [reservationtMUL](https://www.metzoke.co.il/reservationtMUL)
- [reservationmy](https://www.metzoke.co.il/reservationmy)
- [reservationtS](https://www.metzoke.co.il/reservationtS)

## Guidance for the Next Agent

- Treat [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md) as the main source of product and delivery context.
- Before implementing, verify whether any user decisions have changed since the docs were written.
- Prefer TDD for pure logic and testable interfaces before live-site automation.
- Keep the site-specific checker isolated behind an adapter boundary.
- Use the existing date-window logic as the pattern for the rest of the pure domain layer.
- Reuse the normalized observation and state transition contracts instead of inventing new site-specific shapes.
- Keep the fake checker and monitor-cycle tests intact as the safety net while adding the real adapter.
- Do not hide gaps or shaky signals. If the data is incomplete, prefer `unknown` or `error` and write down why.
- The handoff context is intended to be sufficient for a fresh session that starts with “read the handoff file and continue development.”
- Update this file, [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md), and [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md) before ending the session.

## Recommended Immediate Next Steps

1. Decide whether Stage 5 should also include a scheduled polling loop, or whether that belongs to Stage 6 operationalization.
2. Tune the alert message format if needed after reviewing the real Telegram message.
3. Decide whether fallback support should be limited to targeted Playwright recovery for HTTP `error` and `unknown` cases.
4. Record the resolved room-specific EZgo identifiers and any tuned retry settings in the runtime-facing docs/config.

## Suggested Prompt for a Fresh Agent

Read [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md), then [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md), [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md), and [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md). Continue from the current repo state, following the staged plan in the PRD. Work in small increments with TDD, keep documentation synchronized with code changes, and update the handoff files before ending the session.
