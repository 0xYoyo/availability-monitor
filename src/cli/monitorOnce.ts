import { runMonitorOnce } from "../runtime/runMonitorOnce.js";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const result = await runMonitorOnce({
    configPath: args.configPath,
    checkedAt: args.checkedAt
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        checkedAt: args.checkedAt ?? "auto",
        observationCount: result.observations.length,
        alertCount: result.alerts.length,
        notifiedAlertCount: result.notifiedAlertCount,
        statePath: result.statePath,
        alerts: result.alerts.map((alert) => ({
          key: alert.key,
          roomId: alert.record.roomId,
          checkIn: alert.record.checkIn,
          checkOut: alert.record.checkOut,
          reason: alert.reason
        }))
      },
      null,
      2
    )}\n`
  );
}

function parseArgs(args: string[]): { configPath: string; checkedAt?: string } {
  let configPath: string | undefined;
  let checkedAt: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--config") {
      configPath = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--checked-at") {
      checkedAt = args[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!configPath) {
    throw new Error("Usage: node dist/src/cli/monitorOnce.js --config <path> [--checked-at <iso>]");
  }

  return { configPath, checkedAt };
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
