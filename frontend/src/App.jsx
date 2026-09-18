import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Camera,
  FileText,
  LayoutDashboard,
  Package,
  CalendarDays,
  Bell,
  FolderOpen,
  Users,
  Settings,
  Upload,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Clock3,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Navigation,
  X,
  ExternalLink,
  Image as ImageIcon,
  Menu,
  Plus,
  Trash2,
  Edit3,
  Truck,
  HardHat,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  login,
  signup,
  resetPassword,
  projects,
  project,
  createProject,
  activities,
  createActivity,
  updateActivity,
  deleteActivity,
  dashboard,
  alerts,
  createAlert,
  ackAlert,
  deleteAlert,
  reports,
  forecast,
  analyze,
  materials,
  createMaterial,
  labor,
  createLabor,
  pdfUrl,
  assetUrl,
} from "./api";
import { isSupabaseConfigured } from "./supabase";

const NAV_ITEMS = [
  ["Dashboard", LayoutDashboard],
  ["AI Progress", Camera],
  ["Daily Reports", FileText],
  ["BOQ & Activities", Package],
  ["Materials (IS 1200)", Truck],
  ["Labor & Shifts", HardHat],
  ["Progress Analytics", BarChart3],
  ["Schedule", CalendarDays],
  ["Alerts & Safety", Bell],
  ["Site Evidence", FolderOpen],
  ["Project Settings", Settings],
];

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("buildsight_auth") || "null");
    } catch {
      return null;
    }
  });

  if (!auth) {
    return (
      <AuthScreen
        onAuthSuccess={(userData) => {
          localStorage.setItem("buildsight_auth", JSON.stringify(userData));
          setAuth(userData);
        }}
      />
    );
  }

  return (
    <Shell
      auth={auth}
      onLogout={() => {
        localStorage.removeItem("buildsight_auth");
        setAuth(null);
      }}
    />
  );
}

/* =========================================================================
   AUTH SCREEN (LOGIN / SIGNUP / PASSWORD RESET)
   ========================================================================= */
