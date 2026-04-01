# Availability Monitor

A focused availability monitor for [Metzoke Dragot](https://www.metzoke.co.il/) that checks room-specific booking pages and sends Telegram alerts for matching stay windows.

This project is currently optimized for one property and a curated list of Metzoke Dragot room pages. It is not yet a broad booking-engine monitor for the wider hotel network.

## What It Does

- checks a configured list of Metzoke Dragot room pages
- supports flexible date windows inside a configured range
- supports configurable stay length, guest count, and polling interval
- sends Telegram notifications for matching availability
- can run locally or on GitHub Actions

## Current Scope

Implemented and working today:

- room-specific EZgo direct-HTTP checks for Metzoke Dragot
- 1-night and multi-night stay validation
- Telegram alert delivery
- local `.env` setup
- GitHub Actions scheduled runs

Not implemented as a primary path:

- broad general-engine monitoring across the hotel network
- generalized multi-property support
- Playwright fallback as a default monitoring path

## Requirements

- Node.js 22 or newer recommended
- npm
- a Telegram bot token
- a Telegram chat ID

## Quick Start

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Copy [.env.example](/Users/yoyopc/repos/availability-monitor/.env.example) to `.env`.
4. Put your Telegram credentials into `.env`:

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

5. Edit [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json) for your dates, nights, and room list.
6. Run one monitoring cycle:

```bash
npm run monitor:once -- --config ./monitor.config.example.json
```

## Telegram Setup

### Create a Bot

1. Open Telegram and message `@BotFather`.
2. Run `/newbot`.
3. Follow the prompts.
4. Copy the bot token into `.env` as `TELEGRAM_BOT_TOKEN`.

### Get Your Chat ID

1. Open your bot chat.
2. Send `/start`.
3. Send a normal message like `test`.
4. Use Telegram `getUpdates` once to inspect the chat ID, or use any equivalent Telegram method you prefer.
5. Put that value into `.env` as `TELEGRAM_CHAT_ID`.

For a private chat, the ID is usually a plain positive integer.

## Configuration

The main runtime file is [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json).

Important fields:

- `monitor.dateRangeStart`
- `monitor.dateRangeEnd`
- `monitor.nightCount`
- `monitor.guestCount`
- `monitor.pollIntervalMinutes`
- `monitor.alertMode`
- `monitor.rooms`

### Date Configuration

Supported date formats:

- fixed ISO date, for example `2026-04-13`
- `today`
- `tomorrow`
- `today+N`
- `today-N`

Example:

```json
"monitor": {
  "dateRangeStart": "tomorrow",
  "dateRangeEnd": "2026-04-13",
  "nightCount": 2
}
```

That means:

- each run starts checking from the next calendar day onward
- it only considers windows whose checkout is not later than `2026-04-13`

### Alert Mode

Supported alert modes:

- `newly_available`
- `all_currently_available`

If you want every run to send every currently matching opportunity, use:

```json
"alertMode": "all_currently_available"
```

## Current Target Room Pages

The example config currently includes these Metzoke Dragot room pages:

- [reservationtp](https://www.metzoke.co.il/reservationtp)
- [reservationtN](https://www.metzoke.co.il/reservationtN)
- [reservationtMUL](https://www.metzoke.co.il/reservationtMUL)
- [reservationmy](https://www.metzoke.co.il/reservationmy)
- [reservationtS](https://www.metzoke.co.il/reservationtS)
- [reservationtpPART](https://www.metzoke.co.il/reservationtpPART)
- [reservationt](https://www.metzoke.co.il/reservationt)
- [reservationtNP](https://www.metzoke.co.il/reservationtNP)

You can edit the `rooms` array in [monitor.config.example.json](/Users/yoyopc/repos/availability-monitor/monitor.config.example.json) to remove or reorder them.

## Available Commands

- `npm test`
- `npm run test:watch`
- `npm run typecheck`
- `npm run build`
- `npm run monitor:once -- --config ./monitor.config.example.json`

## Running Without Your Laptop

The simplest no-laptop setup is GitHub Actions.

The repo already includes a workflow:

- [.github/workflows/availability-monitor.yml](/Users/yoyopc/repos/availability-monitor/.github/workflows/availability-monitor.yml)

### GitHub Actions Setup

1. Push the repository to GitHub.
2. In your GitHub repo, go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Add repository secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Make sure the workflow file exists on the default branch.
5. Open `Actions` and manually run the workflow once to verify setup.

The committed workflow is configured to run every 10 minutes on off-boundary minutes to reduce GitHub scheduler delays.

## Notes On Current Architecture

- the primary working integration is direct HTTP against room-specific EZgo pages
- multi-night stays are validated across every occupied night in the stay window
- the current implementation is intentionally property-specific
- the general broad booking engine path is not yet the main supported monitoring strategy

## Troubleshooting

### No Telegram Messages

Check:

- `.env` exists locally
- `TELEGRAM_BOT_TOKEN` is valid
- `TELEGRAM_CHAT_ID` is correct
- you already sent a message to the bot
- your configured date window still contains valid stay windows

### GitHub Actions Manual Runs Work But Scheduled Runs Do Not

Check:

- the workflow file is on the default branch
- Actions are enabled for the repo
- the schedule block exists in `.github/workflows/availability-monitor.yml`
- repository secrets are set

GitHub scheduled workflows can be delayed, especially on crowded cron boundaries, which is why this project uses off-boundary minutes.

## Additional Docs

- [RUNBOOK.md](/Users/yoyopc/repos/availability-monitor/docs/RUNBOOK.md)
- [PRD.md](/Users/yoyopc/repos/availability-monitor/PRD.md)
- [CURRENT_STATE.md](/Users/yoyopc/repos/availability-monitor/CURRENT_STATE.md)
- [CHANGE_LOG.md](/Users/yoyopc/repos/availability-monitor/CHANGE_LOG.md)
- [HANDOFF.md](/Users/yoyopc/repos/availability-monitor/HANDOFF.md)
