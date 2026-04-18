// Validation utilities — return i18n translation keys (or null if valid)

export function validateRequired(value) {
  if (!value || !String(value).trim()) return "validation.required";
  return null;
}

export function validateMinLength(value, min) {
  if (value && String(value).trim().length < min) return ["validation.minLength", min];
  return null;
}

export function validateMaxLength(value, max) {
  if (value && String(value).trim().length > max) return ["validation.maxLength", max];
  return null;
}

export function validateNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  if (isNaN(Number(value))) return "validation.number";
  return null;
}

export function validatePositiveNumber(value) {
  const n = Number(value);
  if (value === "" || value === null || value === undefined) return "validation.required";
  if (isNaN(n) || n <= 0) return "validation.positiveNumber";
  return null;
}

export function validateNonNegativeInteger(value) {
  const n = Number(value);
  if (isNaN(n) || n < 0 || !Number.isInteger(n)) return "validation.number";
  return null;
}

export function validateDate(value) {
  if (!value || !String(value).trim()) return null; // optional
  // type="date" produces YYYY-MM-DD; browser prevents invalid input
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())) return "validation.dateFormat";
  return null;
}

export function validateLat(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (isNaN(n) || n < -90 || n > 90) return "validation.latRange";
  return null;
}

export function validateLng(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (isNaN(n) || n < -180 || n > 180) return "validation.lngRange";
  return null;
}

/** Run all validators in sequence, return first error or null */
export function firstError(...validators) {
  for (const result of validators) {
    if (result) return result;
  }
  return null;
}

/**
 * Derive event status from dateStart/dateEnd ISO strings relative to today.
 * Returns "upcoming" | "active" | "completed". Falls back to stored status.
 */
export function computeEventStatus(event) {
  const { dateStart, dateEnd, status } = event ?? {};
  if (!dateStart) return status === "completed" ? "completed" : "upcoming";
  const today = new Date().toISOString().slice(0, 10);
  if (today < dateStart) return "upcoming";
  if (today > (dateEnd || dateStart)) return "completed";
  return "active";
}

/** Apply t() to a validation result (which can be a key string or [key, ...args]) */
export function tError(t, result) {
  if (!result) return null;
  if (Array.isArray(result)) return t(result[0], ...result.slice(1));
  return t(result);
}
