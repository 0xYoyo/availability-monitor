# Current State

## Snapshot Date

2026-03-31

## Repository Status

- Repository has completed initial tooling bootstrap.
- Stage 2 pure domain modeling is in place.
- Stage 3 checker and orchestration scaffolding is in place.
- Stage 4 real adapter work is in place for direct-HTTP room-page checks.
- The project is runnable for tests, typechecking, and build.

## What Exists

- [README.md](/Users/yoyopc/repos/availability-monitor/README.md)
- [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md)
- [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md)
- [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md)
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- `src/`
- `tests/`
- `docs/`

## Implemented Code

- [dateWindows.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateWindows.ts)
- [dateWindows.test.ts](/Users/yoyopc/repos/availability-monitor/tests/dateWindows.test.ts)
- [dateUtils.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateUtils.ts)
- [config.ts](/Users/yoyopc/repos/availability-monitor/src/core/config.ts)
- [availability.ts](/Users/yoyopc/repos/availability-monitor/src/core/availability.ts)
- [state.ts](/Users/yoyopc/repos/availability-monitor/src/core/state.ts)
- [checker.ts](/Users/yoyopc/repos/availability-monitor/src/core/checker.ts)
- [monitor.ts](/Users/yoyopc/repos/availability-monitor/src/core/monitor.ts)
- [ezgoDirect.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/ezgoDirect.ts)
- [config.test.ts](/Users/yoyopc/repos/availability-monitor/tests/config.test.ts)
- [availability.test.ts](/Users/yoyopc/repos/availability-monitor/tests/availability.test.ts)
- [state.test.ts](/Users/yoyopc/repos/availability-monitor/tests/state.test.ts)
- [checker.test.ts](/Users/yoyopc/repos/availability-monitor/tests/checker.test.ts)
- [monitor.test.ts](/Users/yoyopc/repos/availability-monitor/tests/monitor.test.ts)
- [ezgoDirect.test.ts](/Users/yoyopc/repos/availability-monitor/tests/ezgoDirect.test.ts)

## Confirmed Product Direction

- Build a Metzoke availability monitor.
- Flexible date matching for any 2-night window during a configured Passover date range is a core feature, not a later enhancement.
- Initial likely stack: Node.js + TypeScript + Playwright + Vitest + JSON state + Telegram notifier.
- The first implemented domain behavior is generation of all valid windows inside an inclusive date range.
- Monitoring config is now parsed into a normalized resolved config that includes derived date windows.
- Availability checks are modeled as normalized observations with explicit status and source fields.
- State transitions now support deduped availability alerts with cooldown-based re-alerting.
- A checker contract now exists for room/date-window checks that return normalized observations.
- A fake checker adapter now supports application-layer testing without external site access.
- One monitor cycle can now collect observations and apply them into state plus alerts.
- A real direct-HTTP adapter now exists for room-specific EZgo pages.
- Direct HTTP was verified to work by seeding `sDate` and `eDate` in the engine URL and, when needed, using ASP.NET postbacks to advance calendar months.
- The current real adapter intentionally treats general-page checks as `unknown` because that signal has not been proven reliable enough yet.

## Decisions Made

- `PRD.md` is the main planning document.
- `HANDOFF.md` must be updated on every meaningful run to support clean session transfer.
- Work should proceed in small stages with TDD expectations.
- Project tooling has been bootstrapped with Node.js, TypeScript, Vitest, and Playwright.
- The repo currently passes `npm test` and `npm run typecheck`.
- The repo also currently passes `npm run build`.
- The repo should prefer `unknown` or `error` over pretending a shaky signal is definitive.

## Outstanding Work

- Decide exact monitored room pages and final date range.
- Move from fake adapter to a real site integration adapter.
- Decide whether the next real integration step should deepen the direct-HTTP path further or add a Playwright fallback for unsupported flows.
- Keep the domain and orchestration layers independent from Playwright or HTTP details.
- Wire the new real adapter into the orchestration path with runtime config.

## Known Unknowns

- Whether the booking engine can be checked more reliably via direct HTTP than browser automation.
- Which room pages are highest priority.
- Final notification channel preferences.
- Whether state should eventually expire stale records that disappear from subsequent runs.
- How general-page hits should map back to preferred room identities once the real site is integrated.
- Whether the general search page can be decoded cleanly over direct HTTP or should use Playwright first.
