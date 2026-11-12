import { useCallback } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createVehicle,
  deleteVehicle,
  getFleetStats,
  getVehicle,
  listVehicles,
  updateVehicleStatus,
} from '../api/vehiclesApi.js';
import { vehicleKeys } from '../queries/queryKeys.js';

const SIMILAR_LIMIT = 4;
const STATS_STALE_TIME_MS = 30_000;

/**
 * One page of the fleet list.
 *
 * - The whole query object is part of the key, so each combination of search,
 *   filters, sort and page is cached separately.
 * - `signal` is handed to the API: when the key changes, React Query aborts the
 *   previous request, so a slow old answer can never replace a newer one.
 * - `keepPreviousData` keeps the current page on screen while the next one loads
 *   instead of flashing a spinner.
 */
export function useVehiclesQuery(params) {
  return useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: ({ signal }) => listVehicles(params, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useVehicleQuery(id) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: ({ signal }) => getVehicle(id, { signal }),
    enabled: Boolean(id),
  });
}

/** Counters behind the summary tiles: cheap, shared by every list view. */
export function useFleetStatsQuery() {
  return useQuery({
    queryKey: vehicleKeys.stats(),
    queryFn: ({ signal }) => getFleetStats({ signal }),
    staleTime: STATS_STALE_TIME_MS,
  });
}

/**
 * Replacement candidates. The key holds only class + district, so every vehicle
 * in the same district reuses one cache entry; the current vehicle is filtered
 * out of the cached answer by `select`, not by a separate request.
 */
export function useSimilarVehiclesQuery({ vehicleId, vehicleClass, district }) {
  const params = {
    vehicleClass,
    district,
    status: 'available',
    sortBy: 'fuelLevel',
    sortDir: 'desc',
    pageSize: SIMILAR_LIMIT + 1,
  };

  const select = useCallback(
    (data) => data.items.filter((item) => item.id !== vehicleId).slice(0, SIMILAR_LIMIT),
    [vehicleId],
  );

  return useQuery({
    queryKey: vehicleKeys.similar({ vehicleClass, district }),
    queryFn: ({ signal }) => listVehicles(params, { signal }),
    enabled: Boolean(vehicleClass && district),
    select,
  });
}

// ---------------------------------------------------------------------------
// Mutations. Each one writes the fresh entity straight into the cache and then
// invalidates every list that could now be wrong, so no screen shows stale data.
// ---------------------------------------------------------------------------

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => createVehicle(values),
    onSuccess: (created) => {
      // The details page the user is about to open already has its data.
      queryClient.setQueryData(vehicleKeys.detail(created.id), created);
      // Any cached page of any filter combination may now be missing a vehicle.
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...vehicleKeys.all, 'similar'] });
    },
  });
}

export function useUpdateStatusMutation(vehicleId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status) => updateVehicleStatus(vehicleId, status),
    // A GET for this vehicle that is already in flight would land *after* the
    // update and put the old status back on screen. Cancel it first.
    onMutate: () => queryClient.cancelQueries({ queryKey: vehicleKeys.detail(vehicleId) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(vehicleKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...vehicleKeys.all, 'similar'] });
    },
  });
}

export function useDeleteVehicleMutation(vehicleId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteVehicle(vehicleId),
    onSuccess: () => {
      // The entity is gone: drop its entry instead of leaving a tombstone behind.
      queryClient.removeQueries({ queryKey: vehicleKeys.detail(vehicleId) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...vehicleKeys.all, 'similar'] });
    },
  });
}
