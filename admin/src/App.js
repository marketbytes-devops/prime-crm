import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import Profile from "./pages/Profile";
import AddRFQ from "./pages/Execution/RFQ/AddRFQ";
import ViewRFQ from "./pages/Execution/RFQ/ViewRFQ";
import RFQChannels from "./pages/Settings/RFQChannels";

const ProtectedRoute = ({ children, isAuthenticated }) => {
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
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
      errorElement: <div>Something went wrong. Please try again or contact support.</div>,
      children: [
        {
          path: "/",
          element: <Dashboard />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/pre-job/add-rfq",
          element: <AddRFQ />,
        },
        {
          path: "/pre-job/view-rfq",
          element: <ViewRFQ />,
        },
        {
          path: "/settings",
          children: [
            {
              path: "rfq-channel",
              element: <RFQChannels />,
            },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;