import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routesSource = readFileSync(new URL("../../modules/applicant/applicantRoutes.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./ApplicantPortalListPage.jsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("./ApplicantProfilePage.jsx", import.meta.url), "utf8");
const viewSource = readFileSync(new URL("./ApplicantApplicationViewPage.jsx", import.meta.url), "utf8");
const formSource = readFileSync(new URL("./ApplicantInternshipApplicationPage.jsx", import.meta.url), "utf8");
const infoSource = readFileSync(new URL("./ApplicantInternshipInfoContent.jsx", import.meta.url), "utf8");

test("applicant incomplete applications can be reopened for editing", () => {
  assert.match(routesSource, /internshipApplicationEdit: \(id\) => `\/profile\/internship-application\?application=\$\{id\}`/);
  assert.match(listSource, /status === "draft" \|\| status === "incomplete"/);
  assert.match(listSource, /status === "incomplete" \? "Kemaskini" : "Teruskan"/);
  assert.match(viewSource, /status === "incomplete"/);
  assert.match(viewSource, /Kemaskini Permohonan/);
  assert.match(formSource, /useSearchParams/);
  assert.match(formSource, /editableApplicationStatuses\.has/);
  assert.match(formSource, /useState\(\(\) => loadStudentInfoDraft\(user\)\)/);
  assert.doesNotMatch(formSource, /\[editApplicationId, savedDraft\?\.studentInfo, user\]/);
  assert.match(
    formSource,
    /Number\(application\.vacancy\) === Number\(internshipVacancy\?\.id\)[\s\S]*editableApplicationStatuses\.has\(application\.status \|\| "draft"\)/,
  );
});

test("applicant rejected applications use Ditolak status label", () => {
  assert.match(listSource, /rejected: "Ditolak"/);
  assert.match(viewSource, /rejected: "Ditolak"/);
  assert.doesNotMatch(listSource, /Tidak berjaya/);
  assert.doesNotMatch(viewSource, /Tidak berjaya/);
});

test("applicant accepted applications stay hidden behind review status until HRM notification", () => {
  assert.match(listSource, /accepted: "Dalam semakan"/);
  assert.match(viewSource, /accepted: "Dalam semakan"/);
  assert.match(listSource, /function hasOrganizationFeedbackBeenSent\(application\)/);
  assert.match(listSource, /function getApplicantVisibleStatus\(status, application = null\)/);
  assert.match(listSource, /status === "accepted" && !hasOrganizationFeedbackBeenSent\(application\) \? "screening" : status/);
  assert.match(listSource, /function getApplicantStatusLabel\(status, application = null\)/);
  assert.match(listSource, /status === "accepted" && hasOrganizationFeedbackBeenSent\(application\)\) return "Diterima"/);
  assert.match(listSource, /getApplicantStatusLabel\(status, application\)/);
  assert.match(viewSource, /maskAcceptedStatus = true/);
  assert.match(viewSource, /maskAcceptedStatus && status === "accepted" \? "screening" : status/);
  assert.match(viewSource, /!maskAcceptedStatus && status === "accepted"\) return "Diterima"/);
  assert.match(viewSource, /const organizationFeedbackTab = "Maklumbalas Organisasi"/);
  assert.match(viewSource, /tabGroups = \[\]/);
  assert.match(viewSource, /student-info-tabs-grouped/);
  assert.match(viewSource, /panelTabs\.map\(renderTabButton\)/);
  assert.match(viewSource, /function hasOrganizationFeedbackBeenSent\(application\)/);
  assert.match(viewSource, /extraTabs=\{organizationFeedbackSent \? \[organizationFeedbackTab, applicantConfirmationTab\] : \[\]\}/);
  assert.match(viewSource, /maskAcceptedStatus=\{!organizationFeedbackSent\}/);
  assert.match(viewSource, /function ApplicantOrganizationFeedbackTab/);
  assert.match(viewSource, /function getApplicantFeedbackPlacementDepartment\(application\)/);
  assert.match(viewSource, /className="organization-feedback-table applicant-organization-feedback-table"/);
  assert.match(viewSource, /<th>Nama Pelajar<\/th>/);
  assert.match(viewSource, /<th>Tempoh Latihan Industri \/ Praktikal<\/th>/);
  assert.match(viewSource, /<th>Program<\/th>/);
  assert.match(viewSource, /<th>Bahagian Ditempatkan<\/th>/);
  assert.match(viewSource, /Dengan segala hormatnya perkara di atas adalah dirujuk\./);
  assert.match(
    viewSource,
    /Sukacita dimaklumkan bahawa Dewan Bandaraya Kuching Utara tiada halangan untuk menerima anda bagi menjalani/,
  );
  assert.ok(
    viewSource.indexOf('className="organization-feedback-intro"') <
      viewSource.indexOf('className="organization-feedback-table applicant-organization-feedback-table"'),
  );
  assert.match(viewSource, /function getOrganizationFeedbackReportValue\(application, field\)/);
  assert.match(viewSource, /function getOrganizationFeedbackConfirmationDate\(application\)/);
  assert.match(viewSource, /<dd>\{feedbackReportDate\}<\/dd>/);
  assert.match(viewSource, /<dd>\{feedbackReportTime\}<\/dd>/);
  assert.match(viewSource, /feedbackReportPlace\.split\("\\n"\)/);
  assert.match(viewSource, /\{feedbackConfirmationDate\}<\/span>/);
  assert.match(viewSource, /Maklumat lapor diri adalah seperti berikut:/);
  assert.match(viewSource, /className="organization-feedback-report-note applicant-organization-report-note"/);
  assert.match(viewSource, /className="organization-feedback-confirmation-note"/);
  assert.match(viewSource, /Sila buat pengesahan secara bertulis/);
  assert.match(viewSource, /seperti di Lampiran II/);
  assert.match(viewSource, /className="organization-feedback-confirmation-date"/);
  assert.match(viewSource, /Sila muat turun dokumen maklumbalas organisasi di bawah\./);
  assert.match(viewSource, /const \[feedbackRelease\] = useState\(\(\) => getOrganizationFeedbackRelease\(application\)\)/);
  assert.match(viewSource, /const \[feedbackDocuments\] = useState\(\(\) => getOrganizationFeedbackDocuments\(application\)\)/);
  assert.match(viewSource, /const \[feedbackReportDate\] = useState\(\(\) => getOrganizationFeedbackReportValue\(application, "date"\)\)/);
  assert.match(viewSource, /const \[feedbackReportTime\] = useState\(\(\) => getOrganizationFeedbackReportValue\(application, "time"\)\)/);
  assert.match(viewSource, /const \[feedbackReportPlace\] = useState\(\(\) => getOrganizationFeedbackReportValue\(application, "place"\)\)/);
  assert.match(viewSource, /const \[feedbackConfirmationDate\] = useState\(\(\) => getOrganizationFeedbackConfirmationDate\(application\)\)/);
  assert.match(
    viewSource,
    /className="organization-feedback-document-table applicant-organization-document-table"/,
  );
  assert.match(viewSource, /<th>#<\/th>/);
  assert.match(viewSource, /<th>Format<\/th>/);
  assert.match(viewSource, /<th>Lampiran<\/th>/);
  assert.match(viewSource, /<th>Tindakan<\/th>/);
  assert.match(viewSource, /className="organization-feedback-icon-button organization-feedback-icon-button-view"/);
  assert.match(viewSource, /aria-label=\{`Lihat \$\{document\.name\}`\}/);
  assert.match(viewSource, /function renderDocumentRow\(document, documents, studentInfo\)/);
  assert.match(viewSource, /className="organization-feedback-icon-button organization-feedback-icon-button-view"/);
  assert.match(viewSource, /aria-label=\{`Lihat \$\{file\.name\}`\}/);
  assert.match(viewSource, /title="Lihat fail"/);
  assert.doesNotMatch(viewSource, /<Icon>visibility<\/Icon>\s*Lihat\s*<\/button>/);
  assert.match(cssSource, /\.student-readonly-document-cell \.organization-feedback-icon-button \{/);
  assert.doesNotMatch(viewSource, /organizationFeedbackDate/);
  assert.doesNotMatch(viewSource, /Tarikh Maklumbalas/);
});

test("applicant organization feedback notification shows red badges", () => {
  assert.match(listSource, /function hasNewOrganizationFeedbackForApplicant\(application\)/);
  assert.match(listSource, /\(application\?\.status \|\| ""\) === "accepted" && hasOrganizationFeedbackBeenSent\(application\) && !hasApplicantAgreedToOffer\(application\)/);
  assert.match(listSource, /const newApplicationFeedbackCount = useMemo/);
  assert.match(listSource, /displayApplications\.filter\(hasNewOrganizationFeedbackForApplicant\)\.length/);
  assert.match(listSource, /applicationBadgeCount=\{newApplicationFeedbackCount\}/);
  assert.match(listSource, /className="applicant-applications-table applicant-profile-applications-table"/);
  assert.match(listSource, /className="applicant-reference-col"/);
  assert.match(listSource, /className="applicant-reference-cell"/);
  assert.match(listSource, /className="applicant-new-badge">Baharu/);
  assert.match(listSource, /className="applicant-reference-number">\{formatReferenceNo\(application\)\}/);
  assert.match(listSource, /aria-label=\{`Lihat permohonan \$\{formatReferenceNo\(application\)\}`\}/);
  assert.match(listSource, /<Icon>visibility<\/Icon>\s*<\/Link>/);
  assert.match(profileSource, /export function ProfileSidebar\(\{ applicationBadgeCount = 0, isOpen, onToggle \}\)/);
  assert.match(profileSource, /item\.to === APPLICANT_ROUTES\.applications \? applicationBadgeCount : 0/);
  assert.match(profileSource, /className=\{`profile-nav-badge\$\{isOpen \? "" : " collapsed"\}`\}/);
  assert.match(profileSource, /aria-label=\{`\$\{badgeCount\} maklumbalas baharu`\}/);
  assert.match(cssSource, /\.applicant-applications-table th:first-child,\s*\.applicant-applications-table td:first-child \{[\s\S]*min-width: 270px;[\s\S]*text-align: center;/);
  assert.match(cssSource, /\.applicant-profile-applications-table \{[\s\S]*table-layout: fixed;/);
  assert.match(cssSource, /\.applicant-profile-applications-table \.applicant-reference-col \{[\s\S]*width: 230px;/);
  assert.match(cssSource, /\.applicant-profile-applications-table th:first-child,\s*\.applicant-profile-applications-table td:first-child \{[\s\S]*width: 230px;[\s\S]*min-width: 0;[\s\S]*max-width: 230px;/);
  assert.match(cssSource, /\.applicant-reference-cell \{[\s\S]*position: relative;[\s\S]*display: block;[\s\S]*text-align: center;/);
  assert.match(cssSource, /\.applicant-reference-number \{[\s\S]*display: inline-block;[\s\S]*padding-inline: 4px;/);
  assert.match(cssSource, /\.applicant-new-badge \{[\s\S]*position: absolute;[\s\S]*left: -10px;[\s\S]*transform: translateY\(-50%\);[\s\S]*padding: 4px 8px;[\s\S]*font-size: 10px;/);
  assert.match(cssSource, /\.applicant-profile-applications-table \.app-view-action \{[\s\S]*width: 38px;[\s\S]*height: 38px;[\s\S]*background: #eff6ff;[\s\S]*color: #0b70c9;/);
});

test("applicant can submit acceptance confirmation after organization feedback", () => {
  assert.match(viewSource, /const applicantConfirmationTab = "Pengesahan Pemohon"/);
  assert.match(viewSource, /function hasApplicantAgreedToOffer\(application\)/);
  assert.match(viewSource, /getApplicantAgreedInternshipStatus\(application\)/);
  assert.match(viewSource, /applicant_agreed: "Pengesahan Dihantar"/);
  assert.match(listSource, /getApplicantAgreedInternshipStatus\(application\)/);
  assert.match(listSource, /applicant_agreed: "Pengesahan Dihantar"/);
  assert.match(viewSource, /extraTabs=\{organizationFeedbackSent \? \[organizationFeedbackTab, applicantConfirmationTab\] : \[\]\}/);
  assert.match(viewSource, /function ApplicantConfirmationTab/);
  assert.match(viewSource, /Muat Naik Dokumen/);
  assert.match(viewSource, /Dokumen pengesahan pemohon[\s\S]*organization-feedback-required/);
  assert.match(viewSource, /Wajib muat naik sekurang-kurangnya satu dokumen pengesahan penerimaan tawaran dalam format PDF\./);
  assert.match(viewSource, /applicantConfirmationDocuments/);
  assert.match(viewSource, /const \[confirmationState, setConfirmationState\] = useState\(\(\) => \(\{/);
  assert.match(viewSource, /isAgreed: hasApplicantAgreedToOffer\(application\)/);
  assert.match(viewSource, /documents: getApplicantConfirmationDocuments\(application\)/);
  assert.match(viewSource, /const isAgreed = confirmationState\.isAgreed/);
  assert.match(viewSource, /setConfirmationState\(\{/);
  assert.match(viewSource, /setSelectedFiles\(\(current\) => \[\.\.\.current, \.\.\.files\]\)/);
  assert.doesNotMatch(viewSource, /setSelectedFiles\(files\)/);
  assert.match(viewSource, /file,\s*index/);
  assert.match(viewSource, /URL\.createObjectURL\(document\.file\)/);
  assert.match(viewSource, /URL\.revokeObjectURL\(previewUrl\)/);
  assert.match(viewSource, /function removeConfirmationFile\(index\)/);
  assert.match(viewSource, /organization-feedback-icon-button organization-feedback-icon-button-remove-file/);
  assert.match(viewSource, /aria-label=\{`Buang \$\{document\.name\}`\}/);
  assert.match(viewSource, /disabled=\{!document\.url && !document\.file\}/);
  assert.match(viewSource, /disabled=\{isAgreed \|\| isSaving \|\| !selectedFiles\.length\}/);
  assert.match(viewSource, /Dengan ini, saya mengesahkan penerimaan tawaran menjalani latihan industri di Dewan Bandaraya Kuching Utara \(DBKU\)/);
  assert.match(viewSource, /Sekian, terima kasih atas perhatian dan kerjasama pihak puan\./);
  assert.match(viewSource, /function ApplicantConfirmationSendConfirmModal/);
  assert.match(viewSource, /profile-confirm-dialog applicant-confirmation-send-dialog/);
  assert.match(viewSource, /Anda yakin mahu menghantar pengesahan penerimaan tawaran ini\?/);
  assert.match(cssSource, /\.applicant-confirmation-send-dialog h2 \{/);
  assert.match(cssSource, /background: transparent;/);
  assert.match(cssSource, /padding: 0;/);
  assert.match(viewSource, /\/confirm-offer\//);
  assert.match(viewSource, /function handleApplicantConfirmationSent\(updatedApplication\)/);
  assert.match(viewSource, /setApplication\(updatedApplication\)/);
  assert.match(viewSource, /navigate\(APPLICANT_ROUTES\.applications\)/);
  assert.match(viewSource, /onConfirmed=\{handleApplicantConfirmationSent\}/);
  assert.match(viewSource, />\s*Seterusnya\s*</);
  assert.match(viewSource, />\s*Hantar\s*</);
  assert.match(cssSource, /\.applicant-confirmation-panel/);
  assert.match(cssSource, /\.applicant-confirmation-statement/);
});

test("internship personal tab shows passport upload before personal details table", () => {
  assert.match(formSource, /function renderPassportPhotoUpload/);
  assert.match(formSource, /className="student-info-photo-card"/);
  assert.match(formSource, /className="student-passport-upload"/);
  assert.match(formSource, /Muat Naik\s*<br \/>gambar\s*<br \/>pasport/);
  assert.match(formSource, /3\.5 cm x 5\.0 cm/);
  assert.match(formSource, /accept="\.jpg,\s*\.jpeg,\s*image\/jpeg"/);
  assert.match(formSource, /updateDocument\("passportPhotoFile"\)/);
  assert.match(formSource, /clearDocument\("passportPhotoFile"\)/);
  assert.match(formSource, /passportPhotoPreviewUrlRef = useRef\(""\)/);
  assert.match(formSource, /URL\.createObjectURL\(file\)/);
  assert.match(formSource, /URL\.revokeObjectURL\(passportPhotoPreviewUrlRef\.current\)/);
  assert.match(formSource, /src=\{passportPhotoPreviewUrl\}/);
  assert.match(formSource, /alt="Gambar pasport dimuat naik"/);
  assert.match(cssSource, /\.student-info-photo-card \{[\s\S]*margin-bottom: 34px;/);
  assert.ok(
    formSource.indexOf("{renderPassportPhotoUpload()}") <
      formSource.indexOf('<div className="student-personal-table-wrap">'),
  );
});

test("internship uploaded documents stay in form local state until submission", () => {
  assert.match(formSource, /function getDraftStudentInfo\(studentInfo = \{\}\)/);
  assert.match(formSource, /const draftStudentInfo = \{ \.\.\.studentInfo \};/);
  assert.match(formSource, /documentFields\.forEach\(\(\{ field \}\) => \{/);
  assert.match(formSource, /delete draftStudentInfo\[field\];/);
  assert.match(formSource, /studentInfo: getDraftStudentInfo\(studentInfo\)/);
  assert.match(formSource, /const \[documentFiles, setDocumentFiles\] = useState\(\{\}\)/);
  assert.match(formSource, /const \[passportPhotoPreviewUrl, setPassportPhotoPreviewUrl\] = useState\(""\)/);
});

test("internship submission requires all mandatory info tabs", () => {
  assert.match(formSource, /const requiredInfoTabs = \[personalInfoTab, "Maklumat Akademik", "Dokumen Sokongan"\]/);
  assert.match(formSource, /requiredInfoTabs\.find\(\(tab\) => !isTabComplete\(tab, studentInfo\)\)/);
  assert.match(formSource, /requiredInfoTabs\.forEach\(\(tab\) => \{/);
  assert.match(formSource, /const requiredInfoTabsComplete = requiredInfoTabs\.every\(\(tab\) => isTabComplete\(tab, studentInfo\)\)/);
  assert.match(formSource, /const isApplicationReadyToSubmit = declarationAccepted && requiredInfoTabsComplete/);
  assert.match(formSource, /disabled=\{!isApplicationReadyToSubmit \|\| isSubmittingApplication\}/);
});

test("internship mandatory tabs and fields show red required markers", () => {
  assert.match(formSource, /function RequiredMarker\(\)/);
  assert.match(formSource, /className="student-required-marker"/);
  assert.match(formSource, /function renderRequiredLabel\(label, required = true\)/);
  assert.match(formSource, /function isRequiredInfoTab\(tab\)/);
  assert.match(formSource, /renderRequiredLabel\(tab, isRequiredInfoTab\(tab\)\)/);
  assert.match(formSource, /<h2>\{renderRequiredLabel\(activeInfoTab, isRequiredInfoTab\(activeInfoTab\)\)\}<\/h2>/);
  assert.match(formSource, /const renderPersonalRow = \(label, fieldContent, className = "", required = true\)/);
  assert.match(formSource, /<th scope="row">\{renderRequiredLabel\(label, required\)\}<\/th>/);
  assert.match(formSource, /renderPersonalRow\(\s*"Nama Penyelaras Program"[\s\S]*,\s*false,\s*\)/);
  assert.match(cssSource, /\.student-required-marker \{[\s\S]*color: #dc2626;/);
  assert.match(cssSource, /\.student-personal-table th \.student-required-marker \{[\s\S]*display: inline;/);
});

test("applicant rejected internship applications can apply again", () => {
  assert.match(routesSource, /internshipApplicationNew: "\/profile\/internship-application\?new=1"/);
  assert.match(infoSource, /reapplyAllowedApplicationStatuses = new Set\(\["rejected", "withdrawn"\]\)/);
  assert.match(infoSource, /function isReapplyAllowedInternshipApplication/);
  assert.match(infoSource, /function isBlockingInternshipApplication/);
  assert.match(
    infoSource,
    /status !== "draft"[\s\S]*!reapplyAllowedApplicationStatuses\.has\(status\)/,
  );
  assert.match(infoSource, /setHasSubmittedInternshipApplication\(applications\.some\(isBlockingInternshipApplication\)\)/);
  assert.match(
    infoSource,
    /setHasReapplyAllowedInternshipApplication\(applications\.some\(isReapplyAllowedInternshipApplication\)\)/,
  );
  assert.match(infoSource, /draft\?\.purpose === "new-application"/);
  assert.match(
    infoSource,
    /const hasEditableLocalDraft = hasDraft && \(!hasReapplyAllowedInternshipApplication \|\| hasNewApplicationDraft\)/,
  );
  assert.match(
    infoSource,
    /hasReapplyAllowedInternshipApplication\s*\?\s*APPLICANT_ROUTES\.internshipApplicationNew/,
  );
  assert.doesNotMatch(infoSource, /: hasDraft\s*\?/);
  assert.match(formSource, /const isStartingNewApplication = searchParams\.get\("new"\) === "1"/);
  assert.match(
    formSource,
    /const activeSavedDraft = isStartingNewApplication && savedDraft\?\.purpose !== "new-application"\s*\?\s*null\s*:\s*savedDraft/,
  );
  assert.match(formSource, /activeSavedDraft\?\.studentInfo/);
  assert.match(formSource, /purpose:[\s\S]*"new-application"/);
  assert.match(listSource, /reapplyAllowedApplicationStatuses = new Set\(\["rejected", "withdrawn"\]\)/);
  assert.match(listSource, /function shouldHideLocalDraftForApplication/);
  assert.match(
    listSource,
    /isInternshipApplication\(application\)[\s\S]*!reapplyAllowedApplicationStatuses\.has\(status\)/,
  );
  assert.match(
    listSource,
    /const hasBlockingInternshipApplication = applications\.some\(shouldHideLocalDraftForApplication\)/,
  );
  assert.match(listSource, /hasBlockingInternshipApplication \? applications : \[localDraftApplication, \.\.\.applications\]/);
  assert.doesNotMatch(listSource, /hasInternshipApplication \? applications/);
});
