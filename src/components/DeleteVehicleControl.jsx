import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SignInHint from './SignInHint.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useDeleteVehicleMutation } from '../hooks/useVehicleQueries.js';

/**
 * Retires a car from the fleet. Two steps on purpose: the first click only asks
 * for confirmation, so a stray click cannot delete a vehicle.
 */
export default function DeleteVehicleControl({ vehicleId, plate }) {
  const [confirming, setConfirming] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const mutation = useDeleteVehicleMutation(vehicleId);

  function handleDelete() {
    mutation.mutate(undefined, {
      // The vehicle no longer exists: its page would 404, so leave for the list,
      // which the mutation has already invalidated.
      onSuccess: () => navigate('/', { replace: true }),
    });
  }

  return (
    <section className="panel panel--danger" aria-labelledby="delete-vehicle-title">
      <h2 id="delete-vehicle-title" className="panel__title">Remove from fleet</h2>
      <p className="panel__text">
        Takes {plate} out of the fleet for good. A rented car has to come back first.
      </p>

      {!isAuthenticated && <SignInHint action="remove a vehicle from the fleet" />}

      {confirming ? (
        <div className="confirm-row">
          <button
            type="button"
            className="button button--danger"
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Removing…' : 'Yes, remove it'}
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setConfirming(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setConfirming(true)}
          disabled={!isAuthenticated}
        >
          Remove vehicle
        </button>
      )}

      <div aria-live="polite">
        {mutation.isError && (
          <p className="inline-message inline-message--error">{mutation.error.message}</p>
        )}
      </div>
    </section>
  );
}
