import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { JobMarketplaceContent } from "../JobMarketplacePage";
import ApplicantInternshipInfoContent from "./ApplicantInternshipInfoContent";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

export default function ApplicantJobSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const isInternshipPage = location.pathname.includes("/internships");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk mencari kerja." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  if (!user || user.role !== "applicant") {
    return null;
  }

  return (
    <div className={`applicant-profile-page applicant-search-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader
          displayName={displayName}
          email={email}
          photoUrl={user.profile_photo_url}
          leading={(
            <nav className="applicant-search-tabs" aria-label="Kategori carian">
              <NavLink to="/profile/jobs">Kerja Kosong</NavLink>
              <NavLink to="/profile/internships">Latihan Industri</NavLink>
            </nav>
          )}
        />
        {isInternshipPage ? (
          <ApplicantInternshipInfoContent />
        ) : (
          <JobMarketplaceContent actionTarget="/profile" embedded vacancyType="job" />
        )}
      </div>
    </div>
  );
}
