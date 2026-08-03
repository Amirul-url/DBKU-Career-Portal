import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JobMarketplacePage from "./pages/JobMarketplacePage";
import ApplicantLoginPage from "./pages/applicant/ApplicantLoginPage";
import ApplicantRegisterPage from "./pages/applicant/ApplicantRegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/jobs" element={<JobMarketplacePage />} />
      <Route path="/login" element={<ApplicantLoginPage />} />
      <Route path="/register" element={<ApplicantRegisterPage />} />
    </Routes>
  );
}
