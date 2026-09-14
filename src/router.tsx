import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { GuestOnly, RequireAuth } from '@/features/auth/route-guards'
import { LazyEditorPage } from '@/features/editor/lazy-editor-page'
import { DashboardPage } from '@/features/warehouses/dashboard-page'
import { NotFoundPage, RouteErrorPage } from '@/pages/error-pages'

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/warehouses/:warehouseId', element: <LazyEditorPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
