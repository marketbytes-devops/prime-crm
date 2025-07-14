import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/DashboardHome/AdminDashboard";
import ProjectDashboard from "./pages/DashboardHome/ProjectDashboard";
import ClientDashboard from "./pages/DashboardHome/ClientDashboard";
import HRDashboard from "./pages/DashboardHome/HRDashboard";
import AddClient from "./pages/Client/AddClient";
import ViewClient from "./pages/Client/ViewClient";
import ProjectDetails from "./pages/Project/ProjectDetails";
import AddProject from "./pages/Project/AddProject";

const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login setIsAuthenticated={setIsAuthenticated} />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Layout
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "/",
          element: <AdminDashboard />,
        },
        {
          path: "/dashboard/project",
          element: <ProjectDashboard />,
        },
        {
          path: "/dashboard/client",
          element: <ClientDashboard />,
        },
        {
          path: "/dashboard/hr",
          element: <HRDashboard />,
        },
        {
          path: "/clients/add",
          element: <AddClient />,
        },
        {
          path: "/clients/view",
          element: <ViewClient />,
        },
        {
          path: "/projects/details",
          element: <ProjectDetails />,
        },
        {
          path: "/projects/add",
          element: <AddProject />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;