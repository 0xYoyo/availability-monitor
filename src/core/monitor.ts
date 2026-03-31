import type { AvailabilityChecker } from "./checker.js";
import type { ResolvedMonitorConfig, RoomConfig } from "./config.js";
import type { DateWindow } from "./dateWindows.js";
import {
  applyObservations,
  createEmptyState,
  type ApplyObservationsResult,
  type MonitoringState
} from "./state.js";
import type { AvailabilityObservation } from "./availability.js";

export interface RunMonitorCycleOptions {
  checkedAt: string;
  previousState?: MonitoringState;
}

export interface RunMonitorCycleResult extends ApplyObservationsResult {
  observations: AvailabilityObservation[];
}

export async function runMonitorCycle(
  config: ResolvedMonitorConfig,
  checker: AvailabilityChecker,
  options: RunMonitorCycleOptions
): Promise<RunMonitorCycleResult> {
  const observations = await collectObservations(config, checker, options.checkedAt);
  const previousState = options.previousState ?? createEmptyState();
  const stateResult = applyObservations(previousState, observations, {
    cooldownMinutes: config.cooldownMinutes
  });

  return {
    observations,
    nextState: stateResult.nextState,
    alerts: stateResult.alerts
  };
}

async function collectObservations(
  config: ResolvedMonitorConfig,
  checker: AvailabilityChecker,
  checkedAt: string
): Promise<AvailabilityObservation[]> {
  const observations: AvailabilityObservation[] = [];

  for (const room of config.rooms) {
    for (const dateWindow of config.dateWindows) {
      observations.push(
        await checker.checkAvailability({
          room,
          dateWindow,
          guestCount: config.guestCount,
          checkedAt,
          source: "room_page"
        })
      );
    }
  }

  if (config.generalSearchUrl) {
    const generalRoom = createGeneralSearchRoom(config.generalSearchUrl);

    for (const dateWindow of config.dateWindows) {
      observations.push(
        await checker.checkAvailability({
          room: generalRoom,
          dateWindow,
          guestCount: config.guestCount,
          checkedAt,
          source: "general_page"
        })
      );
    }
  }

  return observations;
}

function createGeneralSearchRoom(generalSearchUrl: string): RoomConfig {
  return {
    id: "__general_search__",
    name: "General Search",
    bookingUrl: generalSearchUrl,
    priority: Number.MAX_SAFE_INTEGER
  };
}
