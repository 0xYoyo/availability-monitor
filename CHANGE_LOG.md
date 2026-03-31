# Change Log

## 2026-03-31

- Added the first real site adapter in [ezgoDirect.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/ezgoDirect.ts) for direct-HTTP room-page checks against EZgo.
- Added Stage 4 parser and classification coverage in [ezgoDirect.test.ts](/Users/yoyopc/repos/availability-monitor/tests/ezgoDirect.test.ts).
- Verified through live external inspection that EZgo room pages accept `sDate` and `eDate`, expose server-rendered calendar availability titles, and support ASP.NET postbacks for month navigation.
- Documented the quality rule that uncertain signals must remain `unknown` or `error` rather than being guessed.
- Verified the repo passes `npm test`, `npm run typecheck`, and `npm run build` after Stage 4.
- Added the checker contract and fake adapter in [checker.ts](/Users/yoyopc/repos/availability-monitor/src/core/checker.ts).
- Added one monitoring-cycle orchestrator in [monitor.ts](/Users/yoyopc/repos/availability-monitor/src/core/monitor.ts) to collect observations and apply state transitions.
- Added Stage 3 unit coverage in [checker.test.ts](/Users/yoyopc/repos/availability-monitor/tests/checker.test.ts) and [monitor.test.ts](/Users/yoyopc/repos/availability-monitor/tests/monitor.test.ts).
- Verified the repo passes `npm test`, `npm run typecheck`, and `npm run build` after Stage 3.
- Added shared date helpers in [dateUtils.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateUtils.ts) and refactored window generation to use them.
- Added normalized monitoring config parsing in [config.ts](/Users/yoyopc/repos/availability-monitor/src/core/config.ts), including derived flexible date windows.
- Added normalized availability observation types and validation in [availability.ts](/Users/yoyopc/repos/availability-monitor/src/core/availability.ts).
- Added state transition and alert-deduplication logic in [state.ts](/Users/yoyopc/repos/availability-monitor/src/core/state.ts).
- Added Stage 2 unit coverage in [config.test.ts](/Users/yoyopc/repos/availability-monitor/tests/config.test.ts), [availability.test.ts](/Users/yoyopc/repos/availability-monitor/tests/availability.test.ts), and [state.test.ts](/Users/yoyopc/repos/availability-monitor/tests/state.test.ts).
- Verified the repo passes `npm test`, `npm run typecheck`, and `npm run build` after Stage 2.
- Initialized the Node project and created [package.json](/Users/yoyopc/repos/availability-monitor/package.json).
- Installed TypeScript, Vitest, Node type definitions, and Playwright as development dependencies.
- Added [tsconfig.json](/Users/yoyopc/repos/availability-monitor/tsconfig.json) and [vitest.config.ts](/Users/yoyopc/repos/availability-monitor/vitest.config.ts).
- Added the first core domain module in [dateWindows.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateWindows.ts) for generating valid flexible stay windows.
- Added unit coverage in [dateWindows.test.ts](/Users/yoyopc/repos/availability-monitor/tests/dateWindows.test.ts) for valid windows and validation errors.
- Verified the repo passes `npm test` and `npm run typecheck`.
- Created initial repository documentation scaffold.
- Added the first product requirements document in [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md).
- Added operational continuity files: [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md) and [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md).
- Added [README.md](/Users/yoyopc/repos/availability-monitor/README.md) with project purpose and working agreement.
- Captured the staged delivery approach, TDD expectations, and file update rules for future sessions.
- Added empty `src/`, `tests/`, and `docs/` directories to match the planned repo layout.
