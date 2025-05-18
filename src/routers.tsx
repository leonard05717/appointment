import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import AdminHome from "./admin/AdminHome";
import Maintenance from "./admin/pages/Maintenance";
import Users from "./admin/pages/Users";
import Report from "./admin/pages/Report";
import AdminMainHome from "./admin/pages/AdminMainHome";
import Registration from "./pages/Registration";
import Students from "./admin/pages/Students";
import Scan from "./admin/pages/Scan";
import Settings from "./admin/pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import Queue from "./pages/Queue";

const routers = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: 'registration',
    element: <Registration />
  },
  {
    path: 'queue',
    element: <Queue />
  },
  {
    path: 'admin',
    element: <AdminHome />,
    children: [
      {
        path: 'appointment',
        element: <AdminMainHome />
      },
      {
        path: 'scan',
        element: <Scan />
      },
      {
        path: 'maintenance',
        element: <Maintenance />
      },
      {
        path: 'users',
        element: <Users />
      },
      {
        path: 'students',
        element: <Students />
      },
      {
        path: 'report',
        element: <Report />
      },
      {
        path: 'settings',
        element: <Settings />
      },
    ]
  },
  {
    path: 'forgot',
    element: <ForgotPassword />
  }
])

export default routers;