const adminModel = require('./admin.model');

const allowedCategories = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'];
const MAX_PRICE_PAISE = 9_223_372_036_854_775_807n;

function httpError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function validatePrice(pricePaise) {
  if (typeof pricePaise !== 'string' || !/^(0|[1-9]\d{0,18})$/.test(pricePaise)) {
    throw httpError(400, 'Price must be a non-negative whole number of paise.', 'INVALID_PRICE');
  }
  if (BigInt(pricePaise) > MAX_PRICE_PAISE) {
    throw httpError(400, 'Price exceeds the supported maximum.', 'INVALID_PRICE');
  }
}

function normalizeEvent(event, { partial = false } = {}) {
  const normalized = { ...event };
  for (const key of ['title', 'city', 'description', 'imageUrl']) {
    if (Object.hasOwn(normalized, key)) normalized[key] = normalized[key].trim();
  }

  const textLimits = { title: [3, 160], city: [1, 100], description: [1, 5000], imageUrl: [8, 2048] };
  for (const [key, [minimum, maximum]] of Object.entries(textLimits)) {
    if (Object.hasOwn(normalized, key)
        && (normalized[key].length < minimum || normalized[key].length > maximum)) {
      throw httpError(400, `${key} must contain between ${minimum} and ${maximum} characters.`, 'INVALID_EVENT_FIELD');
    }
  }

  if (normalized.category && !allowedCategories.includes(normalized.category)) {
    throw httpError(400, 'Choose a valid event category.', 'INVALID_CATEGORY');
  }
  if (Object.hasOwn(normalized, 'startsAt') && Number.isNaN(Date.parse(normalized.startsAt))) {
    throw httpError(400, 'Enter a valid event date and time.', 'INVALID_EVENT_DATE');
  }
  if (Object.hasOwn(normalized, 'pricePaise')) validatePrice(normalized.pricePaise);
  if (Object.hasOwn(normalized, 'imageUrl') && !/^https?:\/\//i.test(normalized.imageUrl)) {
    throw httpError(400, 'Image URL must start with http:// or https://.', 'INVALID_IMAGE_URL');
  }
  if (!partial) normalized.isActive = normalized.isActive ?? true;
  return normalized;
}

async function listEvents(query) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const filters = {
    category: query.category,
    city: query.city?.trim(),
    q: query.q?.trim(),
    status: query.status ?? 'all',
    page,
    pageSize,
  };
  const { events, totalItems } = await adminModel.listEvents(filters);
  return {
    data: events,
    pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
  };
}

async function createEvent(payload) {
  return adminModel.createEvent(normalizeEvent(payload));
}

async function updateEvent(eventId, payload) {
  const event = await adminModel.updateEvent(eventId, normalizeEvent(payload, { partial: true }));
  if (!event) throw httpError(404, 'Event not found.', 'EVENT_NOT_FOUND');
  return event;
}

async function setEventStatus(eventId, isActive) {
  const event = await adminModel.setEventStatus(eventId, isActive);
  if (!event) throw httpError(404, 'Event not found.', 'EVENT_NOT_FOUND');
  return event;
}

module.exports = { createEvent, listEvents, setEventStatus, updateEvent };
