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
import Product from "./pages/Settings/product";
import Item from "./pages/Settings/items";
import Unit from './pages/Settings/Unit' // New Unit page
import ExistingClient from "./components/ExistingClient/ExistingClient";
import Team from "./pages/Settings/Team";

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
          index: true,
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
          path: "/pre-job/view-rfq/:id",
          element: <ViewRFQ />,
        },
        {
          path: "/settings/rfq-channel",
          element: <RFQChannels />,
        },
        {
          path: "/settings/product",
          element: <Product />,
        },
           {
          path: "/settings/team",
          element: <Team />,
        },
        {
          path: "/pre-job/existing-client", // New route
          element: <ExistingClient/>   // Render ExistingClient component
        },
        {
          path: "/settings/item",
          element: <Item />,
        },
        {
          path: "/settings/unit",
          element: <Unit />, // New route for Unit
        },
      ],
    },
  ]);

  return <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />;
}

export default App;