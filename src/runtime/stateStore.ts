import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createEmptyState, type MonitoringState } from "../core/state.js";

export async function loadMonitoringState(filePath: string): Promise<MonitoringState> {
  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    if (!isMonitoringState(parsed)) {
      throw new Error("state file must contain an object with a records map");
    }

    return parsed;
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyState();
    }

    throw error;
  }
}

export async function saveMonitoringState(
  filePath: string,
  state: MonitoringState
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function isMonitoringState(value: unknown): value is MonitoringState {
  return (
    typeof value === "object" &&
    value !== null &&
    "records" in value &&
    typeof (value as { records: unknown }).records === "object" &&
    (value as { records: unknown }).records !== null &&
    !Array.isArray((value as { records: unknown }).records)
  );
}
