import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthProvider from './context/AuthProvider.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NewVehiclePage from './pages/NewVehiclePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import VehicleDetailsPage from './pages/VehicleDetailsPage.jsx';
import VehiclesPage from './pages/VehiclesPage.jsx';
import { createQueryClient } from './queries/queryClient.js';

// Hash URLs (#/vehicles/veh-0001) work on any static host without rewrite rules.
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <VehiclesPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        // Adding a car to the fleet is a dispatcher action: sign-in required.
        path: 'vehicles/new',
        element: (
          <ProtectedRoute>
            <NewVehiclePage />
          </ProtectedRoute>
        ),
      },
      { path: 'vehicles/:id', element: <VehicleDetailsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  // Created once per app instance, never on re-renders: the cache must outlive them.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
