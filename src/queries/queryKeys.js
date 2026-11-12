/**
 * Every cache entry in the app is addressed through this factory, so a key is
 * never spelled out twice and invalidation can target whole families at once:
 *
 *   ['vehicles']                                  → everything about vehicles
 *   ['vehicles', 'list', { page, search, … }]     → one page of the list
 *   ['vehicles', 'detail', 'veh-0007']            → one vehicle
 *   ['vehicles', 'stats']                         → the summary tiles
 *   ['vehicles', 'similar', { class, district }]  → replacement candidates
 *
 * Query parameters live *inside* the key: different filters are different cache
 * entries, so going back to a previous filter shows data instantly.
 */
export const vehicleKeys = {
  all: ['vehicles'],
  lists: () => [...vehicleKeys.all, 'list'],
  list: (params) => [...vehicleKeys.lists(), params],
  details: () => [...vehicleKeys.all, 'detail'],
  detail: (id) => [...vehicleKeys.details(), id],
  stats: () => [...vehicleKeys.all, 'stats'],
  similar: (params) => [...vehicleKeys.all, 'similar', params],
};
