import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { ReportIssue } from './pages/ReportIssue';
import { MapView } from './pages/MapView';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { ReportsProvider } from './context/ReportsContext';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { 
        path: 'dashboard', 
        element: <Dashboard /> 
      },
      { 
        path: 'report', 
        element: <ReportIssue /> 
      },
      { 
        path: 'map', 
        element: <MapView /> 
      },
      { 
        path: 'analytics', 
        element: <Analytics /> 
      }
    ],
  },
]);

export default function App() {
  return (
    <ReportsProvider>
      <RouterProvider router={router} />
    </ReportsProvider>
  );
}
