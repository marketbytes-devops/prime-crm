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
import Item from "./pages/Settings/items";
import Unit from "./pages/Settings/Unit";
import ExistingClient from "./components/ExistingClient/ExistingClient";
import Team from "./pages/Settings/Team";
import EditRFQ from "./pages/Execution/RFQ/EditRFQ";
import NumberSeries from "./components/NumberSeries";
import ViewQuotation from "./pages/Execution/Quotation/ViewQuotation";
import EditQuotation from "./pages/Execution/Quotation/EditQuotation";
import InitiateWorkOrder from "./pages/JobExecution/InitiateWorkOrder";
import ProcessingWorkOrders from "./pages/JobExecution/ProcessingWorkOrders";
import CloseWorkOrder from "./pages/JobExecution/CloseWorkOrder";
import Delivery from "./pages/JobExecution/Delivery";
import ManagerApproval from "./pages/JobExecution/ManagerApproval";

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
      errorElement: (
        <div>Something went wrong. Please try again or contact support.</div>
      ),
      children: [
        {
          index: true,
          element: <Dashboard />,
        },

        {
          path: "/pre-job/add-rfq",
          element: <AddRFQ />,
        },
        {
          path: "/pre-job/edit-rfq",
          element: <EditRFQ />,
        },
        {
          path: "/pre-job/view-rfq",
          element: <ViewRFQ />,
        },
        {
          path: "/pre-job/view-quotation",
          element: <ViewQuotation />,
        },
        {
          path: "/pre-job/edit-quotation",
          element: <EditQuotation />,
        },
        {
          path: "/pre-job/existing-client",
          element: <ExistingClient />,
        },
        {
          path: "/job-execution/initiate-work-order",
          element:
            <InitiateWorkOrder/>,
        },
        {
          path: "/job-execution/processing-work-orders",
          element:
            <ProcessingWorkOrders/>,
        },
        {
          path: "/job-execution/manager-approval",
          element:
            <ManagerApproval/>,
        },
        {
          path: "/job-execution/delivery",
          element:
            <Delivery/>,
        },
        {
          path: "/job-execution/close-work-order",
          element:
            <CloseWorkOrder />,
        },
        {
          path: "/settings/rfq-channel",
          element: <RFQChannels />,
        },
        {
          path: "/settings/team",
          element: <Team />,
        },
        {
          path: "/settings/item",
          element: <Item />,
        },
        {
          path: "/settings/unit",
          element: <Unit />,
        },
        {
          path: "/settings/series",
          element: <NumberSeries />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} fallbackElement={<p>Loading...</p>} />;
}

export default App;
