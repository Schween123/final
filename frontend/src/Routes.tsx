import { useRoutes, Navigate } from "react-router-dom";
//import Home from './pages/Home';
import NotFound from "./pages/NotFound";
import Splashscreen from "./pages/Splashscreen/Splashscreen.tsx";
import BHRegistration from "./pages/admin/BHRegistration/BHRegistration.tsx";
import OwnerRegistration from "./pages/admin/OwnerRegistration/OwnerRegistration.tsx";
import BHInfo from "./pages/admin/BHInfo/BHInfo.tsx";
import BoarderRegistration from "./pages/user/BoarderRegistration/BoarderRegistration.tsx";
import GuardianRegistration from "./pages/user/GuardianRegistration/GuardianRegistration.tsx";
import BillRegistration from "./pages/user/BillRegistration/BillRegistration.tsx";
import BoarderFaceRegistration from "./pages/user/BoarderFaceRegistration/BoarderFaceRegistration.tsx";
import BoarderRegistrationSuccessful from "./pages/user/BoarderRegistrationSuccessful/BoarderRegistrationSuccessful.tsx";
import Transactions from "./pages/user/Transactions/Transactions.tsx";
import BoarderProfile from "./pages/user/BoarderProfile/BoarderProfile.tsx";
import PayNow from "./pages/user/PayNow/PayNow.tsx";
import BillDetails from "./pages/user/BillDetails/BillDetails.tsx";
import Dashboard from "./pages/admin/Dashboard/Dashboard.tsx";
import ReportSummary from "./pages/admin/ReportSummary/ReportSummary.tsx";
import RoomInfo from "./pages/admin/RoomInfo/RoomInfo.tsx";
import BoardersInfo from "./pages/admin/BoardersInfo/BoardersInfo.tsx";
import OptionPage from "./pages/OptionPage/OptionPage.tsx";
import SelectTenant from "./pages/SelectTenant/SelectTenant.tsx";
import BoarderDetailsPage from "./pages/admin/BoarderDetails/BoarderDetails.tsx";
import GcashConfirmationPage from "./pages/admin/GcashConfirmation/GcashConfirmation.tsx";
import Login from "./pages/user/Login/Login.tsx";
import GuestPage from "./pages/Guestpage/Guestpage.tsx";
import FaceRecognition from "./pages/face/face.tsx";
import OwnerDetailsPage from "./pages/admin/OwnerDetails/OwnerDetails.tsx";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <Navigate to="/splashscreen" /> },
    { path: "*", element: <NotFound /> },
    {
      path: "splashscreen",
      element: <Splashscreen />,
    },

    {
      path: "bhregistration",
      element: <BHRegistration />,
    },
    {
      path: "ownerregistration",
      element: <OwnerRegistration />,
    },
    {
      path: "bhinfo",
      element: <BHInfo />,
    },
    {
      path: "boarderregistration",
      element: <BoarderRegistration />,
    },
    {
      path: "guardianregistration",
      element: <GuardianRegistration />,
    },
    {
      path: "billregistration",
      element: <BillRegistration />,
    },
    {
      path: "boarderfaceregistration",
      element: <BoarderFaceRegistration />,
    },
    {
      path: "boarderregistrationsuccessful",
      element: <BoarderRegistrationSuccessful />,
    },
    {
      path: "transactions/:tenantId",
      element: <Transactions />,
    },
    {
      path: "/boarderdetails/:tenantId",
      element: <BoarderDetailsPage />,
    },
    {
      path: "/boarderprofile/:tenantId",
      element: <BoarderProfile />,
    },
    {
      path: "/paynow/:tenantId",
      element: <PayNow />,
    },
    {
      path: "/billdetails/:tenantId",
      element: <BillDetails />,
    },
    {
      path: "dashboard",
      element: <Dashboard />,
    },
    {
      path: "reportsummary",
      element: <ReportSummary />,
    },
    {
      path: "roominfo",
      element: <RoomInfo />,
    },
    {
      path: "gcashconfirmation",
      element: <GcashConfirmationPage />,
    },
    {
      path: "/boardersinfo/:roomId",
      element: <BoardersInfo />,
    },
    {
      path: "optionpage",
      element: <OptionPage />,
    },
    {
      path: "login",
      element: <Login />,
    },
    {
      path: "selecttenant",
      element: <SelectTenant />,
    },
    {
      path: "guestpage",
      element: <GuestPage />,
    },
    
    {
      path: "ownerdetails/:ownerId",
      element: <OwnerDetailsPage />,
    },
    {
      path: "face",
      element: <FaceRecognition />,
    },
  ]);

  return element;
};

export default ProjectRoutes;
