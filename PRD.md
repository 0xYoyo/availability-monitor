# PRD: Metzoke Availability Monitor

## 1. Overview

Build a small monitoring system that checks Metzoke Dragot room availability and alerts when a matching 2-night stay becomes available during a user-defined Passover date range.

The product is intentionally narrow. It is not a general travel booking platform. It is a focused monitoring tool for one booking target and one decision flow.

## 2. Problem

Desired rooms are often fully booked. Availability may re-open when other guests cancel, and the booking site is expected to reflect those changes automatically. Manual re-checking is tedious and easy to miss.

## 3. Product Goal

Detect newly available matching bookings faster than manual checking and notify the user with enough information to act immediately.

## 4. Primary User Story

As a traveler looking for a Passover stay at Metzoke Dragot, I want the system to monitor flexible 2-night windows across a configured date range and alert me when one of my target room types becomes available, so I can book quickly without manually refreshing the site all day.

## 5. Non-Negotiable Functional Requirements

- Monitor availability for 2 guests.
- Support flexible date search across any valid 2-night slot inside a configured Passover window.
- Support a configurable list of preferred room pages and optionally a general search page.
- Detect newly available results for configured rooms and date windows.
- Persist prior results so alerts are only sent on meaningful changes.
- Expose direct links or enough booking context to act on an alert immediately.

## 6. Nice-to-Have Requirements

- Room priority tiers.
- Multiple alert channels.
- Screenshot on detected change.
- Health check output.
- Configurable cooldown for repeat alerts.
- Optional general-page catch-all monitoring in addition to room-specific monitoring.

## 7. Out of Scope for Initial Delivery

- Automatic booking or checkout completion.
- Multi-property support.
- Full web dashboard before monitoring is proven reliable.
- Rich analytics or historical reporting beyond lightweight state tracking.

## 8. Proposed Technical Strategy

Start with a testable core domain and a pluggable availability checker interface.

Preferred initial approach:

- Runtime: Node.js
- Language: TypeScript
- Browser automation: Playwright
- Tests: Vitest
- State storage: JSON first, SQLite only if needed
- Notifications: Telegram first

Reasoning:

- Playwright is a better fit than static scraping when the booking flow involves interactive date controls and dynamic rendering.
- The site integration should be isolated behind an adapter so the project can later switch to direct HTTP/API calls if the underlying booking engine exposes a stable availability endpoint.

## 9. Product Behavior

### Inputs

- Global date range start
- Global date range end
- Night count, initially fixed at 2
- Guest count, initially fixed at 2
- Preferred room definitions
- Poll interval
- Notification settings

### Derived Search Windows

If the configured range is `2026-04-08` through `2026-04-18`, the system generates every valid 2-night window within that range:

- `2026-04-08 -> 2026-04-10`
- `2026-04-09 -> 2026-04-11`
- `2026-04-10 -> 2026-04-12`
- and so on

### Availability Evaluation

For each polling cycle, the system checks:

- each configured room-specific page for each eligible 2-night window
- optionally the general booking page as a catch-all

Each check produces a normalized result such as:

- `available`
- `unavailable`
- `minimum_stay_blocked`
- `unknown`
- `error`

### Alerting Rule

Notify when:

- a room-window combination changes from unavailable to available
- a newly discovered acceptable room appears

Do not notify repeatedly for unchanged results inside the configured cooldown window.

## 10. Architecture Principles

- Keep business logic independent from the site automation layer.
- Make the site checker replaceable.
- Keep state format simple and inspectable by humans.
- Prefer deterministic unit tests around domain logic.
- Add integration tests only where they meaningfully reduce risk.
- Save enough operational context to resume development without chat history.

## 11. TDD and Quality Expectations

### Development Style

- Write or update tests before implementing non-trivial logic when practical.
- For external-site integration, extract pure logic so it can be tested without a browser.
- Keep functions small and outcomes explicit.

