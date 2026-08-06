import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JobMarketplacePage from "./pages/JobMarketplacePage";
import ApplicantLoginPage from "./pages/applicant/ApplicantLoginPage";
import ApplicantProfilePage from "./pages/applicant/ApplicantProfilePage";
import ApplicantRegisterPage from "./pages/applicant/ApplicantRegisterPage";
import SuperAdminShellPage from "./pages/admin/SuperAdminShellPage";
import AdminHrmPage from "./pages/admin/AdminHrmPage";
import { dashboardPathForUser, getStoredUser } from "./lib/authApi";

function HomeRoute() {
  const storedUser = getStoredUser();

  if (storedUser) {
    return <Navigate to={dashboardPathForUser(storedUser)} replace />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/jobs" element={<JobMarketplacePage />} />
      <Route path="/login" element={<ApplicantLoginPage />} />
      <Route path="/profile" element={<ApplicantProfilePage />} />
      <Route path="/register" element={<ApplicantRegisterPage />} />
      <Route path="/superadmin" element={<SuperAdminShellPage />} />
      <Route path="/admin" element={<AdminHrmPage />} />
    </Routes>
  );
}
