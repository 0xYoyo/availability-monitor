# Current State

## Snapshot Date

2026-03-31

## Repository Status

- Repository has completed initial tooling bootstrap.
- Stage 2 pure domain modeling is in place.
- Stage 3 checker and orchestration scaffolding is in place.
- Stage 4 real adapter work is in place for direct-HTTP room-page checks.
- The room-specific direct-HTTP path has now been live-verified against the actual site and matched manual validation.
- The direct-HTTP classifier has been corrected for multi-night stays so it checks every occupied night instead of only the boundary dates.
- Stage 5 notifier work has started with a notifier contract and Telegram delivery adapter.
- Telegram notification delivery has now been validated end-to-end through the runtime using a real bot and private chat.
- A one-shot runtime path now exists for loading config, selecting a checker, running one cycle, and persisting JSON state.
- The project is runnable for tests, typechecking, build, and one-shot monitor execution.

## What Exists

- [README.md](/Users/yoyopc/repos/availability-monitor/README.md)
- [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md)
- [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md)
- [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md)
- [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json)
- [RUNBOOK.md](/Users/yoyopc/repos/availability-monitor/docs/RUNBOOK.md)
- [github-actions-workflow.example.yml](/Users/yoyopc/repos/availability-monitor/docs/github-actions-workflow.example.yml)
- [.env.example](/Users/yoyopc/repos/availability-monitor/.env.example)
- `.gitignore`
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
- [telegramNotifier.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/telegramNotifier.ts)
- [notifier.ts](/Users/yoyopc/repos/availability-monitor/src/core/notifier.ts)
- [runtimeConfig.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/runtimeConfig.ts)
- [stateStore.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/stateStore.ts)
- [runMonitorOnce.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/runMonitorOnce.ts)
- [monitorOnce.ts](/Users/yoyopc/repos/availability-monitor/src/cli/monitorOnce.ts)
- [config.test.ts](/Users/yoyopc/repos/availability-monitor/tests/config.test.ts)
- [availability.test.ts](/Users/yoyopc/repos/availability-monitor/tests/availability.test.ts)
- [state.test.ts](/Users/yoyopc/repos/availability-monitor/tests/state.test.ts)
- [checker.test.ts](/Users/yoyopc/repos/availability-monitor/tests/checker.test.ts)
- [monitor.test.ts](/Users/yoyopc/repos/availability-monitor/tests/monitor.test.ts)
- [ezgoDirect.test.ts](/Users/yoyopc/repos/availability-monitor/tests/ezgoDirect.test.ts)
- [telegramNotifier.test.ts](/Users/yoyopc/repos/availability-monitor/tests/telegramNotifier.test.ts)
- [runtimeConfig.test.ts](/Users/yoyopc/repos/availability-monitor/tests/runtimeConfig.test.ts)
- [runMonitorOnce.test.ts](/Users/yoyopc/repos/availability-monitor/tests/runMonitorOnce.test.ts)

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
- Runtime config can now choose between the fake checker and the real EZgo direct checker.
- Runtime config can now also choose between `noop` delivery and Telegram delivery.
- Telegram notifier credentials can now be supplied through environment-variable references instead of being hardcoded into config files.
- The one-shot runtime now auto-loads `.env` files before resolving notifier environment-variable references.
- Runtime monitor config now supports rolling date expressions such as `today`, `tomorrow`, and `today+N`.
- The EZgo direct checker now supports timeout, retry, and retry-delay settings plus cached embedded engine URL resolution.
- A one-shot runner can now load config from disk, reuse persisted JSON state, and save the next state after each cycle.
- The one-shot runner can now also deliver computed alerts through a notifier.
- The Telegram notifier path has now been exercised successfully in a real end-to-end run.
- GitHub Actions hosted execution has now been exercised successfully, but scheduled runs still do not persist state across runs yet.
- Direct HTTP was verified to work by seeding `sDate` and `eDate` in the engine URL and, when needed, using ASP.NET postbacks to advance calendar months.
- The specific room-link HTTP path was also verified end-to-end by running the program itself against live Passover 1-night checks and manually confirming the returned dates.
- The current real adapter intentionally treats general-page checks as `unknown` because that signal has not been proven reliable enough yet.

## Current Target Room Pages

- [reservationtp](https://www.metzoke.co.il/reservationtp)
- [reservationtN](https://www.metzoke.co.il/reservationtN)
- [reservationtMUL](https://www.metzoke.co.il/reservationtMUL)
- [reservationmy](https://www.metzoke.co.il/reservationmy)
- [reservationtS](https://www.metzoke.co.il/reservationtS)

## Decisions Made

- `PRD.md` is the main planning document.
- `HANDOFF.md` must be updated on every meaningful run to support clean session transfer.
- Work should proceed in small stages with TDD expectations.
- Project tooling has been bootstrapped with Node.js, TypeScript, Vitest, and Playwright.
- The repo currently passes `npm test` and `npm run typecheck`.
- The repo also currently passes `npm run build`.
- The repo should prefer `unknown` or `error` over pretending a shaky signal is definitive.

## Outstanding Work

- Keep the domain and orchestration layers independent from Playwright or HTTP details.
- Polish alert message content and decide whether any additional notification channels are needed beyond Telegram-first delivery.
- Decide whether fallback behavior should be a targeted Playwright path only for HTTP `error` and `unknown` results, rather than a co-equal primary path.
- Record the resolved room-specific EZgo `SI` identifiers in runtime-facing docs or config comments.
- Decide whether to keep external scheduling as the only supported operational mode for now, or also add an internal polling loop later.
- Decide whether to keep the committed GitHub Actions workflow as the default deployment path for no-laptop operation.
- Add a viable persistent-state strategy for GitHub Actions so dedupe survives across scheduled runs.

## Known Unknowns

- Whether the general search page can be decoded cleanly over direct HTTP or should use Playwright first.
- Final notification channel preferences.
- Whether state should eventually expire stale records that disappear from subsequent runs.
- How general-page hits should map back to preferred room identities once the real site is integrated.