### Test Layers

1. Unit tests
   - date-window generation
   - room matching rules
   - state diffing and dedupe
   - alert decision logic

2. Integration tests
   - config loading
   - state persistence
   - checker interface contract using mocks or fixtures

3. Live/manual verification
   - only for the real booking-site adapter
   - record findings in `CURRENT_STATE.md` and `CHANGE_LOG.md`

### Definition of Done for Each Stage

- Relevant tests exist and pass.
- Docs reflect the new reality.
- `HANDOFF.md` is updated for the next session.
- Known gaps and risks are explicitly recorded.

## 12. Staged Delivery Plan

### Stage 0: Documentation and project skeleton

Goal:

- establish planning, continuity, and repo conventions

Tasks:

- create base docs
- define staged roadmap
- define continuity workflow

Acceptance criteria:

- root docs exist
- project goals and next steps are clear to a fresh agent

### Stage 1: Repo and tooling bootstrap

Goal:

- create the TypeScript project and test harness

Tasks:

- initialize Node project
- add TypeScript, Playwright, Vitest, lint/format choices
- create baseline folder structure
- add first smoke tests

Acceptance criteria:

- install works
- tests run
- basic scripts are documented

### Stage 2: Core domain model

Goal:

- implement the pure logic layer

Tasks:

- design config schema
- implement 2-night date-window generation
- implement availability result model
- implement state comparison and dedupe logic

Acceptance criteria:

- pure core logic is covered by unit tests
- no site-specific assumptions leak into the domain layer

### Stage 3: Checker interface and fake adapter

Goal:

- define how the rest of the app consumes availability results

Tasks:

- create checker interface
- add fake/mock adapter for tests
- implement polling orchestration

Acceptance criteria:

- orchestration runs against fake adapter
- alert decisions can be tested without network access

### Stage 4: Real site integration

Goal:

- connect to the Metzoke booking flow

Tasks:

- inspect room-specific and general booking flows
- implement Playwright adapter first
- evaluate whether direct HTTP is possible
- capture stable selectors or request patterns

Acceptance criteria:

- manual test confirms real result extraction works for at least one room and one date window
- failure handling captures enough debug context

### Stage 5: Notifications and persistence

Goal:

- alert the user reliably without spam

Tasks:

- implement JSON state store
- implement Telegram notifier
- add cooldown and dedupe rules

Acceptance criteria:

- repeated unchanged matches do not re-alert
- newly available matches send a clear actionable alert

### Stage 6: Operational hardening

Goal:

- make the tool dependable for ongoing use

Tasks:

- add run modes
- add retry and timeout behavior
- add logs and debug artifacts
- document deployment options and runbook

Acceptance criteria:

- the tool can run locally in a repeatable way
- recovery steps are documented

## 13. Proposed Initial Repo Layout

```text
.
├── README.md
├── PRD.md
├── CURRENT_STATE.md
├── CHANGE_LOG.md
├── HANDOFF.md
├── src/
├── tests/
└── docs/
```

Exact implementation folders may evolve, but documentation files should remain easy to find from the repo root.

## 14. Key Risks

- The booking engine may rely on dynamic behavior that is awkward to automate.
- Selectors or rendered text may differ between Hebrew and English flows.
- Anti-bot or rate-limiting measures may require slower polling and jitter.
- The authoritative availability signal may be in network responses rather than visible UI.

## 15. Open Product Questions

- Exact Passover date range to monitor
- Final shortlist of room-specific pages to prioritize
- Preferred alert channel after Telegram-first assumption
- Desired polling frequency and acceptable alert noise

## 16. Handoff Rule for Future Sessions

A fresh agent should be able to start from this file plus the repo state on disk. Every implementation session must update:

- `CURRENT_STATE.md`
- `CHANGE_LOG.md`
- `HANDOFF.md`

If goals or scope change, update this `PRD.md` as part of the same session.
