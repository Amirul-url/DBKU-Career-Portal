import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JobMarketplacePage from "./pages/JobMarketplacePage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/jobs" element={<JobMarketplacePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}
