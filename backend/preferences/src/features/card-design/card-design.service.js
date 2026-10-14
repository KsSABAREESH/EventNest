const cardDesignModel = require('./card-design.model');

const allowedThemes = ['sunset', 'midnight', 'paper'];
const allowedStickers = ['sparkles', 'music-notes', 'confetti', 'heart', 'star'];

async function getDesign(userId, eventId) {
  const design = await cardDesignModel.getForUser(userId, eventId);
  if (!design) {
    const error = new Error('This event could not be found.');
    error.statusCode = 404;
    throw error;
  }
  return design;
}

async function listDesigns(userId, eventIds) {
  return cardDesignModel.listForUser(userId, eventIds);
}

async function saveDesign(userId, eventId, design) {
  if (!allowedThemes.includes(design.theme)) {
    const error = new Error('Choose one of the available card themes.');
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(design.stickers) || design.stickers.length > 3
      || new Set(design.stickers).size !== design.stickers.length
      || design.stickers.some((sticker) => !allowedStickers.includes(sticker))) {
    const error = new Error('Choose up to three different stickers from the available set.');
    error.statusCode = 400;
    throw error;
  }

  const saved = await cardDesignModel.saveForUser(userId, eventId, design.theme, design.stickers);
  if (!saved) {
    const error = new Error('This event could not be found.');
    error.statusCode = 404;
    throw error;
  }
  return saved;
}

module.exports = { getDesign, listDesigns, saveDesign, allowedThemes, allowedStickers };
