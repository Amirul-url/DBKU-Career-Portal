import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const opportunities = [
  {
    id: "urban-planner",
    title: "Senior Urban Planner",
    department: "Department of Planning",
    category: "Job",
    type: "Full-time",
    salary: "RM 4,500 - 6,200",
    location: "DBKU Headquarters",
    closing: "18 Aug 2026",
    posted: "Posted 2 days ago",
    icon: "architecture",
    image: "/senior urban planner.jpg",
    summary:
      "Lead strategic urban development projects that support a sustainable and livable Kuching North.",
    responsibilities: [
      "Prepare urban planning briefs, reports, and technical recommendations.",
      "Coordinate development reviews with internal departments and agencies.",
      "Support city improvement initiatives with planning data and field input.",
    ],
    requirements: [
      "Degree in Urban Planning, Architecture, Geography, or related field.",
      "Minimum 5 years of relevant planning or municipal development experience.",
      "Strong report writing and stakeholder coordination skills.",
    ],
  },
  {
    id: "it-support-intern",
    title: "IT Support Intern",
    department: "Digital Services",
    category: "Internship",
    type: "Internship",
    salary: "Allowance provided",
    location: "ICT Unit",
    closing: "25 Aug 2026",
    posted: "Posted 4 days ago",
    icon: "computer",
    summary:
      "Support municipal software, service desk operations, and digital workflow documentation.",
    responsibilities: [
      "Assist first-level support for internal users and devices.",
      "Document common service desk issues and basic troubleshooting steps.",
      "Support digital records, inventory updates, and system testing.",
    ],
    requirements: [
      "Diploma or degree student in IT, Computer Science, or related field.",
      "Available for a minimum internship period of 3 months.",
      "Comfortable with basic software, hardware, and user support tasks.",
    ],
  },
  {
    id: "environmental-officer",
    title: "Environmental Officer",
    department: "Urban Environment",
    category: "Job",
    type: "Permanent",
    salary: "RM 3,200 - 4,800",
    location: "Operations Office",
    closing: "30 Aug 2026",
    posted: "Posted 1 week ago",
    icon: "eco",
    summary:
      "Coordinate waste management protocols and green space initiatives across DBKU areas.",
    responsibilities: [
      "Monitor environmental service activities within assigned city zones.",
      "Prepare field observations and follow-up action reports.",
      "Coordinate public cleanliness and green initiative activities.",
    ],
    requirements: [
      "Diploma or degree in Environmental Science or related discipline.",
      "Experience in municipal services is an advantage.",
      "Able to conduct field checks and communicate with community stakeholders.",
    ],
  },
  {
    id: "accounting-clerk",
    title: "Accounting Clerk",
    department: "Treasury",
    category: "Job",
    type: "Contract",
    salary: "RM 2,000 - 2,800",
    location: "Treasury Department",
    closing: "12 Sep 2026",
    posted: "Posted 1 week ago",
    icon: "account_balance_wallet",
    summary:
      "Assist municipal revenue collection, payment records, and finance reporting tasks.",
    responsibilities: [
      "Update payment records and assist daily reconciliation work.",
      "Prepare supporting schedules for finance reports.",
      "Handle counter-related documentation and filing tasks.",
    ],
    requirements: [
      "SPM/STPM, diploma, or equivalent qualification in accounting or finance.",
      "Careful with numbers, records, and routine administrative work.",
      "Basic spreadsheet and document handling skills.",
    ],
  },
  {
    id: "landscape-intern",
    title: "Landscape Architecture Intern",
    department: "Landscape Unit",
    category: "Internship",
    type: "Internship",
    salary: "Allowance provided",
    location: "Landscape Unit",
    closing: "5 Sep 2026",
    posted: "Posted 10 days ago",
    icon: "park",
    summary:
      "Assist with park improvement concepts, site observations, and landscape documentation.",
    responsibilities: [
      "Support site measurement, photo documentation, and concept preparation.",
      "Assist officers with planting plans and public space improvement notes.",
      "Prepare simple presentation boards and progress records.",
    ],
    requirements: [
      "Student in Landscape Architecture, Design, Horticulture, or related field.",
      "Able to work both on-site and in office documentation settings.",
      "Basic design software or drawing skills are an advantage.",
    ],
  },
];

const filters = [
  ["category", "Opportunity Type", ["All", "Job", "Internship"]],
  ["type", "Work Type", ["All", "Full-time", "Permanent", "Contract", "Internship"]],
  [
    "department",
    "Department",
    ["All", "Department of Planning", "Digital Services", "Urban Environment", "Treasury", "Landscape Unit"],
  ],
];

