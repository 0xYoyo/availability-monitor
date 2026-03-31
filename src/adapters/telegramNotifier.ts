import type { AlertNotifier } from "../core/notifier.js";
import type { AvailabilityAlert } from "../core/state.js";

type FetchLike = typeof fetch;

export interface TelegramNotifierOptions {
  botToken: string;
  chatId: string;
  apiBaseUrl?: string;
  messagePrefix?: string;
  silent?: boolean;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  description?: string;
}

export class TelegramAlertNotifier implements AlertNotifier {
  constructor(
    private readonly options: TelegramNotifierOptions,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  async notifyAlerts(alerts: AvailabilityAlert[]): Promise<void> {
    for (const alert of alerts) {
      const response = await this.fetchImpl(buildTelegramUrl(this.options), {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          chat_id: this.options.chatId,
          text: formatAvailabilityAlertMessage(alert, this.options.messagePrefix),
          disable_notification: this.options.silent ?? false
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API request failed: ${response.status}`);
      }

      const payload = (await response.json()) as TelegramSendMessageResponse;

      if (!payload.ok) {
        throw new Error(payload.description ?? "Telegram API request was not acknowledged");
      }
    }
  }
}

export function formatAvailabilityAlertMessage(
  alert: AvailabilityAlert,
  prefix?: string
): string {
  const lines = [
    prefix?.trim(),
    "Availability found",
    `Room: ${alert.record.roomName}`,
    `Dates: ${alert.record.checkIn} -> ${alert.record.checkOut} (${alert.record.nights} night${alert.record.nights === 1 ? "" : "s"})`,
    `Reason: ${alert.reason}`,
    `Status: ${alert.record.currentStatus}`,
    `Booking: ${alert.record.bookingUrl}`,
    alert.record.message ? `Signal: ${alert.record.message}` : undefined
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

function buildTelegramUrl(options: TelegramNotifierOptions): string {
  const baseUrl = (options.apiBaseUrl ?? "https://api.telegram.org").replace(/\/+$/, "");
  return `${baseUrl}/bot${options.botToken}/sendMessage`;
}

