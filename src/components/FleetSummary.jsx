import ErrorMessage from './ErrorMessage.jsx';
import { useFleetStatsQuery } from '../hooks/useVehicleQueries.js';
import { LOW_FUEL_THRESHOLD, STATUS_LABELS, VEHICLE_STATUSES } from '../utils/constants.js';
import { pluralize } from '../utils/format.js';

// Status tiles that double as a quick status filter.
// The counters come from their own cache entry, shared by every list view and
// refreshed automatically after a vehicle is added, changed or removed.
export default function FleetSummary({ activeStatus, onStatusSelect }) {
  const { data: stats, isFetching, isError, refetch } = useFleetStatsQuery();

  if (isError) {
    return (
      <ErrorMessage
        title="Fleet summary is unavailable"
        message="The status counters could not be loaded."
        onRetry={() => refetch()}
      />
    );
  }

  const tiles = [
    { status: 'all', label: 'All vehicles', count: stats?.total },
    ...VEHICLE_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: stats?.byStatus[status],
    })),
  ];

  return (
    <section className="fleet-summary" aria-labelledby="fleet-summary-title" aria-busy={isFetching}>
      <h2 id="fleet-summary-title" className="visually-hidden">Fleet summary</h2>
      <ul className="fleet-summary__tiles">
        {tiles.map((tile) => (
          <li key={tile.status}>
            <button
              type="button"
              className={`summary-tile summary-tile--${tile.status}`}
              aria-pressed={activeStatus === tile.status}
              onClick={() => onStatusSelect(tile.status)}
            >
              <span className="summary-tile__label">{tile.label}</span>
              <span className="summary-tile__count">{tile.count ?? '…'}</span>
            </button>
          </li>
        ))}
      </ul>
      {stats && stats.lowFuel > 0 && (
        <p className="fleet-summary__note">
          {pluralize(stats.lowFuel, 'vehicle')} below {LOW_FUEL_THRESHOLD} % fuel or charge need attention.
        </p>
      )}
    </section>
  );
}
