import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';
import VehicleGrid from './VehicleGrid.jsx';
import { useSimilarVehiclesQuery } from '../hooks/useVehicleQueries.js';
import { CLASS_LABELS } from '../utils/constants.js';

// Replacement candidates for the dispatcher: available cars of the same class nearby.
// Cached per class + district, so every car in a district reuses one answer.
export default function SimilarVehicles({ vehicleId, vehicleClass, district }) {
  const {
    data: vehicles,
    isPending,
    isError,
    refetch,
  } = useSimilarVehiclesQuery({ vehicleId, vehicleClass, district });

  let content;
  if (isError) {
    content = <ErrorMessage title="Could not load alternatives" onRetry={() => refetch()} />;
  } else if (isPending) {
    content = <Spinner label="Looking for alternatives…" />;
  } else if (vehicles.length === 0) {
    content = (
      <EmptyState
        title="No alternatives nearby"
        message={`No other ${CLASS_LABELS[vehicleClass].toLowerCase()} vehicle is available in ${district} right now.`}
      />
    );
  } else {
    content = <VehicleGrid vehicles={vehicles} />;
  }

  return (
    <section className="similar" aria-labelledby="similar-title">
      <h2 id="similar-title" className="section-title">
        Available {CLASS_LABELS[vehicleClass].toLowerCase()} cars in {district}
      </h2>
      {content}
    </section>
  );
}
