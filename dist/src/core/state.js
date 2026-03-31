import { createObservationKey, validateAvailabilityObservation } from "./availability.js";
export function createEmptyState() {
    return { records: {} };
}
export function applyObservations(previousState, observations, options) {
    if (!Number.isInteger(options.cooldownMinutes) || options.cooldownMinutes < 0) {
        throw new Error("cooldownMinutes must be a non-negative integer");
    }
    const nextRecords = { ...previousState.records };
    const alerts = [];
    for (const observation of observations) {
        validateAvailabilityObservation(observation);
        const key = createObservationKey(observation);
        const previousRecord = previousState.records[key];
        const statusChanged = previousRecord?.currentStatus !== observation.status;
        const nextRecord = {
            key,
            roomId: observation.roomId,
            roomName: observation.roomName,
            checkIn: observation.checkIn,
            checkOut: observation.checkOut,
            nights: observation.nights,
            bookingUrl: observation.bookingUrl,
            source: observation.source,
            currentStatus: observation.status,
            firstSeenAt: previousRecord?.firstSeenAt ?? observation.checkedAt,
            lastCheckedAt: observation.checkedAt,
            lastChangedAt: statusChanged
                ? observation.checkedAt
                : (previousRecord?.lastChangedAt ?? observation.checkedAt),
            lastAvailableAt: observation.status === "available"
                ? observation.checkedAt
                : previousRecord?.lastAvailableAt,
            lastAlertedAt: previousRecord?.lastAlertedAt,
            message: observation.message
        };
        const alertReason = getAlertReason(previousRecord, observation, options.cooldownMinutes);
        if (alertReason) {
            nextRecord.lastAlertedAt = observation.checkedAt;
            alerts.push({
                type: "availability_found",
                key,
                record: nextRecord,
                reason: alertReason
            });
        }
        nextRecords[key] = nextRecord;
    }
    return {
        nextState: {
            records: nextRecords
        },
        alerts
    };
}
function getAlertReason(previousRecord, observation, cooldownMinutes) {
    if (observation.status !== "available") {
        return undefined;
    }
    if (!previousRecord || previousRecord.currentStatus !== "available") {
        return "newly_available";
    }
    if (!previousRecord.lastAlertedAt) {
        return "newly_available";
    }
    const cooldownMs = cooldownMinutes * 60 * 1000;
    if (cooldownMs === 0) {
        return "cooldown_elapsed";
    }
    const elapsedMs = Date.parse(observation.checkedAt) - Date.parse(previousRecord.lastAlertedAt);
    if (elapsedMs >= cooldownMs) {
        return "cooldown_elapsed";
    }
    return undefined;
}
