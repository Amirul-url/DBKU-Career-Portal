import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import InternshipInfoPage from "./pages/InternshipInfoPage";
import JobMarketplacePage from "./pages/JobMarketplacePage";
import ApplicantForgotPasswordPage from "./pages/applicant/ApplicantForgotPasswordPage";
import ApplicantLoginPage from "./pages/applicant/ApplicantLoginPage";
import ApplicantResetPasswordPage from "./pages/applicant/ApplicantResetPasswordPage";
import ApplicantDashboardPage from "./pages/applicant/ApplicantDashboardPage";
import ApplicantJobSearchPage from "./pages/applicant/ApplicantJobSearchPage";
import ApplicantInternshipApplicationPage from "./pages/applicant/ApplicantInternshipApplicationPage";
import ApplicantJobApplicationPage from "./pages/applicant/ApplicantJobApplicationPage";
import ApplicantApplicationViewPage from "./pages/applicant/ApplicantApplicationViewPage";
import ApplicantPortalListPage from "./pages/applicant/ApplicantPortalListPage";
import ApplicantProfilePage from "./pages/applicant/ApplicantProfilePage";
import ApplicantRegisterPage from "./pages/applicant/ApplicantRegisterPage";
import SuperAdminShellPage from "./pages/admin/SuperAdminShellPage";
import AdminHrmPage from "./pages/admin/AdminHrmPage";
import {
  clearAuthSession,
  dashboardPathForUser,
  getAccessTokenExpiryMs,
  getStoredUser,
  recordLogoutActivity,
  refreshAccessToken,
} from "./lib/authApi";

const SESSION_WARNING_MS = 5 * 60 * 1000;
const SESSION_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;

function HomeRoute() {
  const storedUser = getStoredUser();

  if (storedUser) {
    return <Navigate to={dashboardPathForUser(storedUser)} replace />;
  }

  return <LandingPage />;
}

function SessionManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const responseTimerRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const clearSessionTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearResponseTimer = useCallback(() => {
    if (responseTimerRef.current) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearResponseTimer();
    void recordLogoutActivity();
    clearAuthSession();
    navigate("/login", {
      replace: true,
      state: { message: "Sesi anda telah tamat. Sila log masuk semula." },
    });
  }, [clearResponseTimer, navigate]);

  const scheduleSessionWarning = useCallback(() => {
    clearSessionTimer();
    const expiryMs = getAccessTokenExpiryMs();
    const isPublicAuthRoute = location.pathname === "/login" || location.pathname === "/register";

    if (!expiryMs || isPublicAuthRoute) {
      setModalOpen(false);
      return;
    }

    if (expiryMs <= Date.now()) {
      setModalOpen(false);
      handleLogout();
      return;
    }

    const timeUntilWarning = expiryMs - Date.now() - SESSION_WARNING_MS;
    if (timeUntilWarning <= 0) {
      setModalOpen(true);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setModalOpen(true);
    }, timeUntilWarning);
  }, [clearSessionTimer, handleLogout, location.pathname]);

  useEffect(() => {
    const initialCheckId = window.setTimeout(scheduleSessionWarning, 0);

    window.addEventListener("dbku:auth-changed", scheduleSessionWarning);
    window.addEventListener("focus", scheduleSessionWarning);
    document.addEventListener("visibilitychange", scheduleSessionWarning);

    return () => {
      window.clearTimeout(initialCheckId);
      clearSessionTimer();
      clearResponseTimer();
      window.removeEventListener("dbku:auth-changed", scheduleSessionWarning);
      window.removeEventListener("focus", scheduleSessionWarning);
      document.removeEventListener("visibilitychange", scheduleSessionWarning);
    };
  }, [clearResponseTimer, clearSessionTimer, scheduleSessionWarning]);

  useEffect(() => {
    clearResponseTimer();

    if (!modalOpen) {
      return undefined;
    }

    responseTimerRef.current = window.setTimeout(() => {
      handleLogout();
    }, SESSION_RESPONSE_TIMEOUT_MS);

    return clearResponseTimer;
  }, [clearResponseTimer, handleLogout, modalOpen]);

  const handleExtendSession = async () => {
    try {
      setIsExtending(true);
      const token = await refreshAccessToken();
      if (!token) {
        throw new Error("Sesi tidak dapat disambung.");
      }
      clearResponseTimer();
      setModalOpen(false);
      scheduleSessionWarning();
    } catch {
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  };

  if (!modalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4">
      <section
        className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expiring-title"
      >
        <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              schedule
            </span>
          </span>
          <div className="min-w-0">
            <h2 id="session-expiring-title" className="text-lg font-semibold text-slate-950">
              Sesi hampir tamat
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Sesi log masuk anda hampir tamat. Sambung sesi untuk terus menggunakan portal tanpa log masuk semula.
            </p>
          </div>
        </header>

        <div className="px-5 py-4">
          <p className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Pilih Sambung sesi untuk terus menggunakan Portal Kerjaya DBKU, atau Log keluar untuk menamatkan sesi ini sekarang.
          </p>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isExtending}
            onClick={handleLogout}
          >
            Log keluar
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isExtending}
            onClick={handleExtendSession}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              update
            </span>
            {isExtending ? "Menyambung..." : "Sambung sesi"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SessionManager />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/jobs" element={<JobMarketplacePage />} />
        <Route path="/internships" element={<InternshipInfoPage />} />
        <Route path="/login" element={<ApplicantLoginPage />} />
        <Route path="/forgot-password" element={<ApplicantForgotPasswordPage />} />
        <Route path="/reset-password" element={<ApplicantResetPasswordPage />} />
        <Route path="/profile/dashboard" element={<ApplicantDashboardPage />} />
        <Route path="/profile/jobs" element={<ApplicantJobSearchPage />} />
        <Route path="/profile/internships" element={<ApplicantJobSearchPage />} />
        <Route path="/profile/internship-application" element={<ApplicantInternshipApplicationPage />} />
        <Route path="/profile/job-application" element={<ApplicantJobApplicationPage />} />
        <Route path="/profile/applications" element={<ApplicantPortalListPage page="applications" />} />
        <Route path="/profile/applications/:applicationId" element={<ApplicantApplicationViewPage />} />
        <Route path="/profile/saved" element={<ApplicantPortalListPage page="saved" />} />
        <Route path="/profile" element={<Navigate to="/profile/personal" replace />} />
        <Route path="/profile/:section" element={<ApplicantProfilePage />} />
        <Route path="/register" element={<ApplicantRegisterPage />} />
        <Route path="/superadmin/*" element={<SuperAdminShellPage />} />
        <Route path="/admin/*" element={<AdminHrmPage />} />
      </Routes>
    </>
  );
}