function AuthScreen({ onAuthSuccess }) {
  const [tab, setTab] = useState("login"); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState("pm.sharma@buildsight.ai");
  const [password, setPassword] = useState("SecureSite2026!");
  const [fullName, setFullName] = useState("Er. Rajesh Sharma");
  const [role, setRole] = useState("PROJECT_MANAGER");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      if (tab === "login") {
        const res = await login(email, password, role);
        onAuthSuccess(res);
      } else if (tab === "signup") {
        const res = await signup(email, password, fullName, role);
        setMsg("Account created successfully! Signing you in...");
        setTimeout(() => onAuthSuccess(res), 800);
      } else if (tab === "reset") {
        const res = await resetPassword(email, password);
        setMsg(res.message || "Password updated successfully. Please sign in.");
        setTab("login");
      }
    } catch (ex) {
      setErr(ex.message || "Authentication error occurred");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="loginCard">
        <div className="logo">
          <div className="logoMark">B</div>
          <div>
            <b>BuildSight AI</b>
            <span>Civil Infrastructure Intelligence</span>
          </div>
        </div>

        <p className="eyebrow">ENTERPRISE CIVIL SUITE • IS 1200 / CPWD</p>
        <h1>Site Progress & Quality</h1>
        <p className="muted">
          Computer vision daily progress reporting, BOQ measurement tracking,
          and CPWD quality compliance verification.
        </p>

        <div className="authTabs">
          <button
            type="button"
            className={`authTab ${tab === "login" ? "active" : ""}`}
            onClick={() => {
              setTab("login");
              setErr("");
              setMsg("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`authTab ${tab === "signup" ? "active" : ""}`}
            onClick={() => {
              setTab("signup");
              setErr("");
              setMsg("");
            }}
          >
            Register
          </button>
          <button
            type="button"
            className={`authTab ${tab === "reset" ? "active" : ""}`}
            onClick={() => {
              setTab("reset");
              setErr("");
              setMsg("");
            }}
          >
            Reset Password
          </button>
        </div>

        {err && (
          <div className="summary warn" style={{ margin: "10px 0" }}>
            <AlertTriangle size={16} />
            <p>{err}</p>
          </div>
        )}
        {msg && (
          <div className="summary ok" style={{ margin: "10px 0" }}>
            <CheckCircle2 size={16} />
            <p>{msg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === "signup" && (
            <label>
              Full Name & Designation
              <input
                required
                type="text"
                placeholder="e.g. Er. Rajesh Sharma (Chief PE)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          )}

          <label>
            Corporate Email
            <input
              required
              type="email"
              placeholder="engineer@buildsight.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            {tab === "reset" ? "New Password" : "Password"}
            <input
              required
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {tab !== "reset" && (
            <label>
              Engineering Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="PROJECT_MANAGER">
                  Project Manager (PMP / CPWD In-Charge)
                </option>
                <option value="SITE_ENGINEER">
                  Resident Site Engineer (Field Civil)
                </option>
                <option value="QUALITY_ENGINEER">
                  QA / QC Engineer (Materials & Testing)
                </option>
                <option value="SAFETY_OFFICER">
                  EHS Safety Officer (Site Safety)
                </option>
                <option value="ADMIN">
                  Executive Director / Super Admin
                </option>
              </select>
            </label>
          )}

          <button
            className="primary wide"
            disabled={busy}
            style={{ marginTop: 16 }}
          >
            {busy
              ? "Verifying Credentials..."
              : tab === "login"
                ? "Authorize & Access Site Portal"
                : tab === "signup"
                  ? "Create Engineer Profile"
                  : "Update Site Password"}
          </button>
        </form>

        <p className="authDisclaimer">
          {isSupabaseConfigured
            ? "Protected by Supabase Cloud Authentication & PostgreSQL TLS"
            : "Operating with High-Performance Local Enterprise DB & Cryptographic Hash Protection"}
        </p>
      </div>
    </div>
  );
}

/* =========================================================================
   MAIN APP SHELL
   ========================================================================= */
function Shell({ auth, onLogout }) {
  const [page, setPage] = useState("Dashboard");
  const [projectId, setProjectId] = useState(1);
  const [projectsList, setProjectsList] = useState([]);
  const [proj, setProj] = useState(null);
  const [dash, setDash] = useState(null);
  const [als, setAls] = useState([]);
  const [reps, setReps] = useState([]);
  const [fc, setFc] = useState(null);
  const [mats, setMats] = useState([]);
  const [labors, setLabors] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Modals
  const [modalNewProject, setModalNewProject] = useState(false);
  const [modalNewActivity, setModalNewActivity] = useState(false);
  const [modalEditActivity, setModalEditActivity] = useState(null);
  const [modalNewMaterial, setModalNewMaterial] = useState(false);
  const [modalNewLabor, setModalNewLabor] = useState(false);
  const [modalNewAlert, setModalNewAlert] = useState(false);

  // AI DPR Workflow state
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!projectId) return;
    try {
      const [pp, dd, aa, rr, ff, mm, ll] = await Promise.all([
        project(projectId).catch(() => null),
        dashboard(projectId).catch(() => null),
        alerts(projectId).catch(() => []),
        reports(projectId).catch(() => []),
        forecast(projectId).catch(() => null),
        materials(projectId).catch(() => []),
        labor(projectId).catch(() => []),
      ]);
      setProj(pp);
      setDash(dd);
      setAls(aa || []);
      setReps(rr || []);
      setFc(ff);
      setMats(mm || []);
      setLabors(ll || []);
    } catch (err) {
      console.error("Failed to load project data:", err);
    }
  };

  const loadProjects = async () => {
    try {
      const plist = await projects();
      setProjectsList(plist);
      if (plist.length > 0 && !plist.find((x) => x.id === projectId)) {
        setProjectId(plist[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch project list:", err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    refresh();
  }, [projectId]);

  const navigateTo = (tabName) => {
    setPage(tabName);
    setMobileNavOpen(false);
  };

  return (
    <div className="app">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobileBackdrop ${mobileNavOpen ? "open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brandMark">B</div>
          <div>
            <b>BuildSight AI</b>
            <span>Civil Engineering ERP</span>
          </div>
        </div>

        <div className="projectPicker">
          <div className="pickerHeader">
            <span>ACTIVE PROJECT</span>
            <button
              type="button"
              className="addProjectMiniBtn"
              onClick={() => setModalNewProject(true)}
              title="Create New Project"
            >
              + New
            </button>
          </div>
          <select
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
          >
            {projectsList.map((x) => (
              <option key={x.id} value={x.id}>
                {x.code} - {x.name}
              </option>
            ))}
          </select>
        </div>

        <nav>
          {NAV_ITEMS.map(([n, Icon]) => (
            <button
              key={n}
              className={page === n ? "active" : ""}
              onClick={() => navigateTo(n)}
            >
              <Icon size={18} />
              {n}
            </button>
          ))}
        </nav>

        <div className="sidebarBottom">
          <div className="userMini">
            <div className="avatar">{auth.user?.name?.[0] || "U"}</div>
            <div>
              <b>{auth.user?.name || "Civil Engineer"}</b>
              <span>{auth.user?.role?.replace("_", " ") || "Engineer"}</span>
            </div>
            <button
              className="iconBtn"
              onClick={onLogout}
              title="Sign Out of Portal"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main>
        <header>
          <div className="headerLeft">
            <button
              type="button"
              className="mobileToggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle Navigation Drawer"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="eyebrow">
                {proj?.code ? `${proj.code} • ` : ""}CPWD & IS SPECIFICATIONS
              </p>
              <h1>{page}</h1>
            </div>
          </div>

          <div className="headerRight">
            <span className="live">
              <i /> Site Core Online
            </span>
            <ShieldCheck size={18} title="Quality Code Verified" />
            <div className="avatar" title={auth.user?.email}>
              {auth.user?.name?.[0] || "U"}
            </div>
          </div>
        </header>

        {page === "Dashboard" && (
          <DashboardView
            proj={proj}
            dash={dash}
            als={als}
            onGoAI={() => navigateTo("AI Progress")}
            onOpenMaterialModal={() => setModalNewMaterial(true)}
            onOpenLaborModal={() => setModalNewLabor(true)}
            onAckAlert={async (id) => {
              await ackAlert(id);
              refresh();
            }}
          />
        )}

        {page === "AI Progress" && (
          <AIProgressView
            proj={proj}
            file={file}
            setFile={setFile}
            busy={busy}
            setBusy={setBusy}
            result={result}
            setResult={setResult}
            onDone={refresh}
          />
        )}

        {page === "Daily Reports" && <ReportsView reps={reps} />}

        {page === "BOQ & Activities" && (
          <ActivitiesView
            proj={proj}
            onOpenAddActivity={() => setModalNewActivity(true)}
            onOpenEditActivity={(act) => setModalEditActivity(act)}
            onDeleteActivity={async (id) => {
              if (window.confirm("Permanently delete this BOQ workfront?")) {
                await deleteActivity(id);
                refresh();
              }
            }}
          />
        )}

        {page === "Materials (IS 1200)" && (
          <MaterialsView
            mats={mats}
            onOpenAddMaterial={() => setModalNewMaterial(true)}
          />
        )}

        {page === "Labor & Shifts" && (
          <LaborView
            labors={labors}
            onOpenAddLabor={() => setModalNewLabor(true)}
          />
        )}

        {page === "Progress Analytics" && (
          <AnalyticsView proj={proj} dash={dash} fc={fc} />
        )}

        {page === "Schedule" && <ScheduleView proj={proj} />}

        {page === "Alerts & Safety" && (
          <AlertsView
            als={als}
            onOpenAddAlert={() => setModalNewAlert(true)}
            onAckAlert={async (id) => {
              await ackAlert(id);
              refresh();
            }}
            onDeleteAlert={async (id) => {
              await deleteAlert(id);
              refresh();
            }}
          />
        )}

        {page === "Site Evidence" && <EvidenceView reps={reps} />}

        {page === "Project Settings" && (
          <SettingsView
            proj={proj}
            auth={auth}
            onOpenNewProject={() => setModalNewProject(true)}
          />
        )}
      </main>

      {/* ================= MODAL DIALOGS ================= */}
      {modalNewProject && (
        <ModalAddProject
          onClose={() => setModalNewProject(false)}
          onSuccess={async (newId) => {
            setModalNewProject(false);
            await loadProjects();
            setProjectId(newId);
          }}
        />
      )}

      {modalNewActivity && (
        <ModalAddActivity
          projectId={projectId}
          onClose={() => setModalNewActivity(false)}
          onSuccess={() => {
            setModalNewActivity(false);
            refresh();
          }}
        />
      )}

      {modalEditActivity && (
        <ModalEditActivity
          activity={modalEditActivity}
          onClose={() => setModalEditActivity(null)}
          onSuccess={() => {
            setModalEditActivity(null);
            refresh();
          }}
        />
      )}

      {modalNewMaterial && (
        <ModalAddMaterial
          projectId={projectId}
          onClose={() => setModalNewMaterial(false)}
          onSuccess={() => {
            setModalNewMaterial(false);
            refresh();
          }}
        />
      )}

      {modalNewLabor && (
        <ModalAddLabor
          projectId={projectId}
          onClose={() => setModalNewLabor(false)}
          onSuccess={() => {
            setModalNewLabor(false);
            refresh();
          }}
        />
      )}

      {modalNewAlert && (
        <ModalAddAlert
          projectId={projectId}
          onClose={() => setModalNewAlert(false)}
          onSuccess={() => {
            setModalNewAlert(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================================
   VIEW 1: DASHBOARD
   ========================================================================= */
function DashboardView({
  proj,
  dash,
  als,
  onGoAI,
  onOpenMaterialModal,
  onOpenLaborModal,
  onAckAlert,
}) {
  const scheduleVariance =
    (dash?.overall_actual || 0) - (dash?.overall_planned || 0);

  return (
    <div className="content">
      <section className="welcome">
        <div>
          <h2>{proj?.name || "Civil Project Baseline"}</h2>
          <p>
            {proj?.location} • Client: {proj?.client} • Budget: ₹
            {proj?.budget ? `${(proj.budget / 10000000).toFixed(2)} Cr` : "N/A"}
          </p>
        </div>
        <div className="welcomeActions">
          <button className="primary" onClick={onGoAI}>
            <Camera size={16} /> New AI DPR
          </button>
          <button className="secondary" onClick={onOpenMaterialModal}>
            <Truck size={16} /> Inward Material
          </button>
          <button className="secondary" onClick={onOpenLaborModal}>
            <HardHat size={16} /> Log Attendance
          </button>
        </div>
      </section>

      <div className="cards">
        <MetricCard
          icon={BarChart3}
          title="Actual Progress"
          value={`${dash?.overall_actual ?? 0}%`}
          meta={`Baseline Plan: ${dash?.overall_planned ?? 0}%`}
        />
        <MetricCard
          icon={TrendingUp}
          title="Schedule Variance"
          value={`${scheduleVariance > 0 ? "+" : ""}${scheduleVariance}%`}
          meta={
            scheduleVariance >= 0
              ? "On Schedule / Ahead"
              : "Critical Path Delay"
          }
        />
        <MetricCard
          icon={Package}
          title="Active BOQ Items"
          value={dash?.activities ?? 0}
          meta="CPWD Specification Items"
        />
        <MetricCard
          icon={Bell}
          title="Open Site Alerts"
          value={dash?.open_alerts ?? 0}
          meta="Quality & EHS Notices"
        />
      </div>

      <div className="twoCol">
        <div className="panel">
          <div className="panelTitle">
            <div>
              <h3>Workfront Progress Baseline</h3>
              <span>IS 1200 Measurement Book Quantities</span>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="plan" /> Planned Schedule
            </span>
            <span>
              <i className="actual" /> Certified Actual
            </span>
          </div>
          {proj?.activities?.map((a) => (
            <div className="progressRow" key={a.id}>
              <div className="rowHead">
                <b>{a.name}</b>
                <span>
                  {a.actual_progress}% actual / {a.planned_progress}% plan
                </span>
              </div>
              <div className="bar">
                <i style={{ width: `${a.planned_progress}%` }} />
                <em style={{ width: `${a.actual_progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panelTitle">
            <div>
              <h3>Engineering Site Signals</h3>
              <span>Real-time Earned Value Diagnostics</span>
            </div>
          </div>
          <div className="summary ok">
            <CheckCircle2 size={18} className="sigIcon" />
            <div>
              <b>CPWD Quality Verification Active</b>
              <p>
                Digital Pour Cards and Cube Test logs are linked to structural
                RCC activities.
              </p>
            </div>
          </div>
          <div
            className={`summary ${scheduleVariance < 0 ? "warn" : "ok"}`}
          >
            <AlertTriangle size={18} className="sigIcon" />
            <div>
              <b>Critical Path Variance ({scheduleVariance}%)</b>
              <p>
                {scheduleVariance < 0
                  ? "Accelerate formwork de-shuttering and steel reinforcement fixing gangs."
                  : "All structural milestones tracking within CPWD tolerance parameters."}
              </p>
            </div>
          </div>
          <div className="summary">
            <TrendingUp size={18} className="sigIcon" />
            <div>
              <b>YOLOv8 Edge Vision Inspection</b>
              <p>
                Automated detection of rebar, scaffolding, safety PPE, and
                masonry workfronts.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Recent Site Non-Conformance & Alerts</h3>
            <span>Site safety violations and structural quality notices</span>
          </div>
        </div>
        {!als.length ? (
          <p style={{ color: "#64748b", fontSize: 12 }}>
            No active quality alerts or safety violations on this project.
          </p>
        ) : (
          als.slice(0, 5).map((a) => (
            <div className="alertRow" key={a.id}>
              <span className={`severity ${a.severity.toLowerCase()}`}>
                {a.severity}
              </span>
              <div style={{ flex: 1 }}>
                <b>{a.title}</b>
                <p>{a.message}</p>
              </div>
              <small>
                {a.acknowledged ? (
                  <span style={{ color: "#16a34a" }}>Acknowledged</span>
                ) : (
                  <button
                    className="secondary smBtn"
                    onClick={() => onAckAlert(a.id)}
                  >
                    Acknowledge
                  </button>
                )}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, meta }) {
  return (
    <div className="metric">
      <div className="metricIcon">
        <Icon size={20} />
      </div>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{meta}</small>
    </div>
  );
}

/* =========================================================================
   VIEW 2: AI COMPUTER VISION PROGRESS & DPR
   ========================================================================= */
function AIProgressView({
  proj,
  file,
  setFile,
  busy,
  setBusy,
  result,
  setResult,
  onDone,
}) {
  const [activityId, setActivityId] = useState(proj?.activities?.[0]?.id || "");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [weather, setWeather] = useState("Clear / Sunny");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (proj?.activities?.[0]?.id) {
      setActivityId(proj.activities[0].id);
    }
  }, [proj?.id]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const detectGPS = () => {
    if (!navigator.geolocation) {
      alert("GPS Geolocation is not supported by your browser environment.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        alert("GPS Hardware Error: " + err.message);
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleRunInference = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await analyze({
        projectId: proj.id,
        activityId,
        date: new Date().toISOString().slice(0, 10),
        notes,
        weather,
        latitude: coords.lat,
        longitude: coords.lon,
        file,
      });
      setResult(r);
      await onDone();
    } catch (e) {
      alert("AI Vision Analysis Error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const weatherOptions = [
    { id: "Clear / Sunny", label: "Clear / Sunny", icon: Sun },
    { id: "Overcast", label: "Overcast", icon: Cloud },
    { id: "Monsoon Rain", label: "Monsoon Rain", icon: CloudRain },
    { id: "High Wind / Dust", label: "Wind / Dust", icon: Wind },
  ];

  return (
    <div className="content">
      <section className="heroPanel">
        <span className="pill">YOLOV8 COMPUTER VISION INSPECTION</span>
        <h2>Site Evidence to Certified Daily Progress Report (DPR)</h2>
        <p>
          Capture geo-tagged high-resolution site photography with environmental
          context. YOLOv8 civil weights verify structural elements (concrete,
          rebar, scaffolding, formwork) and EHS PPE compliance, benchmarking
          against CPWD IS 1200 schedules.
        </p>
      </section>

      <div className="aiGrid">
        {/* Left Column: Input Form */}
        <div className="panel">
          <div className="panelTitle">
            <div>
              <h3>1. Workfront Context & Capture</h3>
              <span>Select activity milestone, weather, and evidence</span>
            </div>
          </div>

          <div className="fieldGroup">
            <span className="fieldLabel">Active BOQ Workfront</span>
            <select
              className="formSelect"
              value={activityId}
              onChange={(e) => setActivityId(Number(e.target.value))}
            >
              {proj?.activities?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.actual_progress}% actual / {a.planned_progress}%
                  plan)
                </option>
              ))}
            </select>
          </div>

          <div className="fieldGroup">
            <span className="fieldLabel">Site Weather Conditions</span>
            <div className="weatherRow">
              {weatherOptions.map((w) => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    type="button"
                    className={`weatherBtn ${weather === w.id ? "active" : ""}`}
                    onClick={() => setWeather(w.id)}
                  >
                    <Icon size={14} /> {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="fieldGroup">
            <span className="fieldLabel">Site Geotagging & Coordinates</span>
            <div className="geoRow">
              <button
                type="button"
                className={`secondary geoBtn ${coords.lat ? "geoActive" : ""}`}
                onClick={detectGPS}
                disabled={geoLoading}
              >
                <Navigation size={13} />{" "}
                {geoLoading
                  ? "Detecting Coordinates..."
                  : coords.lat
                    ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
                    : "Auto-Acquire Site Coordinates"}
              </button>
              {coords.lat && (
                <span className="geoBadge">
                  <CheckCircle2 size={12} /> Geotagged
                </span>
              )}
            </div>
          </div>

          <div className="fieldGroup">
            <span className="fieldLabel">Site Supervisor Diary Notes</span>
            <textarea
              className="notesInput"
              rows={2}
              placeholder="e.g. Grid C3-D5 column shuttering inspected; pour card approved by consultant..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="fieldGroup">
            <div className="captureHeader">
              <span className="fieldLabel">Structural Photographic Evidence</span>
              <input
                id="camInput"
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files?.[0] && setFile(e.target.files[0])
                }
              />
              <button
                type="button"
                className="secondary smBtn"
                onClick={() => document.getElementById("camInput")?.click()}
              >
                <Camera size={13} /> Open Camera
              </button>
            </div>

            {previewUrl ? (
              <div className="previewContainer">
                <img
                  src={previewUrl}
                  alt="Evidence Preview"
                  className="evidenceThumb"
                />
                <div className="previewOverlay">
                  <div className="fileDetails">
                    <b>{file.name}</b>
                    <small>{(file.size / 1024).toFixed(1)} KB</small>
                  </div>
                  <button
                    type="button"
                    className="iconBtn removeBtn"
                    onClick={() => setFile(null)}
                    title="Remove Image"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="drop">
                <Upload size={30} />
                <b>Drop site photo or select file</b>
                <span>JPEG, PNG, WEBP from camera or site log</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <button
            className="primary wide"
            disabled={!file || busy}
            onClick={handleRunInference}
          >
            {busy
              ? "Running YOLOv8 Structural Inference..."
              : "Verify Evidence & Generate DPR"}
          </button>
        </div>

        {/* Right Column: AI Results */}
        <div className="panel">
          <div className="panelTitle">
            <div>
              <h3>2. Computer Vision Audit & DPR</h3>
              <span>Detections, PPE Compliance, and Observations</span>
            </div>
          </div>

          {!result ? (
            <div className="empty">
              <Camera size={42} />
              <b>Awaiting Site Photographic Evidence</b>
              <span>
                Upload or capture high-resolution evidence on the left. The AI
                engine will identify work elements, detect PPE compliance, and
                compile an official CPWD-compliant DPR.
              </span>
            </div>
          ) : (
            <div>
              {result.image_url && (
                <div className="resultVisual">
                  <div className="resultImgWrap">
                    <img
                      src={assetUrl(result.image_url)}
                      alt="Analyzed Structural Elements"
                      className="resultImg"
                    />
                    <div className="resultOverlayTags">
                      {result.detections?.map((d, i) => (
                        <span key={i} className="detectionTag">
                          <span className="dot" />
                          {d.label} ({d.confidence}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="resultTop">
                <div>
                  <span>Visible Progress</span>
                  <strong>{result.progress}%</strong>
                </div>
                <div>
                  <span>Model Confidence</span>
                  <strong>{result.confidence}%</strong>
                </div>
                <div>
                  <span>Risk Category</span>
                  <strong
                    className={
                      result.risk === "HIGH" || result.risk === "CRITICAL"
                        ? "danger"
                        : ""
                    }
                  >
                    {result.risk}
                  </strong>
                </div>
              </div>

              <div className="mode">
                Inference Mode: <b>{result.mode}</b>
                {result.weather && (
                  <>
                    {" "}
                    • Weather: <b>{result.weather}</b>
                  </>
                )}
                {result.latitude && (
                  <>
                    {" "}
                    • Coordinates:{" "}
                    <b>
                      {Number(result.latitude).toFixed(4)},{" "}
                      {Number(result.longitude).toFixed(4)}
                    </b>
                  </>
                )}
              </div>

              <div className="compare">
                <div>
                  <span>Planned Baseline</span>
                  <b>{result.planned_progress}%</b>
                </div>
                <div>
                  <span>Schedule Variance</span>
                  <b className={result.variance < 0 ? "danger" : ""}>
                    {result.variance > 0 ? "+" : ""}
                    {result.variance}%
                  </b>
                </div>
                <div>
                  <span>Workfront Target</span>
                  <b>{result.activity_hint}</b>
                </div>
              </div>

              <h4 style={{ margin: "14px 0 8px", fontSize: 13 }}>
                Detected Civil Components
              </h4>
              <div className="detectionList">
                {result.detections?.map((d, i) => (
                  <div className="detection" key={i}>
                    <span>{d.label}</span>
                    <b>{d.confidence}% Confidence</b>
                  </div>
                ))}
              </div>

              <div className="observation">
                <b>Civil Engineering Diagnostic Observation</b>
                <p>{result.observation}</p>
              </div>

              <a
                className="primary wide"
                href={pdfUrl(result.report_id)}
                target="_blank"
                rel="noreferrer"
                style={{ textAlign: "center" }}
              >
                <FileText size={16} /> Download Certified DPR PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 3: DAILY REPORTS (DPR ARCHIVE)
   ========================================================================= */
function ReportsView({ reps }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Certified Daily Progress Reports (DPR) Archive</h3>
            <span>
              Official site progress certificates with AI evidence & PDF export
            </span>
          </div>
        </div>

        {!reps.length ? (
          <div className="empty">
            No Daily Progress Reports have been compiled for this project yet.
          </div>
        ) : (
          <div className="tableResponsive">
            <table>
              <thead>
                <tr>
                  <th>DPR Reference</th>
                  <th>Date</th>
                  <th>AI Progress</th>
                  <th>Schedule Variance</th>
                  <th>Weather</th>
                  <th>Risk Level</th>
                  <th>Certified PDF</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b>DPR-{String(r.id).padStart(4, "0")}</b>
                    </td>
                    <td>{new Date(r.report_date).toLocaleDateString()}</td>
                    <td>
                      <b>{r.ai_progress}%</b> (Conf: {r.confidence}%)
                    </td>
                    <td>
                      <span
                        className={
                          r.variance < 0 ? "status bad" : "status"
                        }
                      >
                        {r.variance > 0 ? "+" : ""}
                        {r.variance}%
                      </span>
                    </td>
                    <td>{r.weather || "Clear"}</td>
                    <td>
                      <span className={`severity ${r.risk.toLowerCase()}`}>
                        {r.risk}
                      </span>
                    </td>
                    <td>
                      <a
                        className="secondary smBtn"
                        href={pdfUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText size={12} /> View PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 4: BOQ & ACTIVITIES (FULL CRUD)
   ========================================================================= */
function ActivitiesView({
  proj,
  onOpenAddActivity,
  onOpenEditActivity,
  onDeleteActivity,
}) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Bill of Quantities (BOQ) Workfronts</h3>
            <span>
              CPWD Specifications & IS 1200 Quantities Measurement Book
            </span>
          </div>
          <button className="primary smBtn" onClick={onOpenAddActivity}>
            <Plus size={14} /> Add BOQ Item
          </button>
        </div>

        <div className="tableResponsive">
          <table>
            <thead>
              <tr>
                <th>BOQ Code</th>
                <th>Work Description</th>
                <th>Unit</th>
                <th>Planned Qty</th>
                <th>Actual Qty</th>
                <th>Progress %</th>
                <th>Schedule Status</th>
                <th>Critical Path</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proj?.activities?.map((a) => (
                <tr key={a.id}>
                  <td>
                    <code>{a.code || "CPWD-01"}</code>
                  </td>
                  <td>
                    <b>{a.name}</b>
                  </td>
                  <td>{a.unit || "Cum"}</td>
                  <td>{a.planned_quantity}</td>
                  <td>{a.completed_quantity}</td>
                  <td>
                    <b>{a.actual_progress}%</b> / {a.planned_progress}%
                  </td>
                  <td>
                    <span
                      className={`status ${a.status === "Delayed" ? "bad" : ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    {a.is_critical ? (
                      <span
                        className="severity high"
                        style={{ fontSize: 9 }}
                      >
                        CRITICAL
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        Non-Critical
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="tableActions">
                      <button
                        className="secondary smBtn"
                        onClick={() => onOpenEditActivity(a)}
                        title="Update Quantity / Progress"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="dangerBtn smBtn"
                        onClick={() => onDeleteActivity(a.id)}
                        title="Delete Activity"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 5: MATERIALS MANAGEMENT (IS 1200 / CPWD)
   ========================================================================= */
function MaterialsView({ mats, onOpenAddMaterial }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Material Inward & Delivery Challan Log</h3>
            <span>
              IS 1200 Material Testing, MTC Verification, and Inventory Receipt
            </span>
          </div>
          <button className="primary smBtn" onClick={onOpenAddMaterial}>
            <Plus size={14} /> Receive Material
          </button>
        </div>

        {!mats.length ? (
          <div className="empty">
            <Truck size={36} />
            <b>No Material Consignments Recorded</b>
            <span>
              Click "Receive Material" to record cement, TMT rebar, structural
              steel, or aggregate shipments with Delivery Challans and QC status.
            </span>
          </div>
        ) : (
          <div className="tableResponsive">
            <table>
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Material Item</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Vendor / Supplier</th>
                  <th>QC Status</th>
                  <th>Received Date</th>
                  <th>Notes / MTC</th>
                </tr>
              </thead>
              <tbody>
                {mats.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <b>{m.delivery_challan_no || "DC-PENDING"}</b>
                    </td>
                    <td>
                      <b>{m.item_name}</b>
                    </td>
                    <td>{m.category}</td>
                    <td>{m.quantity_received}</td>
                    <td>{m.unit}</td>
                    <td>{m.vendor}</td>
                    <td>
                      <span
                        className={`qcBadge ${
                          m.qc_status === "ACCEPTED"
                            ? "accepted"
                            : m.qc_status === "REJECTED"
                              ? "rejected"
                              : "quarantine"
                        }`}
                      >
                        {m.qc_status}
                      </span>
                    </td>
                    <td>{new Date(m.received_date).toLocaleDateString()}</td>
                    <td style={{ color: "#64748b", fontSize: 11 }}>
                      {m.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 6: LABOR FORCE & SHIFTS
   ========================================================================= */
function LaborView({ labors, onOpenAddLabor }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Labor Force Muster & Shift Deployment</h3>
            <span>Daily gang strength, trade categories, and shift workfronts</span>
          </div>
          <button className="primary smBtn" onClick={onOpenAddLabor}>
            <Plus size={14} /> Log Shift Attendance
          </button>
        </div>

        {!labors.length ? (
          <div className="empty">
            <HardHat size={36} />
            <b>No Labor Shift Logs Recorded</b>
            <span>
              Log skilled and unskilled gang counts for bar bending, carpentry,
              masonry, and concrete pouring workfronts.
            </span>
          </div>
        ) : (
          <div className="tableResponsive">
            <table>
              <thead>
                <tr>
                  <th>Trade Category</th>
                  <th>Skilled</th>
                  <th>Unskilled</th>
                  <th>Total Gang</th>
                  <th>Shift</th>
                  <th>Supervisor</th>
                  <th>Workfront Zone</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {labors.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <b>{l.trade_category}</b>
                    </td>
                    <td>{l.skilled_workers}</td>
                    <td>{l.unskilled_workers}</td>
                    <td>
                      <b>{l.skilled_workers + l.unskilled_workers}</b>
                    </td>
                    <td>
                      <span className="status">{l.shift}</span>
                    </td>
                    <td>{l.supervisor_name}</td>
                    <td>{l.work_performed}</td>
                    <td>{new Date(l.log_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 7: PROGRESS ANALYTICS & S-CURVE
   ========================================================================= */
function AnalyticsView({ proj, dash, fc }) {
  const chartData = useMemo(() => {
    return (
      proj?.activities?.map((a) => ({
        name: a.name,
        planned: a.planned_progress,
        actual: a.actual_progress,
      })) || []
    );
  }, [proj]);

  return (
    <div className="content">
      <div className="cards">
        <MetricCard
          icon={TrendingUp}
          title="Actual Progress"
          value={`${dash?.overall_actual ?? 0}%`}
          meta="Certified work completion"
        />
        <MetricCard
          icon={BarChart3}
          title="Baseline Schedule"
          value={`${dash?.overall_planned ?? 0}%`}
          meta="Contractual milestone target"
        />
        <MetricCard
          icon={Clock3}
          title="Daily Burn Rate"
          value={`${fc?.daily_trend ?? 0}%`}
          meta="Measured progress / shift"
        />
        <MetricCard
          icon={CalendarDays}
          title="Projected Handover"
          value={fc?.estimated_completion || "In Calculation"}
          meta={`Estimated variance: ${fc?.delay_days ?? 0} days`}
        />
      </div>

      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>S-Curve Workfront Performance Benchmark</h3>
            <span>Planned vs Actual Completion by CPWD Specification Item</span>
          </div>
        </div>

        <div>
          {chartData.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(180px, 260px) 1fr 60px",
                alignItems: "center",
                gap: 14,
                margin: "16px 0",
                fontSize: 12,
              }}
            >
              <b>{item.name}</b>
              <div className="bar" style={{ height: 16 }}>
                <i
                  style={{ width: `${item.planned}%` }}
                  title={`Planned: ${item.planned}%`}
                />
                <em
                  style={{ width: `${item.actual}%` }}
                  title={`Actual: ${item.actual}%`}
                />
              </div>
              <strong style={{ textAlign: "right" }}>{item.actual}%</strong>
            </div>
          ))}
        </div>

        <div className="observation" style={{ marginTop: 24 }}>
          <b>Earned Value Forecasting Model</b>
          <p>
            Projected completion milestone:{" "}
            <strong>{fc?.estimated_completion || "Calculating..."}</strong>.
            Forecast algorithm analyzes photographic DPR history, verified
            Measurement Book quantities, and material delivery logs to predict
            schedule risk.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 8: SCHEDULE
   ========================================================================= */
function ScheduleView({ proj }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Contractual Milestones & Critical Path Schedule</h3>
            <span>Baseline start dates, completion deadlines, and CPWD float</span>
          </div>
        </div>

        <div className="tableResponsive">
          <table>
            <thead>
              <tr>
                <th>Workfront</th>
                <th>Planned Start</th>
                <th>Target Completion</th>
                <th>Status</th>
                <th>Critical Path</th>
              </tr>
            </thead>
            <tbody>
              {proj?.activities?.map((a) => (
                <tr key={a.id}>
                  <td>
                    <b>{a.name}</b>
                  </td>
                  <td>{a.planned_start || "—"}</td>
                  <td>{a.planned_end || "—"}</td>
                  <td>
                    <span
                      className={`status ${a.status === "Delayed" ? "bad" : ""}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    {a.is_critical ? (
                      <span className="severity high">CRITICAL PATH</span>
                    ) : (
                      "Standard"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 9: ALERTS & SAFETY (EHS / NCR)
   ========================================================================= */
function AlertsView({ als, onOpenAddAlert, onAckAlert, onDeleteAlert }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Site Safety (EHS) & Non-Conformance Reports (NCR)</h3>
            <span>
              Real-time quality defect logs, PPE violations, and schedule delays
            </span>
          </div>
          <button className="primary smBtn" onClick={onOpenAddAlert}>
            <Plus size={14} /> Raise Site Alert / NCR
          </button>
        </div>

        {!als.length ? (
          <div className="empty">
            <CheckCircle2 size={36} color="#16a34a" />
            <b>Zero Active Non-Conformance Notices</b>
            <span>
              All workfronts are currently compliant with CPWD specifications
              and site safety standards.
            </span>
          </div>
        ) : (
          als.map((a) => (
            <div className="alertRow" key={a.id}>
              <span className={`severity ${a.severity.toLowerCase()}`}>
                {a.severity}
              </span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13 }}>{a.title}</b>
                <p style={{ margin: "4px 0 0", color: "#475569" }}>
                  {a.message}
                </p>
                <small style={{ color: "#94a3b8" }}>
                  Category: {a.category} • Status:{" "}
                  {a.acknowledged ? "Acknowledged" : "Pending Site Action"}
                </small>
              </div>
              <div className="tableActions">
                {!a.acknowledged && (
                  <button
                    className="secondary smBtn"
                    onClick={() => onAckAlert(a.id)}
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  className="dangerBtn smBtn"
                  onClick={() => onDeleteAlert(a.id)}
                  title="Delete Alert"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 10: SITE EVIDENCE GALLERY
   ========================================================================= */
function EvidenceView({ reps }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Geotagged Photographic Site Evidence</h3>
            <span>
              Auditable archive of DPR inspection captures with coordinate stamps
            </span>
          </div>
        </div>

        {!reps.length ? (
          <div className="empty">
            <ImageIcon size={36} />
            <b>No Photographic Evidence Found</b>
            <span>
              Run AI Progress verification to log verified field captures.
            </span>
          </div>
        ) : (
          <div className="evidenceGallery">
            {reps.map((r) => {
              const ev = r.evidence?.[0];
              return (
                <div className="evidenceCard" key={r.id}>
                  <div className="evidenceCardImg">
                    {ev?.image_url ? (
                      <img
                        src={assetUrl(ev.image_url)}
                        alt="Site Inspection"
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "#64748b",
                        }}
                      >
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <span className={`evidenceRisk ${r.risk.toLowerCase()}`}>
                      {r.risk}
                    </span>
                    <span className="evidenceDate">
                      {new Date(r.report_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="evidenceCardBody">
                    <div className="evidenceCardTitle">
                      <b>DPR-{String(r.id).padStart(4, "0")}</b>
                      <span className="weatherBadge">
                        {r.weather || "Clear"}
                      </span>
                    </div>
                    <div className="evidenceMetrics">
                      <span>
                        AI: <b>{r.ai_progress}%</b>
                      </span>
                      <span>
                        Variance:{" "}
                        <b
                          className={r.variance < 0 ? "danger" : ""}
                        >
                          {r.variance > 0 ? "+" : ""}
                          {r.variance}%
                        </b>
                      </span>
                    </div>
                    {ev?.latitude && (
                      <div className="evidenceGeo">
                        <MapPin size={12} /> {Number(ev.latitude).toFixed(4)},{" "}
                        {Number(ev.longitude).toFixed(4)}
                      </div>
                    )}
                    {r.notes && <p className="evidenceNotes">{r.notes}</p>}
                    <a
                      className="evidenceLink"
                      href={pdfUrl(r.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Certified DPR PDF <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   VIEW 11: PROJECT SETTINGS
   ========================================================================= */
function SettingsView({ proj, auth, onOpenNewProject }) {
  return (
    <div className="content">
      <div className="panel">
        <div className="panelTitle">
          <div>
            <h3>Civil Project Configuration & Standards</h3>
            <span>Specification references, security credentials, and AI engine</span>
          </div>
          <button className="primary smBtn" onClick={onOpenNewProject}>
            <Plus size={14} /> Create New Project
          </button>
        </div>

        <div className="tableResponsive">
          <table>
            <tbody>
              <tr>
                <td style={{ width: 220 }}>
                  <b>Active Project Name</b>
                </td>
                <td>
                  <b>{proj?.name}</b> ({proj?.code})
                </td>
              </tr>
              <tr>
                <td>
                  <b>Contract Client & Location</b>
                </td>
                <td>
                  {proj?.client} • {proj?.location}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Contractual Budget</b>
                </td>
                <td>
                  ₹
                  {proj?.budget
                    ? `${(proj.budget / 10000000).toFixed(2)} Crores INR`
                    : "Not specified"}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Authorized User</b>
                </td>
                <td>
                  {auth?.user?.name} ({auth?.user?.email}) — {auth?.user?.role}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Measurement & Billing Standard</b>
                </td>
                <td>
                  CPWD Specifications 2021 & IS 1200 Method of Measurement of
                  Building Works
                </td>
              </tr>
              <tr>
                <td>
                  <b>Computer Vision Weights</b>
                </td>
                <td>
                  YOLOv8 Civil Neural Network (Structural Elements + EHS PPE
                  Safety Index)
                </td>
              </tr>
              <tr>
                <td>
                  <b>Supabase Cloud Authentication</b>
                </td>
                <td>
                  {isSupabaseConfigured ? (
                    <span className="status">
                      ACTIVE (Supabase Cloud Connected)
                    </span>
                  ) : (
                    <span className="status">
                      LOCAL ENTERPRISE DATABASE (Active Fallback)
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 1: ADD PROJECT
   ========================================================================= */
function ModalAddProject({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("120000000");
  const [targetDate, setTargetDate] = useState("2026-12-31");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const p = await createProject({
        name,
        code,
        client,
        location,
        budget: Number(budget),
        start_date: new Date().toISOString().slice(0, 10),
        target_date: targetDate,
        status: "In Progress",
      });
      onSuccess(p.id);
    } catch (err) {
      alert("Error creating project: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Create New Civil Infrastructure Project</h3>
          <button className="iconBtn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            <div className="formGroup">
              <label>Project Title</label>
              <input
                required
                className="formInput"
                placeholder="e.g. Metro Line 4 Elevated Viaduct Package 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Project Code</label>
                <input
                  required
                  className="formInput"
                  placeholder="e.g. ML4-PKG2"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Target Completion Date</label>
                <input
                  type="date"
                  required
                  className="formInput"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Client Organization</label>
                <input
                  required
                  className="formInput"
                  placeholder="e.g. DMRC / NHAI / CPWD"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Contract Budget (INR)</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  placeholder="120000000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
            <div className="formGroup">
              <label>Location</label>
              <input
                required
                className="formInput"
                placeholder="e.g. Sector 62, Noida, Uttar Pradesh"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Registering Project..." : "Initialize Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 2: ADD BOQ ACTIVITY
   ========================================================================= */
function ModalAddActivity({ projectId, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("CPWD-04.01");
  const [boqItem, setBoqItem] = useState("Item 4.1");
  const [unit, setUnit] = useState("Cum");
  const [plannedQty, setPlannedQty] = useState("500");
  const [weightage, setWeightage] = useState("15");
  const [isCritical, setIsCritical] = useState(false);
  const [busy, setBusy] = useState(false);

  const presets = [
    {
      name: "RCC M25 Grade Columns - IS 456",
      code: "CPWD-04.02",
      unit: "Cum",
    },
    {
      name: "Earthwork Excavation in Ordinary Soil - IS 1200 Pt 1",
      code: "CPWD-02.01",
      unit: "Cum",
    },
    {
      name: "Fe500 TMT Rebar Cutting & Bending - IS 1786",
      code: "CPWD-05.01",
      unit: "MT",
    },
    {
      name: "Plywood Formwork & Shuttering - IS 14687",
      code: "CPWD-05.09",
      unit: "Sqm",
    },
    {
      name: "Brick Masonry in Cement Mortar 1:6 - IS 2212",
      code: "CPWD-06.01",
      unit: "Cum",
    },
  ];

  const applyPreset = (p) => {
    setName(p.name);
    setCode(p.code);
    setUnit(p.unit);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createActivity({
        project_id: projectId,
        name,
        code,
        boq_item: boqItem,
        unit,
        planned_qty: Number(plannedQty),
        actual_qty: 0,
        weightage: Number(weightage),
        is_critical: isCritical,
        start_date: new Date().toISOString().slice(0, 10),
      });
      onSuccess();
    } catch (err) {
      alert("Error adding BOQ activity: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Add BOQ Specification Workfront</h3>
          <button className="iconBtn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            <div className="fieldGroup">
              <span className="fieldLabel">CPWD Standard Templates</span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {presets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="secondary smBtn"
                    onClick={() => applyPreset(p)}
                  >
                    {p.name.split(" - ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="formGroup">
              <label>Activity Description</label>
              <input
                required
                className="formInput"
                placeholder="e.g. RCC M25 Grade Columns - IS 456"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="formGrid">
              <div className="formGroup">
                <label>CPWD Item Code</label>
                <input
                  required
                  className="formInput"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Unit of Measurement (IS 1200)</label>
                <select
                  className="formSelect"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="Cum">Cum (Cubic Metres)</option>
                  <option value="Sqm">Sqm (Square Metres)</option>
                  <option value="Rmt">Rmt (Running Metres)</option>
                  <option value="MT">MT (Metric Tonnes)</option>
                  <option value="Bags">Bags (50 kg)</option>
                  <option value="Nos">Nos (Number / Count)</option>
                </select>
              </div>
            </div>

            <div className="formGrid">
              <div className="formGroup">
                <label>Planned Contract Quantity</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  value={plannedQty}
                  onChange={(e) => setPlannedQty(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Weightage (% in S-Curve)</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  value={weightage}
                  onChange={(e) => setWeightage(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="critCheck"
                checked={isCritical}
                onChange={(e) => setIsCritical(e.target.checked)}
              />
              <label htmlFor="critCheck" style={{ fontSize: 12, cursor: "pointer" }}>
                Mark as Critical Path Activity (Impacts Target Handover)
              </label>
            </div>
          </div>
          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Saving BOQ Item..." : "Save to BOQ Baseline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 3: EDIT BOQ ACTIVITY
   ========================================================================= */
function ModalEditActivity({ activity, onClose, onSuccess }) {
  const [actualQty, setActualQty] = useState(
    activity.completed_quantity || activity.actual_quantity || 0,
  );
  const [actualProgress, setActualProgress] = useState(
    activity.actual_progress || 0,
  );
  const [status, setStatus] = useState(activity.status || "In Progress");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateActivity(activity.id, {
        actual_quantity: Number(actualQty),
        actual_progress: Number(actualProgress),
        status,
      });
      onSuccess();
    } catch (err) {
      alert("Error updating activity: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Update Measurement Book Quantity</h3>
          <button className="iconBtn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
              {activity.name} ({activity.code})
            </p>
            <div className="formGrid">
              <div className="formGroup">
                <label>Certified Actual Quantity ({activity.unit})</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  value={actualQty}
                  onChange={(e) => setActualQty(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Actual Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="formInput"
                  value={actualProgress}
                  onChange={(e) => setActualProgress(e.target.value)}
                />
              </div>
            </div>
            <div className="formGroup">
              <label>Workfront Status</label>
              <select
                className="formSelect"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed / Blocked</option>
              </select>
            </div>
          </div>
          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Updating..." : "Commit Measurement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 4: INWARD MATERIAL CHALLAN
   ========================================================================= */
function ModalAddMaterial({ projectId, onClose, onSuccess }) {
  const [itemName, setItemName] = useState("OPC 53 Grade Cement - IS 269");
  const [category, setCategory] = useState("Cement");
  const [unit, setUnit] = useState("Bags");
  const [quantity, setQuantity] = useState("600");
  const [vendor, setVendor] = useState("UltraTech Cement Ltd");
  const [challanNo, setChallanNo] = useState("DC-2026-0982");
  const [qcStatus, setQcStatus] = useState("ACCEPTED");
  const [notes, setNotes] = useState("MTC verified; initial setting time 45 min.");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createMaterial({
        project_id: projectId,
        item_name: itemName,
        category,
        unit,
        quantity_received: Number(quantity),
        vendor,
        delivery_challan_no: challanNo,
        qc_status: qcStatus,
        received_date: new Date().toISOString().slice(0, 10),
        notes,
      });
      onSuccess();
    } catch (err) {
      alert("Error recording material: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Record Inward Material Consignment</h3>
          <button className="iconBtn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            <div className="formGroup">
              <label>Material Name & Specification</label>
              <input
                required
                className="formInput"
                placeholder="e.g. Fe500D TMT Rebar 16mm - IS 1786"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Category</label>
                <select
                  className="formSelect"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Cement">Cement (IS 269 / 8112)</option>
                  <option value="Steel">Reinforcement Steel (IS 1786)</option>
                  <option value="Aggregates">Aggregates (IS 383)</option>
                  <option value="Masonry">Brick / Block (IS 1077)</option>
                  <option value="Finishing">Finishing & Waterproofing</option>
                  <option value="MEP">MEP & Electrical</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Delivery Challan No</label>
                <input
                  required
                  className="formInput"
                  placeholder="DC-2026-0891"
                  value={challanNo}
                  onChange={(e) => setChallanNo(e.target.value)}
                />
              </div>
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Quantity Received</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Unit</label>
                <select
                  className="formSelect"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="Bags">Bags (50 kg)</option>
                  <option value="MT">MT (Metric Tonnes)</option>
                  <option value="Cum">Cum</option>
                  <option value="Sqm">Sqm</option>
                  <option value="Nos">Nos</option>
                </select>
              </div>
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Supplier / Vendor</label>
                <input
                  required
                  className="formInput"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Quality Control (QC) Status</label>
                <select
                  className="formSelect"
                  value={qcStatus}
                  onChange={(e) => setQcStatus(e.target.value)}
                >
                  <option value="ACCEPTED">ACCEPTED (MTC Pass)</option>
                  <option value="QUARANTINE">QUARANTINE (Test Pending)</option>
                  <option value="REJECTED">REJECTED (Non-Compliant)</option>
                </select>
              </div>
            </div>
            <div className="formGroup">
              <label>Mill Test Certificate (MTC) / Notes</label>
              <textarea
                rows={2}
                className="formTextarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Registering Challan..." : "Save Material Challan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 5: LOG LABOR MUSTER
   ========================================================================= */
function ModalAddLabor({ projectId, onClose, onSuccess }) {
  const [trade, setTrade] = useState("Steel Fixers / Bar Benders");
  const [skilled, setSkilled] = useState("12");
  const [unskilled, setUnskilled] = useState("8");
  const [supervisor, setSupervisor] = useState("Er. Manoj Patil");
  const [shift, setShift] = useState("Day Shift (08:00 - 17:00)");
  const [work, setWork] = useState("Tower B - Column Rebar Caging & Tying");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createLabor({
        project_id: projectId,
        trade_category: trade,
        skilled_workers: Number(skilled),
        unskilled_workers: Number(unskilled),
        supervisor_name: supervisor,
        shift,
        work_performed: work,
        log_date: new Date().toISOString().slice(0, 10),
      });
      onSuccess();
    } catch (err) {
      alert("Error logging labor: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Log Daily Shift Labor Force Attendance</h3>
          <button className="iconBtn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            <div className="formGroup">
              <label>Trade Gang Category</label>
              <select
                className="formSelect"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
              >
                <option value="Steel Fixers / Bar Benders">
                  Steel Fixers / Bar Benders
                </option>
                <option value="Carpenters / Formwork Gang">
                  Carpenters / Formwork Gang
                </option>
                <option value="Masonry / Bricklayers">
                  Masonry / Bricklayers
                </option>
                <option value="Concrete Pouring Gang">
                  Concrete Pouring Gang
                </option>
                <option value="MEP & Conduiting Technicians">
                  MEP & Conduiting Technicians
                </option>
                <option value="General Earthwork Labor">
                  General Earthwork Labor
                </option>
              </select>
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Skilled Workers Count</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  value={skilled}
                  onChange={(e) => setSkilled(e.target.value)}
                />
              </div>
              <div className="formGroup">
                <label>Unskilled Workers Count</label>
                <input
                  type="number"
                  required
                  className="formInput"
                  value={unskilled}
                  onChange={(e) => setUnskilled(e.target.value)}
                />
              </div>
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Shift Timing</label>
                <select
                  className="formSelect"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                >
                  <option value="Day Shift (08:00 - 17:00)">
                    Day Shift (08:00 - 17:00)
                  </option>
                  <option value="Night Shift (19:00 - 04:00)">
                    Night Shift (19:00 - 04:00)
                  </option>
                  <option value="Overtime Gang (17:00 - 21:00)">
                    Overtime Gang (17:00 - 21:00)
                  </option>
                </select>
              </div>
              <div className="formGroup">
                <label>Supervisor / Mukadam Name</label>
                <input
                  required
                  className="formInput"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                />
              </div>
            </div>
            <div className="formGroup">
              <label>Workfront Zone & Specific Task</label>
              <input
                required
                className="formInput"
                placeholder="e.g. Tower B - 4th Floor Slab Rebar Tying"
                value={work}
                onChange={(e) => setWork(e.target.value)}
              />
            </div>
          </div>
          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Submitting Log..." : "Log Shift Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 6: RAISE SITE ALERT / NCR
   ========================================================================= */
function ModalAddAlert({ projectId, onClose, onSuccess }) {
  const [title, setTitle] = useState("PPE Violation: Missing Hardhats at Grid E");
  const [category, setCategory] = useState("Safety");
  const [severity, setSeverity] = useState("HIGH");
  const [description, setDescription] = useState(
    "3 rebar workers observed without helmets and high-vis vests near tower crane lifting radius.",
  );
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createAlert({
        project_id: projectId,
        title,
        category,
        severity,
        description,
      });
      onSuccess();
    } catch (err) {
      alert("Error raising alert: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3>Raise Site Non-Conformance (NCR) / Alert</h3>
          <button className="iconBtn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modalBody">
            <div className="formGroup">
              <label>Alert Title</label>
              <input
                required
                className="formInput"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="formGrid">
              <div className="formGroup">
                <label>Category</label>
                <select
                  className="formSelect"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Safety">Safety & EHS Violation</option>
                  <option value="Quality">Structural Quality Defect (NCR)</option>
                  <option value="Schedule">Schedule Variance & Delay</option>
                  <option value="Material">Material Shortage / Rejection</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Severity Level</label>
                <select
                  className="formSelect"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="CRITICAL">CRITICAL (Stop-Work Order)</option>
                  <option value="HIGH">HIGH (Immediate Rectification)</option>
                  <option value="MEDIUM">MEDIUM (Standard Notice)</option>
                  <option value="LOW">LOW (Informational Observation)</option>
                </select>
              </div>
            </div>
            <div className="formGroup">
              <label>Detailed Findings & Rectification Instructions</label>
              <textarea
                rows={3}
                required
                className="formTextarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="modalFooter">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Broadcasting Alert..." : "Issue Site Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
