import {
  AVAILABILITY_SOURCES,
  AVAILABILITY_STATUSES,
  type AvailabilitySource,
  type AvailabilityStatus
} from "../core/availability.js";
import { addDays, formatIsoDate, parseIsoDate } from "../core/dateUtils.js";
import { parseMonitorConfig, type ResolvedMonitorConfig } from "../core/config.js";

export interface FakeRuntimeRule {
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: AvailabilityStatus;
  source?: AvailabilitySource;
  message?: string;
}

export interface FakeRuntimeCheckerConfig {
  kind: "fake";
  rules: FakeRuntimeRule[];
}

export interface EzgoDirectRuntimeCheckerConfig {
  kind: "ezgo_direct";
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export type RuntimeCheckerConfig =
  | FakeRuntimeCheckerConfig
  | EzgoDirectRuntimeCheckerConfig;

export interface RuntimeConfig {
  stateFilePath: string;
  checker: RuntimeCheckerConfig;
  notifier?: RuntimeNotifierConfig;
  monitor: ResolvedMonitorConfig;
}

export interface NoopRuntimeNotifierConfig {
  kind: "noop";
}

export interface TelegramRuntimeNotifierConfig {
  kind: "telegram";
  botToken: string;
  chatId: string;
  botTokenEnv?: string;
  chatIdEnv?: string;
  apiBaseUrl?: string;
  messagePrefix?: string;
  silent?: boolean;
}

export type RuntimeNotifierConfig =
  | NoopRuntimeNotifierConfig
  | TelegramRuntimeNotifierConfig;

export interface ParseRuntimeConfigOptions {
  now?: Date;
}

export function parseRuntimeConfig(
  input: unknown,
  options: ParseRuntimeConfigOptions = {}
): RuntimeConfig {
  if (!isRecord(input)) {
    throw new Error("config must be an object");
  }

  const now = options.now ?? new Date();

  return {
    stateFilePath: readRequiredString(input, "stateFilePath"),
    checker: parseCheckerConfig(input.checker),
    notifier: parseOptionalNotifierConfig(input.notifier),
    monitor: parseMonitorConfig(resolveRuntimeMonitorConfig(input.monitor, now))
  };
}

function resolveRuntimeMonitorConfig(input: unknown, now: Date): unknown {
  if (!isRecord(input)) {
    return input;
  }

  return {
    ...input,
    dateRangeStart: resolveRuntimeDateValue(
      input.dateRangeStart,
      "config.monitor.dateRangeStart",
      now
    ),
    dateRangeEnd: resolveRuntimeDateValue(
      input.dateRangeEnd,
      "config.monitor.dateRangeEnd",
      now
    )
  };
}

export function resolveRuntimeDateValue(
  value: unknown,
  fieldName: string,
  now: Date
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  const normalized = value.trim().toLowerCase();

  if (ISO_DATE_PATTERN.test(normalized)) {
    return normalized;
  }

  const today = formatIsoDate(now);

  if (normalized === "today") {
    return today;
  }

  if (normalized === "tomorrow") {
    return formatIsoDate(addDays(parseIsoDate(today), 1));
  }

  const offsetMatch = normalized.match(/^today([+-]\d+)$/);

  if (offsetMatch) {
    const offsetDays = Number.parseInt(offsetMatch[1], 10);
    return formatIsoDate(addDays(parseIsoDate(today), offsetDays));
  }

  throw new Error(
    `${fieldName} must be YYYY-MM-DD, today, tomorrow, or today+N/today-N`
  );
}

function parseCheckerConfig(input: unknown): RuntimeCheckerConfig {
  if (!isRecord(input)) {
    throw new Error("config.checker must be an object");
  }

  const kind = readRequiredString(input, "kind", "config.checker");

  if (kind === "fake") {
    return {
      kind,
      rules: parseFakeRules(input.rules)
    };
  }

  if (kind === "ezgo_direct") {
    return {
      kind,
      timeoutMs: readOptionalPositiveInteger(input, "timeoutMs", "config.checker"),
      maxRetries: readOptionalNonNegativeInteger(input, "maxRetries", "config.checker"),
      retryDelayMs: readOptionalNonNegativeInteger(input, "retryDelayMs", "config.checker")
    };
  }

  throw new Error("config.checker.kind must be one of: fake, ezgo_direct");
}

function parseOptionalNotifierConfig(input: unknown): RuntimeNotifierConfig | undefined {
  if (input === undefined) {
    return undefined;
  }

  if (!isRecord(input)) {
    throw new Error("config.notifier must be an object when provided");
  }

  const kind = readRequiredString(input, "kind", "config.notifier");

  if (kind === "noop") {
    return { kind };
  }

  if (kind === "telegram") {
    return {
      kind,
      botToken: readRequiredSecret(
        input,
        "botToken",
        "botTokenEnv",
        "config.notifier"
      ),
      chatId: readRequiredSecret(input, "chatId", "chatIdEnv", "config.notifier"),
      botTokenEnv: readOptionalString(input, "botTokenEnv", "config.notifier"),
      chatIdEnv: readOptionalString(input, "chatIdEnv", "config.notifier"),
      apiBaseUrl: readOptionalString(input, "apiBaseUrl", "config.notifier"),
      messagePrefix: readOptionalString(input, "messagePrefix", "config.notifier"),
      silent: readOptionalBoolean(input, "silent", "config.notifier")
    };
  }

  throw new Error("config.notifier.kind must be one of: noop, telegram");
}

function parseFakeRules(input: unknown): FakeRuntimeRule[] {
  if (!Array.isArray(input)) {
    throw new Error("config.checker.rules must be an array");
  }

  return input.map((value, index) => {
    if (!isRecord(value)) {
      throw new Error(`config.checker.rules[${index}] must be an object`);
    }

    const status = readRequiredString(value, "status", `config.checker.rules[${index}]`);

    if (!AVAILABILITY_STATUSES.includes(status as AvailabilityStatus)) {
      throw new Error(`Unsupported fake checker status: ${status}`);
    }

    const source = readOptionalString(value, "source", `config.checker.rules[${index}]`);

    if (source && !AVAILABILITY_SOURCES.includes(source as AvailabilitySource)) {
      throw new Error(`Unsupported fake checker source: ${source}`);
    }

    return {
      roomId: readRequiredString(value, "roomId", `config.checker.rules[${index}]`),
      checkIn: readRequiredString(value, "checkIn", `config.checker.rules[${index}]`),
      checkOut: readRequiredString(value, "checkOut", `config.checker.rules[${index}]`),
      status: status as AvailabilityStatus,
      source: source as AvailabilitySource | undefined,
      message: readOptionalString(value, "message", `config.checker.rules[${index}]`)
    };
  });
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  path = "config"
): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path}.${key} must be a non-empty string`);
  }

  return value.trim();
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  path = "config"
): string | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path}.${key} must be a non-empty string when provided`);
  }

  return value.trim();
}

function readRequiredSecret(
  record: Record<string, unknown>,
  directKey: string,
  envKey: string,
  path = "config"
): string {
  const directValue = record[directKey];
  const envName = readOptionalString(record, envKey, path);

  if (typeof directValue === "string" && directValue.trim() !== "") {
    return directValue.trim();
  }

  if (envName) {
    const envValue = process.env[envName];

    if (typeof envValue === "string" && envValue.trim() !== "") {
      return envValue.trim();
    }

    throw new Error(`${path}.${envKey} points to an unset or empty environment variable: ${envName}`);
  }

  throw new Error(`${path}.${directKey} must be provided directly or via ${path}.${envKey}`);
}

function readOptionalPositiveInteger(
  record: Record<string, unknown>,
  key: string,
  path = "config"
): number | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${path}.${key} must be a positive integer when provided`);
  }

  return value;
}

function readOptionalBoolean(
  record: Record<string, unknown>,
  key: string,
  path = "config"
): boolean | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${path}.${key} must be a boolean when provided`);
  }

  return value;
}

function readOptionalNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  path = "config"
): number | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${path}.${key} must be a non-negative integer when provided`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
