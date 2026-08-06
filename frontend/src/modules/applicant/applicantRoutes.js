export const APPLICANT_ROUTES = {
  academic: "/profile/academic",
  applications: "/profile/applications",
  experience: "/profile/experience",
  internships: "/profile/internships",
  jobPreferences: "/profile/job-preferences",
  jobs: "/profile/jobs",
  personal: "/profile/personal",
  profile: "/profile",
  saved: "/profile/saved",
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
  { activePaths: [APPLICANT_ROUTES.jobs, APPLICANT_ROUTES.internships], icon: "search", label: "Cari Kerja", to: APPLICANT_ROUTES.jobs },
  { icon: "assignment", label: "Permohonan Saya", to: APPLICANT_ROUTES.applications },
  { icon: "bookmark", label: "Senarai Simpan", to: APPLICANT_ROUTES.saved },
  {
    activePaths: [APPLICANT_ROUTES.personal, APPLICANT_ROUTES.jobPreferences, APPLICANT_ROUTES.experience, APPLICANT_ROUTES.academic, APPLICANT_ROUTES.skills],
    icon: "person",
    label: "Profil",
    sectionId: "profile-section-personal",
    to: APPLICANT_ROUTES.profile,
  },
];

export function getApplicantSectionId(pathname) {
  const route = applicantSectionRoutes.find((item) => item.to === pathname);
  return route?.sectionId || "";
}
