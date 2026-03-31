import type { AvailabilityAlert } from "./state.js";

export interface AlertNotifier {
  notifyAlerts(alerts: AvailabilityAlert[]): Promise<void>;
}

export class NoopAlertNotifier implements AlertNotifier {
  async notifyAlerts(_alerts: AvailabilityAlert[]): Promise<void> {
    // Intentionally empty for local runs without delivery configured.
  }
}

