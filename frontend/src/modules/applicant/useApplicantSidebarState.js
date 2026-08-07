import { useCallback, useState } from "react";

const APPLICANT_SIDEBAR_STORAGE_KEY = "dbku_applicant_sidebar_open";

export function useApplicantSidebarState() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(APPLICANT_SIDEBAR_STORAGE_KEY) !== "false";
  });

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((current) => {
      const next = !current;
      window.localStorage.setItem(APPLICANT_SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return [sidebarOpen, toggleSidebar];
}
