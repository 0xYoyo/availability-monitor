const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
export function validateIsoDate(value, fieldName) {
    if (!ISO_DATE_PATTERN.test(value)) {
        throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
    }
}
export function parseIsoDate(value) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || formatIsoDate(parsed) !== value) {
        throw new Error(`Invalid calendar date: ${value}`);
    }
    return parsed;
}
export function addDays(date, days) {
    return new Date(date.getTime() + days * MS_PER_DAY);
}
export function formatIsoDate(date) {
    return date.toISOString().slice(0, 10);
}
