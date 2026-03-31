# Availability Monitor

An availability monitor for [Metzoke Dragot](https://www.metzoke.co.il/) that watches for matching room availability during Passover and alerts when a suitable 2-night stay opens up.

This repository is being developed in staged increments with TDD and persistent run-to-run documentation so work can continue cleanly across agent sessions.

## Purpose

The target use case is:

- 2 guests
- 2-night stays
- flexible dates within a Passover date window
- a shortlist of preferred room types
- fast notification when a matching slot becomes available

## Core Documents

- [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md): Product and delivery source of truth.
- [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md): Snapshot of what exists now.
- [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md): Reverse-chronological project changes.
- [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md): Fresh-session continuity file for the next agent.
- [RUNBOOK.md](/Users/yoyopc/repos/availability-monitor/docs/RUNBOOK.md): Local run, `.env`, and hosted scheduling notes.

## Current Tooling

- Node.js
- TypeScript
- Vitest
- Playwright

## Available Commands

- `npm test`: run the test suite once
- `npm run test:watch`: run tests in watch mode
- `npm run typecheck`: run the TypeScript checker
- `npm run build`: compile TypeScript into `dist/`
- `npm run monitor:once -- --config ./monitor.config.example.json`: build and run one monitoring cycle

## Current Implemented Slice

- project bootstrap is complete
- test runner and TypeScript config are in place
- first core domain logic exists for generating flexible date windows
- normalized monitoring config parsing exists
- normalized availability observation/result modeling exists
- state snapshot and alert-dedupe logic exists
- checker interface and fake checker adapter exist
- one polling-cycle orchestrator exists and runs against the normalized contracts
- first real EZgo direct-HTTP room-page adapter exists
- the room-specific EZgo HTTP path has now been manually validated against live Passover 1-night checks
- the EZgo checker now includes retry, timeout, and embedded-engine-URL caching to reduce transient live-site failures
- runtime config parsing and JSON state persistence exist for one-shot execution
- a compiled CLI entrypoint can now run one monitor cycle against either the fake checker or the real EZgo checker
- a notifier interface now exists, with Telegram as the first real delivery adapter
- unit tests cover the current pure domain behavior and validation rules

## Core Domain Modules

- [dateUtils.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateUtils.ts): shared ISO date helpers
- [dateWindows.ts](/Users/yoyopc/repos/availability-monitor/src/core/dateWindows.ts): flexible stay-window generation
- [config.ts](/Users/yoyopc/repos/availability-monitor/src/core/config.ts): config parsing and enrichment
- [availability.ts](/Users/yoyopc/repos/availability-monitor/src/core/availability.ts): normalized observation types and validation
- [state.ts](/Users/yoyopc/repos/availability-monitor/src/core/state.ts): state snapshot updates and alert decision logic
- [checker.ts](/Users/yoyopc/repos/availability-monitor/src/core/checker.ts): checker contract and fake adapter
- [monitor.ts](/Users/yoyopc/repos/availability-monitor/src/core/monitor.ts): one-cycle monitoring orchestration
- [ezgoDirect.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/ezgoDirect.ts): direct-HTTP EZgo room-page adapter
- [telegramNotifier.ts](/Users/yoyopc/repos/availability-monitor/src/adapters/telegramNotifier.ts): Telegram alert delivery
- [runtimeConfig.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/runtimeConfig.ts): runtime file parsing and checker selection
- [runMonitorOnce.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/runMonitorOnce.ts): one-shot runtime flow
- [stateStore.ts](/Users/yoyopc/repos/availability-monitor/src/runtime/stateStore.ts): JSON-backed state loading and persistence
- [monitorOnce.ts](/Users/yoyopc/repos/availability-monitor/src/cli/monitorOnce.ts): CLI wrapper around the one-shot runner
- [notifier.ts](/Users/yoyopc/repos/availability-monitor/src/core/notifier.ts): notifier contract and no-op notifier

## Runtime Config

- Use [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json) as the starting point for a real run.
- `checker.kind` currently supports `fake` and `ezgo_direct`.
- `ezgo_direct` also supports optional `timeoutMs`, `maxRetries`, and `retryDelayMs` runtime settings.
- `notifier.kind` currently supports `noop` and `telegram`.
- Telegram secrets can be provided directly or via `botTokenEnv` and `chatIdEnv` environment-variable references.
- The one-shot runtime now auto-loads `.env` and `.env.local` from the project/config directory before parsing notifier env references.
- Rolling monitor dates such as `tomorrow` and `today+3` are now supported in runtime config.
- `stateFilePath` is resolved relative to the config file location.
- Room `bookingUrl` values may point at the Metzoke marketing pages; the EZgo adapter resolves the embedded engine URL internally.

## Stage 4 Findings

- Direct HTTP is viable for room-specific EZgo pages that have an `SI` identifier.
- The specific room-link HTTP path was live-verified from the program itself and matched manual human verification for current 1-night Passover checks.
- The EZgo engine accepts `sDate` and `eDate` query params and reflects them in server-rendered HTML.
- The engine is an ASP.NET WebForms app, so deeper calendar inspection uses `__VIEWSTATE` plus `__EVENTTARGET` postbacks rather than a clean JSON API.
- For room-specific pages, availability signals can be derived from server-rendered calendar cell titles such as `פנוי`, `מלא`, and `מינימום לילות`.
- Repeated multi-room scans were initially flaky, so the adapter was hardened with timeout, retry, and engine-URL caching; a live multi-room probe now completes successfully.
- General-page direct-HTTP parsing is not implemented yet and should be treated as `unknown`, not guessed.

## Stage Status

- Stage 4 is effectively complete for the accepted primary path: room-specific EZgo direct HTTP.
- Stage 5 has started: the codebase now has notifier delivery wiring, with Telegram as the first real channel.
- Telegram delivery has now been validated end-to-end through the program's own runtime flow.
- General-page support and Playwright fallback are still optional follow-on work, not blockers for initial delivery.

## Current Target Room Pages

- [reservationtp](https://www.metzoke.co.il/reservationtp)
- [reservationtN](https://www.metzoke.co.il/reservationtN)
- [reservationtMUL](https://www.metzoke.co.il/reservationtMUL)
- [reservationmy](https://www.metzoke.co.il/reservationmy)
- [reservationtS](https://www.metzoke.co.il/reservationtS)

## Working Agreement

- Build in small stages.
- Prefer tests before or alongside implementation.
- Keep docs updated on every meaningful run.
- Treat `PRD.md` as the main planning context for a fresh agent.
- Treat `HANDOFF.md` as the first file to update before ending a session.
- Never hide uncertainty: if a signal is incomplete or unreliable, return `unknown` or `error` and document the gap.

## Initial Planned Stages

1. Project scaffolding and documentation.
2. Domain model and date-window generation logic.
3. Availability checking adapter with a testable interface.
4. Site integration via browser automation or direct HTTP, depending on findings.
5. Alerting and state deduplication.
6. Packaging, runbook, and operational hardening.
