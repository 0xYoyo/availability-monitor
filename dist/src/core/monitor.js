import { applyObservations, createEmptyState } from "./state.js";
export async function runMonitorCycle(config, checker, options) {
    const observations = await collectObservations(config, checker, options.checkedAt);
    const previousState = options.previousState ?? createEmptyState();
    const stateResult = applyObservations(previousState, observations, {
        cooldownMinutes: config.cooldownMinutes,
        alertMode: config.alertMode
    });
    return {
        observations,
        nextState: stateResult.nextState,
        alerts: stateResult.alerts
    };
}
async function collectObservations(config, checker, checkedAt) {
    const observations = [];
    for (const room of config.rooms) {
        for (const dateWindow of config.dateWindows) {
            observations.push(await checker.checkAvailability({
                room,
                dateWindow,
                guestCount: config.guestCount,
                checkedAt,
                source: "room_page"
            }));
        }
    }
    if (config.generalSearchUrl) {
        const generalRoom = createGeneralSearchRoom(config.generalSearchUrl);
        for (const dateWindow of config.dateWindows) {
            observations.push(await checker.checkAvailability({
                room: generalRoom,
                dateWindow,
                guestCount: config.guestCount,
                checkedAt,
                source: "general_page"
            }));
        }
    }
    return observations;
}
function createGeneralSearchRoom(generalSearchUrl) {
    return {
        id: "__general_search__",
        name: "General Search",
        bookingUrl: generalSearchUrl,
        priority: Number.MAX_SAFE_INTEGER
    };
}
