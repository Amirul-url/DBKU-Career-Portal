export const APPLICANT_ROUTES = {
  academic: "/profile/academic",
  experience: "/profile/experience",
  jobPreferences: "/profile/job-preferences",
  personal: "/profile/personal",
  profile: "/profile",
  skills: "/profile/skills",
};

const applicantSectionRoutes = [
  { sectionId: "profile-section-personal", to: APPLICANT_ROUTES.personal },
  { sectionId: "profile-section-job-preferences", to: APPLICANT_ROUTES.jobPreferences },
  { sectionId: "profile-section-experience", to: APPLICANT_ROUTES.experience },
  { sectionId: "profile-section-academic", to: APPLICANT_ROUTES.academic },
  { sectionId: "profile-section-skills", to: APPLICANT_ROUTES.skills },
];

export const applicantSidebarNavItems = [
  { end: true, icon: "search", label: "Cari Kerja", to: "/jobs" },
  { icon: "person", label: "Profil", sectionId: "profile-section-personal", to: APPLICANT_ROUTES.profile },
];

export function getApplicantSectionId(pathname) {
  const route = applicantSectionRoutes.find((item) => item.to === pathname);
  return route?.sectionId || "";
}
