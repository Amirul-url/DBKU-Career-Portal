import { Link } from "react-router-dom";

function Icon({ children, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

function AuthNav() {
  return (
    <header className="top-app-bar auth-top-bar">
      <nav className="nav-inner" aria-label="Authentication navigation">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <img src="/logo-dbku.png" alt="DBKU logo" />
          </span>
          <span>DBKU Career Portal</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Jobs</Link>
          <Link to="/">Internships</Link>
          <Link to="/">Dashboard</Link>
        </div>

        <div className="auth-nav-actions">
          <Link to="/login">Login</Link>
          <Link to="/register" className="auth-nav-primary">Register</Link>
        </div>
      </nav>
    </header>
  );
}

function AuthVisual({ mode }) {
  return (
    <aside className="auth-visual">
      <div className="auth-visual-pattern" aria-hidden="true" />
      <div className="auth-visual-copy">
        <span>{mode === "login" ? "Welcome Back" : "Candidate Registration"}</span>
        <h1>
          {mode === "login"
            ? "Continue your DBKU career journey."
            : "Create your profile for jobs and internships."}
        </h1>
        <p>
          {mode === "login"
            ? "Access saved applications, interview updates, and HR notifications from one secure portal."
            : "Register once to apply for DBKU openings, monitor application progress, and receive updates."}
        </p>
      </div>
      <div className="auth-visual-image">
        <img src="/discussion.jpg" alt="Professionals in a workplace discussion" />
      </div>
    </aside>
  );
}

export function LoginPage() {
  return (
    <div className="auth-page login-auth-page">
      <AuthNav />
      <main className="auth-shell login-auth-shell">
        <AuthVisual mode="login" />
        <section className="auth-card" aria-labelledby="login-title">
          <div className="auth-card-header">
            <span className="auth-card-icon">
              <Icon>lock</Icon>
            </span>
            <div>
              <h2 id="login-title">Login to Portal</h2>
              <p>Use your NRIC number to access the portal.</p>
            </div>
          </div>

          <form className="auth-form">
            <label>
              <span>NRIC Number</span>
              <div className="auth-input">
                <Icon>badge</Icon>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="12"
                  placeholder="e.g. 900101135555"
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="auth-input">
                <Icon>key</Icon>
                <input type="password" placeholder="Enter your password" />
              </div>
            </label>

            <div className="auth-form-row">
              <label className="auth-check">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#forgot-password">Forgot password?</a>
            </div>

            <button type="button" className="auth-submit">Login</button>
          </form>

          <p className="auth-switch">
            New applicant? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export function RegisterPage() {
  return (
    <div className="auth-page register-auth-page">
      <AuthNav />
      <main className="register-shell">
        <div className="register-titlebar">
          <Link to="/login" className="register-back">
            <Icon>arrow_back</Icon>
            Back to Login
          </Link>
          <h1>Candidate Registration</h1>
          <p>
            Register as a Malaysian applicant using your NRIC details. Fields marked with
            an asterisk are required.
          </p>
        </div>

        <form className="register-form">
          <section className="register-section">
            <div className="register-section-strip" />
            <div className="register-section-body">
              <div className="register-section-heading">
                <Icon>person</Icon>
                <h2>Personal Information</h2>
              </div>

              <div className="register-grid">
                <label className="span-2">
                  <span>Full Name as per NRIC <strong>*</strong></span>
                  <input type="text" placeholder="e.g. AHMAD BIN ALI" />
                </label>
                <label>
                  <span>Gender <strong>*</strong></span>
                  <select defaultValue="">
                    <option value="" disabled>Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <label>
                  <span>Date of Birth <strong>*</strong></span>
                  <input type="date" />
                </label>
                <label>
                  <span>Nationality <strong>*</strong></span>
                  <input type="text" value="Malaysia" readOnly />
                </label>
                <label>
                  <span>NRIC Number <strong>*</strong></span>
                  <input type="text" inputMode="numeric" maxLength="12" placeholder="e.g. 900101135555" />
                  <small>Enter without dashes</small>
                </label>
              </div>
            </div>
          </section>

          <section className="register-section">
            <div className="register-section-body">
              <div className="register-section-heading">
                <Icon>contact_mail</Icon>
                <h2>Contact Details</h2>
              </div>

              <div className="register-grid">
                <label>
                  <span>Mobile Number <strong>*</strong></span>
                  <div className="phone-field">
                    <b>+60</b>
                    <input type="tel" placeholder="123456789" />
                  </div>
                </label>
                <label>
                  <span>Email Address <strong>*</strong></span>
                  <input type="email" placeholder="example@email.com" />
                </label>
                <div className="span-4 register-subheading">Address</div>
                <label className="span-2">
                  <span>Address Line 1 <strong>*</strong></span>
                  <input type="text" placeholder="House no., street name" />
                </label>
                <label className="span-2">
                  <span>Address Line 2 <strong>*</strong></span>
                  <input type="text" placeholder="Area, building, or landmark" />
                </label>
                <label>
                  <span>Postcode <strong>*</strong></span>
                  <input type="text" placeholder="e.g. 93000" />
                </label>
                <label>
                  <span>City <strong>*</strong></span>
                  <input type="text" placeholder="Kuching" />
                </label>
                <label>
                  <span>State <strong>*</strong></span>
                  <select defaultValue="">
                    <option value="" disabled>Select state</option>
                    <option>Sarawak</option>
                    <option>Sabah</option>
                    <option>Johor</option>
                    <option>Kedah</option>
                    <option>Kelantan</option>
                    <option>Melaka</option>
                    <option>Negeri Sembilan</option>
                    <option>Pahang</option>
                    <option>Penang</option>
                    <option>Perak</option>
                    <option>Perlis</option>
                    <option>Selangor</option>
                    <option>Terengganu</option>
                    <option>W.P. Kuala Lumpur</option>
                    <option>W.P. Labuan</option>
                    <option>W.P. Putrajaya</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="register-section">
            <div className="register-section-body">
              <div className="register-section-heading">
                <Icon>security</Icon>
                <h2>Account Security</h2>
              </div>

              <div className="register-grid">
                <label className="span-2">
                  <span>Password <strong>*</strong></span>
                  <input type="password" placeholder="Create password" />
                </label>
                <label className="span-2">
                  <span>Confirm Password <strong>*</strong></span>
                  <input type="password" placeholder="Confirm password" />
                </label>
              </div>
            </div>
          </section>

          <div className="register-actions">
            <Link to="/login">Cancel</Link>
            <button type="button">Submit Registration</button>
          </div>
        </form>
      </main>
      <footer className="register-footer">
        <strong>DBKU Career Portal</strong>
        <span>Copyright 2026 Kuching North City Commission (DBKU). All Rights Reserved.</span>
      </footer>
    </div>
  );
}
