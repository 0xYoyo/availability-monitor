# Runbook

## Local `.env` Setup

1. Copy [.env.example](/Users/yoyopc/repos/availability-monitor/.env.example) to `.env`.
2. Fill in `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
3. Adjust [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json) for your target dates and `nightCount`.
4. Run:

```bash
npm run monitor:once -- --config ./monitor.config.example.json
```

## Date And Night Controls

Edit [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json):

- `monitor.dateRangeStart`
- `monitor.dateRangeEnd`
- `monitor.nightCount`

Date syntax:

- fixed ISO date, for example `2026-04-13`
- `today`
- `tomorrow`
- `today+N` or `today-N`

Example for your current preference:

- `dateRangeStart: "tomorrow"`
- `dateRangeEnd: "2026-04-13"`
- `nightCount: 2`

That means each run starts checking from the next calendar day onward, while still never allowing a checkout later than April 13, 2026.

## Scheduling Recommendation

Preferred initial approach:

- Keep the app as a one-shot runner.
- Use external scheduling rather than an internal forever-loop.

Why:

- simpler failure model
- easier restarts
- easier to move from local runs to hosted runs

## Free No-Laptop Path

The best zero-cost next step is GitHub Actions scheduling.

Template:

- [github-actions-workflow.example.yml](/Users/yoyopc/repos/availability-monitor/docs/github-actions-workflow.example.yml)
- The repo now also includes a ready workflow at [.github/workflows/availability-monitor.yml](/Users/yoyopc/repos/availability-monitor/.github/workflows/availability-monitor.yml)

Expected GitHub setup:

1. Push this repository to GitHub.
2. Add repository secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Copy the workflow template into `.github/workflows/availability-monitor.yml`.
4. Adjust the cron schedule if needed.

Notes:

- GitHub Actions scheduled workflows run on the default branch.
- Scheduled workflows use UTC time.
- The committed workflow runs every 10 minutes on off-boundary minutes (`7,17,27,37,47,57`) to reduce the chance of GitHub scheduler delays on common cron boundaries.
- GitHub Actions is not exactly a full server replacement, but for this project it can act like one by spinning up a temporary runner on a schedule, executing one monitor cycle, and then shutting down again.
