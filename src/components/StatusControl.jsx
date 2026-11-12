import { useState } from 'react';
import FormField from './FormField.jsx';
import SignInHint from './SignInHint.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useUpdateStatusMutation } from '../hooks/useVehicleQueries.js';
import { describedBy } from '../utils/a11y.js';
import { MIN_FUEL_TO_RENT, STATUS_LABELS } from '../utils/constants.js';
import { statusesForClass } from '../utils/vehicle.js';

const HINT = `Renting out needs at least ${MIN_FUEL_TO_RENT} % fuel or charge.`;

export default function StatusControl({ vehicleId, vehicleClass, currentStatus }) {
  // The select starts at the current status; this state is local to one vehicle
  // because the whole details subtree is keyed by the vehicle id.
  const [draftStatus, setDraftStatus] = useState(currentStatus);
  const { isAuthenticated } = useAuth();
  // On success the mutation writes the vehicle into the cache and invalidates the
  // lists and counters, so this page and the fleet overview update together.
  const mutation = useUpdateStatusMutation(vehicleId);

  function handleSubmit(event) {
    event.preventDefault();
    mutation.mutate(draftStatus);
  }

  function handleDraftChange(event) {
    setDraftStatus(event.target.value);
    // Drop the result of the previous attempt: it no longer describes the form.
    mutation.reset();
  }

  const saving = mutation.isPending;
  const disabled = saving || !isAuthenticated;

  return (
    <section className="panel" aria-labelledby="status-control-title">
      <h2 id="status-control-title" className="panel__title">Change status</h2>
      <form className="status-control" onSubmit={handleSubmit}>
        <FormField id="status-select" label="New status" hint={HINT}>
          <select
            id="status-select"
            className="input"
            value={draftStatus}
            onChange={handleDraftChange}
            disabled={disabled}
            aria-describedby={describedBy('status-select', { hint: HINT })}
          >
            {statusesForClass(vehicleClass).map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </FormField>
        <button
          type="submit"
          className="button button--primary"
          disabled={disabled || draftStatus === currentStatus}
        >
          {saving ? 'Saving…' : 'Update status'}
        </button>
      </form>
      {!isAuthenticated && <SignInHint action="change the status of a vehicle" />}
      <div aria-live="polite">
        {mutation.isError && (
          <p className="inline-message inline-message--error">{mutation.error.message}</p>
        )}
        {mutation.isSuccess && (
          <p className="inline-message inline-message--success">
            Status changed to {STATUS_LABELS[mutation.data.status].toLowerCase()}.
          </p>
        )}
      </div>
    </section>
  );
}
