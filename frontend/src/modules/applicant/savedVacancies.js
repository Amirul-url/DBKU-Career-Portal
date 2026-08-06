const savedVacancyKey = (user) =>
  `dbku-applicant-saved-vacancies:${user?.email || user?.full_name || "guest"}`;

export function getSavedVacancies(user) {
  try {
    const saved = window.localStorage.getItem(savedVacancyKey(user));
    const vacancies = saved ? JSON.parse(saved) : [];
    return Array.isArray(vacancies) ? vacancies : [];
  } catch {
    return [];
  }
}

export function saveSavedVacancies(user, vacancies) {
  window.localStorage.setItem(savedVacancyKey(user), JSON.stringify(vacancies));
  return vacancies;
}

export function toSavedVacancy(opportunity) {
  return {
    id: opportunity.id,
    category: opportunity.category,
    closing: opportunity.closing,
    department: opportunity.department,
    division: opportunity.division,
    employment_type: opportunity.employment_type,
    location: opportunity.location,
    official_document: opportunity.official_document,
    official_document_name: opportunity.official_document_name,
    official_document_view_url: opportunity.official_document_view_url,
    organization: opportunity.organization,
    posted: opportunity.posted,
    saved_at: new Date().toISOString(),
    summary: opportunity.summary,
    title: opportunity.title,
    type: opportunity.type,
    vacancy_type: opportunity.vacancy_type,
  };
}

export function upsertSavedVacancy(user, opportunity) {
  const savedVacancy = toSavedVacancy(opportunity);
  const current = getSavedVacancies(user).filter((item) => item.id !== savedVacancy.id);
  return saveSavedVacancies(user, [savedVacancy, ...current]);
}

export function removeSavedVacancy(user, vacancyId) {
  const current = getSavedVacancies(user).filter((item) => item.id !== vacancyId);
  return saveSavedVacancies(user, current);
}

export function isVacancySaved(user, vacancyId) {
  return getSavedVacancies(user).some((item) => item.id === vacancyId);
}
