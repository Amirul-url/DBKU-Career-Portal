export const APPLICANT_ROUTES = {
  academic: "/profile/academic",
  experience: "/profile/experience",
  jobPreferences: "/profile/job-preferences",
  personal: "/profile/personal",
  skills: "/profile/skills",
};

export const applicantSidebarNavItems = [
  { icon: "search", label: "Cari Kerja", to: "/jobs" },
  { icon: "person", label: "Maklumat Peribadi", sectionId: "profile-section-personal", to: APPLICANT_ROUTES.personal },
  { icon: "work_history", label: "Pilihan Pekerjaan", sectionId: "profile-section-job-preferences", to: APPLICANT_ROUTES.jobPreferences },
  { icon: "history", label: "Pengalaman", sectionId: "profile-section-experience", to: APPLICANT_ROUTES.experience },
  { icon: "school", label: "Akademik", sectionId: "profile-section-academic", to: APPLICANT_ROUTES.academic },
  { icon: "psychology", label: "Kemahiran", sectionId: "profile-section-skills", to: APPLICANT_ROUTES.skills },
];

export function getApplicantSectionId(pathname) {
  const route = applicantSidebarNavItems.find((item) => item.to === pathname);
  return route?.sectionId || "";
}
