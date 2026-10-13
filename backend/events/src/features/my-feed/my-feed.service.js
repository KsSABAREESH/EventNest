const myFeedModel = require('./my-feed.model');

async function browseForUser(userId, query) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const { events, totalItems } = await myFeedModel.browseForUser({
    userId,
    category: query.category,
    city: query.city?.trim(),
    search: query.q?.trim(),
    page,
    pageSize,
  });

  return {
    data: events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      city: event.city,
      startsAt: event.starts_at,
      pricePaise: event.price_paise,
      description: event.description,
      imageUrl: event.image_url,
    })),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

module.exports = { browseForUser };
