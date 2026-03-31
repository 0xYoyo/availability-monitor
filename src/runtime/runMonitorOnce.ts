import { readFile } from "node:fs/promises";
import path from "node:path";

import { EzgoDirectChecker } from "../adapters/ezgoDirect.js";
import { TelegramAlertNotifier } from "../adapters/telegramNotifier.js";
import { FakeAvailabilityChecker, type AvailabilityChecker } from "../core/checker.js";
import { runMonitorCycle, type RunMonitorCycleResult } from "../core/monitor.js";
import { NoopAlertNotifier, type AlertNotifier } from "../core/notifier.js";
import { loadRuntimeEnvironment } from "./env.js";
import { loadMonitoringState, saveMonitoringState } from "./stateStore.js";
import { parseRuntimeConfig } from "./runtimeConfig.js";

export interface RunMonitorOnceOptions {
  configPath: string;
  checkedAt?: string;
}

export interface RunMonitorOnceResult extends RunMonitorCycleResult {
  notifiedAlertCount: number;
  statePath: string;
}

export async function runMonitorOnce(
  options: RunMonitorOnceOptions
): Promise<RunMonitorOnceResult> {
  const configPath = path.resolve(options.configPath);
  const configDirectory = path.dirname(configPath);
  loadRuntimeEnvironment(configPath);
  const config = parseRuntimeConfig(
    JSON.parse(await readFile(configPath, "utf8")) as unknown
  );
  const statePath = path.resolve(configDirectory, config.stateFilePath);
  const previousState = await loadMonitoringState(statePath);
  const checker = createChecker(config);
  const notifier = createNotifier(config);
  const checkedAt = options.checkedAt ?? new Date().toISOString();

  const result = await runMonitorCycle(config.monitor, checker, {
    checkedAt,
    previousState
  });

  await saveMonitoringState(statePath, result.nextState);
  await notifier.notifyAlerts(result.alerts);

  return {
    ...result,
    notifiedAlertCount: result.alerts.length,
    statePath
  };
}

function createChecker(config: ReturnType<typeof parseRuntimeConfig>): AvailabilityChecker {
  if (config.checker.kind === "fake") {
    return new FakeAvailabilityChecker(config.checker.rules);
  }

  return new EzgoDirectChecker(undefined, {
    timeoutMs: config.checker.timeoutMs,
    maxRetries: config.checker.maxRetries,
    retryDelayMs: config.checker.retryDelayMs
  });
}

function createNotifier(config: ReturnType<typeof parseRuntimeConfig>): AlertNotifier {
  if (!config.notifier || config.notifier.kind === "noop") {
    return new NoopAlertNotifier();
  }

  return new TelegramAlertNotifier({
    botToken: config.notifier.botToken,
    chatId: config.notifier.chatId,
    apiBaseUrl: config.notifier.apiBaseUrl,
    messagePrefix: config.notifier.messagePrefix,
    silent: config.notifier.silent
  });
}
