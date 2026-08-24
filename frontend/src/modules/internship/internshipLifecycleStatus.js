const malayMonthNumbers = {
  januari: 0,
  jan: 0,
  februari: 1,
  feb: 1,
  mac: 2,
  march: 2,
  april: 3,
  apr: 3,
  mei: 4,
  may: 4,
  jun: 5,
  june: 5,
  julai: 6,
  july: 6,
  ogos: 7,
  aug: 7,
  august: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  oct: 9,
  november: 10,
  nov: 10,
  disember: 11,
  dec: 11,
  december: 11,
};

export const internshipLifecycleStatusLabels = {
  applicant_agreed: "Pemohon Bersetuju",
  internship_active: "Sedang Menjalani LI",
  internship_completed: "Tamat LI",
};

export const internshipLifecycleStatusClasses = {
  applicant_agreed: "green",
  internship_active: "green",
  internship_completed: "slate",
};

function normalizeDay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateValue(value) {
  if (value instanceof Date) return normalizeDay(value);

  const text = String(value || "").trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const malayMatch = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (malayMatch) {
    const month = malayMonthNumbers[malayMatch[2].toLowerCase()];
    if (month !== undefined) return new Date(Number(malayMatch[3]), month, Number(malayMatch[1]));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : normalizeDay(parsed);
}

function getOrganizationFeedbackRelease(application) {
  const release = application?.profile_data?.organization_feedback_release;
  return release && typeof release === "object" ? release : {};
}

function getInternshipStudentInfo(application) {
  return application?.profile_data?.student_info || {};
}

function getFirstAvailableValue(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function parseInternshipPeriodText(value) {
  const [startText, endText] = String(value || "").split(/\s+-\s+|\s+hingga\s+|\s+to\s+/i);
  const startDate = parseDateValue(startText);
  const endDate = parseDateValue(endText);
  return startDate && endDate ? { startDate, endDate } : null;
}

function getInternshipPeriodRange(application) {
  const releasePeriod = String(getOrganizationFeedbackRelease(application).internship_period || "").trim();
  const releaseRange = parseInternshipPeriodText(releasePeriod);
  if (releaseRange) return releaseRange;

  const studentInfo = getInternshipStudentInfo(application);
  const startDate = parseDateValue(getFirstAvailableValue(
    studentInfo.trainingStartDate,
    studentInfo.training_start_date,
    studentInfo.internshipStartDate,
    studentInfo.internship_start_date,
    studentInfo.practicalStartDate,
  ));
  const endDate = parseDateValue(getFirstAvailableValue(
    studentInfo.trainingEndDate,
    studentInfo.training_end_date,
    studentInfo.internshipEndDate,
    studentInfo.internship_end_date,
    studentInfo.practicalEndDate,
  ));

  if (startDate && endDate) return { startDate, endDate };

  return parseInternshipPeriodText(studentInfo.trainingPeriod || studentInfo.internshipPeriod);
}

export function hasApplicantAgreedToOffer(application) {
  return application?.profile_data?.applicant_confirmation?.status === "agreed";
}

export function getInternshipLifecycleStatus(application, currentDate = new Date()) {
  const range = getInternshipPeriodRange(application);
  const today = normalizeDay(currentDate);
  if (!range || !today) return "";

  if (today > range.endDate) return "internship_completed";
  if (today >= range.startDate && today <= range.endDate) return "internship_active";
  return "";
}

export function getApplicantAgreedInternshipStatus(application, currentDate = new Date()) {
  if (!hasApplicantAgreedToOffer(application)) return "";
  return getInternshipLifecycleStatus(application, currentDate) || "internship_active";
}
