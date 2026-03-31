export class FakeAvailabilityChecker {
    rules;
    constructor(rules) {
        this.rules = rules;
    }
    async checkAvailability(request) {
        const matchingRule = this.rules.find((rule) => rule.roomId === request.room.id &&
            rule.checkIn === request.dateWindow.checkIn &&
            rule.checkOut === request.dateWindow.checkOut);
        return {
            roomId: request.room.id,
            roomName: request.room.name,
            checkIn: request.dateWindow.checkIn,
            checkOut: request.dateWindow.checkOut,
            nights: request.dateWindow.nights,
            status: matchingRule?.status ?? "unavailable",
            checkedAt: request.checkedAt,
            bookingUrl: request.room.bookingUrl,
            source: matchingRule?.source ?? request.source,
            message: matchingRule?.message
        };
    }
}