function Icon({ children, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined notranslate ${className}`}
      aria-hidden="true"
      translate="no"
    >
      {children}
    </span>
  );
}

function OpportunityCard({ opportunity, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`market-job-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <span className="market-job-icon">
        <Icon>{opportunity.icon}</Icon>
      </span>
      <span className="market-job-main">
        <span className="market-job-top">
          <strong>{opportunity.title}</strong>
          <small>{opportunity.posted}</small>
        </span>
        <span className="market-job-dept">{opportunity.department}</span>
        <span className="market-job-summary">{opportunity.summary}</span>
        <span className="market-job-meta">
          <span>
            <Icon>work</Icon>
            {opportunity.type}
          </span>
          <span>
            <Icon>payments</Icon>
            {opportunity.salary}
          </span>
          <span>
            <Icon>event</Icon>
            Closes {opportunity.closing}
          </span>
        </span>
      </span>
      <span className="market-job-badge">{opportunity.category}</span>
    </button>
  );
}

export default function LandingPage() {
  const [selectedId, setSelectedId] = useState(opportunities[0].id);
  const selectedOpportunity = useMemo(
    () => opportunities.find((item) => item.id === selectedId) ?? opportunities[0],
    [selectedId],
  );

  return (
    <div className="market-page">
      <header className="top-app-bar">
        <nav className="nav-inner" aria-label="Main navigation">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <img src="/logo-dbku.png" alt="Logo DBKU" />
            </span>
            <span translate="no">DBKU Career Portal</span>
          </Link>

          <div className="nav-links">
            <Link to="/">Laman Utama</Link>
            <a className="active" href="#jobs">Kerja Kosong</a>
            <a href="#jobs">Latihan Industri</a>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Log Masuk</Link>
            <Link to="/register" className="market-register-link">Daftar Akaun</Link>
          </div>
        </nav>
      </header>

      <main className="market-shell">
        <section className="market-intro" aria-labelledby="market-title">
          <div>
            <span className="market-eyebrow">DBKU Job and Internship Portal</span>
            <h1 id="market-title">Cari peluang kerjaya dan internship DBKU.</h1>
            <p>
              Terokai kekosongan semasa, semak syarat jawatan, dan mulakan permohonan
              dalam satu portal rasmi Kuching North City Commission.
            </p>
          </div>
          <div className="market-intro-stats" aria-label="Portal summary">
            <span>
              <strong>5</strong>
              Openings
            </span>
            <span>
              <strong>23</strong>
              Departments
            </span>
            <span>
              <strong>2</strong>
              Internships
            </span>
          </div>
        </section>

        <section className="market-search-panel" aria-label="Search opportunities">
          <label>
            <Icon>search</Icon>
            <input type="search" placeholder="Search by job title, keyword, or department" />
          </label>
          <label>
            <Icon>location_on</Icon>
            <input type="search" placeholder="Location or work unit" />
          </label>
          <button type="button">
            <Icon>manage_search</Icon>
            Search
          </button>
        </section>

        <section className="market-layout" id="jobs">
          <aside className="market-filters" aria-label="Filters">
            <div className="market-panel-title">
              <Icon>tune</Icon>
              <strong>Filters</strong>
            </div>

            {filters.map(([key, title, values]) => (
              <div className="market-filter-group" key={key}>
                <h2>{title}</h2>
                {values.map((value) => (
                  <label key={value}>
                    <input type="checkbox" defaultChecked={value === "All"} />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            ))}
          </aside>

          <section className="market-results" aria-labelledby="results-title">
            <div className="market-results-head">
              <div>
                <h2 id="results-title">Recommended Opportunities</h2>
                <p>Showing {opportunities.length} openings across DBKU departments</p>
              </div>
              <select aria-label="Sort results" defaultValue="recent">
                <option value="recent">Most recent</option>
                <option value="closing">Closing soon</option>
                <option value="salary">Salary range</option>
              </select>
            </div>

            <div className="market-job-list">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  selected={opportunity.id === selectedOpportunity.id}
                  onSelect={() => setSelectedId(opportunity.id)}
                />
              ))}
            </div>
          </section>

          <aside className="market-detail" aria-label="Selected opportunity details">
            {selectedOpportunity.image ? (
              <img
                src={selectedOpportunity.image}
                alt="Urban planning work table"
                className="market-detail-image"
              />
            ) : (
              <div className="market-detail-icon">
                <Icon>{selectedOpportunity.icon}</Icon>
              </div>
            )}

            <div className="market-detail-body">
              <span className="market-job-badge">{selectedOpportunity.category}</span>
              <h2>{selectedOpportunity.title}</h2>
              <p>{selectedOpportunity.summary}</p>

              <div className="market-detail-meta">
                <span>
                  <Icon>apartment</Icon>
                  {selectedOpportunity.department}
                </span>
                <span>
                  <Icon>location_on</Icon>
                  {selectedOpportunity.location}
                </span>
                <span>
                  <Icon>payments</Icon>
                  {selectedOpportunity.salary}
                </span>
                <span>
                  <Icon>event</Icon>
                  Closing date: {selectedOpportunity.closing}
                </span>
              </div>

              <div className="market-detail-section">
                <h3>Responsibilities</h3>
                <ul>
                  {selectedOpportunity.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="market-detail-section">
                <h3>Requirements</h3>
                <ul>
                  {selectedOpportunity.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="market-detail-actions">
                <Link to="/login">Apply Now</Link>
                <button type="button">
                  <Icon>bookmark</Icon>
                  Save
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
