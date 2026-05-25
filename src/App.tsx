import { useState, useEffect, useRef } from "react";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const INTERVIEW_TYPES = [
  { id: "dsa", label: "Data Structures & Algorithms", icon: "⬡", desc: "Arrays, Trees, Graphs, Dynamic Programming", difficulty: ["Easy", "Medium", "Hard"], duration: "45 min", color: "#00d4ff" },
  { id: "system", label: "System Design", icon: "◈", desc: "Scalability, Architecture, Distributed Systems", difficulty: ["Mid", "Senior", "Staff"], duration: "60 min", color: "#ff6b35" },
  { id: "backend", label: "Backend Engineering", icon: "◎", desc: "APIs, Databases, Caching, Performance", difficulty: ["Junior", "Mid", "Senior"], duration: "45 min", color: "#a78bfa" },
  { id: "behavioral", label: "Behavioral", icon: "◇", desc: "Leadership, Conflict, Impact, Growth", difficulty: ["All levels"], duration: "30 min", color: "#34d399" },
];

const STATS = [
  { value: "12K+", label: "Interviews Completed" },
  { value: "94%", label: "Offer Rate" },
  { value: "8ms", label: "Avg Feedback Latency" },
  { value: "40+", label: "Companies Targeted" },
];

const COMPANIES = ["Google", "Meta", "Amazon", "Microsoft", "Stripe", "Airbnb", "Netflix", "Uber"];
const VIEWS = { LANDING: "landing", LOGIN: "login", SIGNUP: "signup", DASHBOARD: "dashboard", SELECT: "select", ROOM: "room" };

// ── LOCAL STORAGE AUTH HELPERS ────────────────────────────────────────────────
// NOTE: This uses localStorage for demo purposes only.
// In Phase 2 this will be replaced with real JWT auth + PostgreSQL backend.
// Passwords are stored in plain text here — NOT suitable for production.

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem("intrvwai_users") || "{}"); }
  catch { return {}; }
};

const saveUsers = (users) => {
  localStorage.setItem("intrvwai_users", JSON.stringify(users));
};

const getUserData = (email) => {
  try { return JSON.parse(localStorage.getItem(`intrvwai_data_${email}`) || "null"); }
  catch { return null; }
};

const saveUserData = (email, data) => {
  localStorage.setItem(`intrvwai_data_${email}`, JSON.stringify(data));
};

const getSession = () => {
  try { return JSON.parse(localStorage.getItem("intrvwai_session") || "null"); }
  catch { return null; }
};

const saveSession = (user) => {
  localStorage.setItem("intrvwai_session", JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem("intrvwai_session");
};

const freshUserData = () => ({
  score: 0,
  interviewsDone: 0,
  streak: 0,
  lastInterviewDate: null,
  bestCategory: null,
  skills: { "Data Structures": 0, "System Design": 0, "Backend APIs": 0, "Behavioral": 0 },
  history: [],
});

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  // Restore session on load
  useEffect(() => {
    const session = getSession();
    if (session) {
      const data = getUserData(session.email);
      setUser(session);
      setUserData(data || freshUserData());
      setView(VIEWS.DASHBOARD);
    }
  }, []);

  const handleSignup = (name, email, password, role) => {
    const users = getUsers();
    if (users[email]) return "An account with this email already exists.";
    const newUser = { name, email, role };
    users[email] = { password, name, role };
    saveUsers(users);
    const data = freshUserData();
    saveUserData(email, data);
    saveSession(newUser);
    setUser(newUser);
    setUserData(data);
    setView(VIEWS.DASHBOARD);
    return null;
  };

  const handleLogin = (email, password) => {
    const users = getUsers();
    if (!users[email]) return "No account found with this email.";
    if (users[email].password !== password) return "Incorrect password.";
    const existingData = getUserData(email);
    const restoredUser = { name: users[email].name || email.split("@")[0], email, role: users[email].role || "Software Engineer" };
    saveSession(restoredUser);
    setUser(restoredUser);
    setUserData(existingData || freshUserData());
    setView(VIEWS.DASHBOARD);
    return null;
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setUserData(null);
    setSelectedInterview(null);
    setSelectedDifficulty(null);
    setView(VIEWS.LANDING);
  };

  const handleInterviewComplete = (result) => {
    if (!user || !userData) return;
    const now = new Date().toISOString().split("T")[0];
    const last = userData.lastInterviewDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = last === yesterday ? userData.streak + 1 : last === now ? userData.streak : 1;

    const history = [
      { type: selectedInterview?.label, topic: result.topic, score: result.score, date: "Just now", status: "Completed" },
      ...userData.history,
    ].slice(0, 10);

    const totalInterviews = userData.interviewsDone + 1;
    const newAvgScore = Math.round((userData.score * userData.interviewsDone + result.score) / totalInterviews);

    const skills = { ...userData.skills };
    if (selectedInterview?.id === "dsa") skills["Data Structures"] = Math.min(100, Math.round((skills["Data Structures"] + result.score) / 2));
    if (selectedInterview?.id === "system") skills["System Design"] = Math.min(100, Math.round((skills["System Design"] + result.score) / 2));
    if (selectedInterview?.id === "backend") skills["Backend APIs"] = Math.min(100, Math.round((skills["Backend APIs"] + result.score) / 2));
    if (selectedInterview?.id === "behavioral") skills["Behavioral"] = Math.min(100, Math.round((skills["Behavioral"] + result.score) / 2));

    const bestCat = Object.entries(skills).sort((a, b) => b[1] - a[1])[0];

    const updated = {
      ...userData,
      score: newAvgScore,
      interviewsDone: totalInterviews,
      streak: newStreak,
      lastInterviewDate: now,
      bestCategory: bestCat[1] > 0 ? bestCat[0] : null,
      skills,
      history,
    };

    saveUserData(user.email, updated);
    setUserData(updated);
    setView(VIEWS.DASHBOARD);
  };

  return (
    <div style={s.root}>
      <Noise />
      {view === VIEWS.LANDING && <Landing go={setView} />}
      {view === VIEWS.LOGIN && <Auth mode="login" go={setView} onLogin={handleLogin} />}
      {view === VIEWS.SIGNUP && <Auth mode="signup" go={setView} onSignup={handleSignup} />}
      {view === VIEWS.DASHBOARD && <Dashboard user={user} userData={userData} go={setView} onLogout={handleLogout} />}
      {view === VIEWS.SELECT && (
        <SelectInterview
          go={setView}
          selected={selectedInterview}
          setSelected={setSelectedInterview}
          difficulty={selectedDifficulty}
          setDifficulty={setSelectedDifficulty}
        />
      )}
      {view === VIEWS.ROOM && (
        <InterviewRoom
          go={setView}
          interview={selectedInterview}
          difficulty={selectedDifficulty}
          user={user}
          onComplete={handleInterviewComplete}
        />
      )}
      <style>{globalStyles}</style>
    </div>
  );
}

// ── NOISE ─────────────────────────────────────────────────────────────────────
function Noise() {
  return (
    <svg style={s.noise} width="100%" height="100%">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" opacity="0.03" />
    </svg>
  );
}

// ── LANDING ───────────────────────────────────────────────────────────────────
function Landing({ go }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((p) => p + 1), 80); return () => clearInterval(t); }, []);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]".split("");
  const title = "INTERVIEW.AI";
  const progress = Math.min(tick * 0.8, title.length);
  const scramble = (word, prog) => word.split("").map((c, i) => i < prog ? c : chars[Math.floor(Math.random() * chars.length)]).join("");

  return (
    <div style={s.landing}>
      <div style={s.grid} />
      <nav style={s.nav}>
        <span style={s.navLogo}>◈ IntrvwAI</span>
        <div style={s.navLinks}>
          <button style={s.navLink} onClick={() => go(VIEWS.LOGIN)}>Sign In</button>
          <button style={s.ctaSmall} onClick={() => go(VIEWS.SIGNUP)}>Get Started</button>
        </div>
      </nav>
      <div style={s.hero}>
        <div style={s.heroTag}>PRODUCTION-GRADE AI INTERVIEW PLATFORM</div>
        <h1 style={s.heroTitle}>{scramble(title, progress)}</h1>
        <p style={s.heroSub}>Real-time collaborative coding. Sandboxed execution. AI feedback that thinks like a senior engineer. Built for engineers who want to get hired at the best companies.</p>
        <div style={s.heroBtns}>
          <button style={s.ctaPrimary} onClick={() => go(VIEWS.SIGNUP)}>Start Practicing Free</button>
          <button style={s.ctaGhost} onClick={() => go(VIEWS.LOGIN)}>Sign In →</button>
        </div>

      </div>

      <div style={s.previewSection}>
        <p style={s.sectionLabel}>INTERVIEW TRACKS</p>
        <div style={s.previewGrid}>
          {INTERVIEW_TYPES.map((t) => (
            <div key={t.id} style={{ ...s.previewCard, borderColor: t.color + "33" }}>
              <span style={{ ...s.previewIcon, color: t.color }}>{t.icon}</span>
              <p style={s.previewTitle}>{t.label}</p>
              <p style={s.previewDesc}>{t.desc}</p>
              <span style={{ ...s.previewDur, color: t.color }}>{t.duration}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={s.archSection}>
        <p style={s.sectionLabel}>SYSTEM ARCHITECTURE</p>
        <div style={s.archGrid}>
          {["API Gateway", "Auth Service", "Interview Service", "Code Execution", "AI Feedback", "Analytics"].map((svc) => (
            <div key={svc} style={s.archBox}><span style={s.archDot} /><span style={s.archSvc}>{svc}</span></div>
          ))}
        </div>
        <p style={s.archNote}>Microservices · Docker · Kubernetes · Redis · PostgreSQL · WebSocket · Kafka</p>
      </div>
      <footer style={s.footer}>Built by Asritha Penumalli · Full Stack Engineer · UCF MS CS 2026</footer>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function Auth({ mode, go, onLogin, onSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isLogin = mode === "login";

  const handle = () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!isLogin && !name.trim()) { setError("Please enter your name."); return; }
    if (!isLogin && password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const err = isLogin ? onLogin(email.trim(), password) : onSignup(name.trim(), email.trim(), password, role);
      if (err) setError(err);
    }, 800);
  };

  const handleKey = (e) => { if (e.key === "Enter") handle(); };

  return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <button style={s.backBtn} onClick={() => go(VIEWS.LANDING)}>← Back</button>
        <div style={s.authLogo}>◈</div>
        <h2 style={s.authTitle}>{isLogin ? "Welcome back" : "Create account"}</h2>
        <p style={s.authSub}>{isLogin ? "Sign in to continue practicing" : "Start your interview prep today"}</p>

        {error && <div style={s.authError}>{error}</div>}

        <div style={s.authForm}>
          {!isLogin && (
            <div style={s.fieldWrap}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} placeholder="Asritha Penumalli" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKey} />
            </div>
          )}
          {!isLogin && (
            <div style={s.fieldWrap}>
              <label style={s.label}>Your Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...s.input, cursor: "pointer" }}>
                {["Software Engineer", "Full Stack Developer", "Backend Engineer", "Frontend Developer", "Data Engineer", "ML Engineer", "DevOps Engineer", "Student", "Other"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}
          <div style={s.fieldWrap}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKey} />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKey} />
          </div>
          {!isLogin && (
            <div style={s.fieldWrap}>
              <label style={s.label}>Confirm Password</label>
              <input style={s.input} type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKey} />
            </div>
          )}
          <button style={{ ...s.authBtn, opacity: loading ? 0.7 : 1 }} onClick={handle} disabled={loading}>
            {loading ? <span style={s.spinner} /> : isLogin ? "Sign In" : "Create Account"}
          </button>
        </div>

        {isLogin && (
          <p style={s.authNote}>Demo: create an account first, then sign in with the same credentials.</p>
        )}

        <p style={s.authSwitch}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={s.authSwitchLink} onClick={() => { setError(""); go(isLogin ? VIEWS.SIGNUP : VIEWS.LOGIN); }}>
            {isLogin ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ user, userData, go, onLogout }) {
  const name = user?.name || "Engineer";
  const d = userData || freshUserData();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const skillColors = { "Data Structures": "#00d4ff", "System Design": "#ff6b35", "Backend APIs": "#a78bfa", "Behavioral": "#34d399" };

  return (
    <div style={s.dash}>
      <aside style={s.sidebar}>
        <div style={s.sidebarLogo}>◈ IntrvwAI</div>
        <nav style={s.sideNav}>
          {[["Dashboard", null], ["Interviews", VIEWS.SELECT], ["Analytics", null], ["History", null], ["Settings", null]].map(([item, target], i) => (
            <div key={item} style={{ ...s.sideNavItem, ...(i === 0 ? s.sideNavActive : {}) }} onClick={target ? () => go(target) : undefined}>
              <span style={s.sideNavDot} />{item}
            </div>
          ))}
        </nav>
        <div style={s.sidebarBottom}>
          <div style={s.sidebarUser}>
            <div style={s.avatar}>{name[0].toUpperCase()}</div>
            <div>
              <p style={s.avatarName}>{name}</p>
              <p style={s.avatarRole}>{user?.role || "Software Engineer"}</p>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>
      </aside>

      <main style={s.dashMain}>
        <div style={s.dashHeader}>
          <div>
            <h1 style={s.dashTitle}>{greeting}, {name.split(" ")[0]}.</h1>
            <p style={s.dashSub}>{d.interviewsDone === 0 ? "Complete your first interview to get started." : "Ready for your next interview?"}</p>
          </div>
          <button style={s.ctaPrimary} onClick={() => go(VIEWS.SELECT)}>Start Interview →</button>
        </div>

        <div style={s.scoreGrid}>
          {[
            { label: "Overall Score", value: d.score > 0 ? d.score : "—", unit: d.score > 0 ? "/100" : "", color: "#00d4ff" },
            { label: "Interviews Done", value: d.interviewsDone, unit: "total", color: "#34d399" },
            { label: "Streak", value: d.streak, unit: d.streak === 1 ? "day" : "days", color: "#ff6b35" },
            { label: "Best Category", value: d.bestCategory ? d.bestCategory.split(" ")[0] : "—", unit: "", color: "#a78bfa" },
          ].map((card) => (
            <div key={card.label} style={s.scoreCard}>
              <p style={s.scoreCardLabel}>{card.label}</p>
              <p style={{ ...s.scoreCardValue, color: card.color }}>{card.value}<span style={s.scoreCardUnit}> {card.unit}</span></p>
            </div>
          ))}
        </div>

        <div style={s.skillSection}>
          <p style={s.sectionLabel}>SKILL BREAKDOWN</p>
          {d.interviewsDone === 0 ? (
            <p style={s.emptyState}>Complete interviews to see your skill breakdown.</p>
          ) : (
            <div style={s.skillBars}>
              {Object.entries(d.skills).map(([skill, pct]) => (
                <div key={skill} style={s.skillRow}>
                  <span style={s.skillName}>{skill}</span>
                  <div style={s.skillTrack}>
                    <div style={{ ...s.skillFill, width: `${pct}%`, background: skillColors[skill] }} />
                  </div>
                  <span style={{ ...s.skillPct, color: skillColors[skill] }}>{pct}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.historySection}>
          <p style={s.sectionLabel}>RECENT INTERVIEWS</p>
          {d.history.length === 0 ? (
            <div style={s.emptyHistory}>
              <p style={s.emptyState}>No interviews yet.</p>
              <button style={s.ctaSmall} onClick={() => go(VIEWS.SELECT)}>Start your first interview →</button>
            </div>
          ) : (
            <div style={s.historyList}>
              {d.history.slice(0, 5).map((item, i) => (
                <div key={i} style={s.historyCard}>
                  <div style={s.historyLeft}>
                    <span style={s.historyType}>{item.type?.split(" ")[0] || "Interview"}</span>
                    <span style={s.historyTopic}>{item.topic || item.type}</span>
                  </div>
                  <div style={s.historyRight}>
                    <span style={{ ...s.historyScore, color: item.score >= 80 ? "#34d399" : item.score >= 60 ? "#ff9a3c" : "#ff4d4d" }}>{item.score}/100</span>
                    <span style={s.historyDate}>{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── SELECT INTERVIEW ──────────────────────────────────────────────────────────
function SelectInterview({ go, selected, setSelected, difficulty, setDifficulty }) {
  const canStart = selected && difficulty;

  return (
    <div style={s.selectWrap}>
      <div style={s.selectInner}>
        <button style={s.backBtn} onClick={() => go(VIEWS.DASHBOARD)}>← Dashboard</button>
        <h2 style={s.selectTitle}>Choose your interview</h2>
        <p style={s.selectSub}>Select a track and difficulty to begin</p>
        <div style={s.selectGrid}>
          {INTERVIEW_TYPES.map((t) => (
            <div key={t.id} onClick={() => { setSelected(t); setDifficulty(null); }}
              style={{ ...s.selectCard, borderColor: selected?.id === t.id ? t.color : "#1e293b", background: selected?.id === t.id ? t.color + "11" : "#0a0f1e" }}>
              <span style={{ ...s.selectIcon, color: t.color }}>{t.icon}</span>
              <p style={s.selectCardTitle}>{t.label}</p>
              <p style={s.selectCardDesc}>{t.desc}</p>
              <span style={{ ...s.selectDur, color: t.color }}>{t.duration}</span>
            </div>
          ))}
        </div>
        {selected && (
          <div style={s.diffWrap}>
            <p style={s.sectionLabel}>SELECT DIFFICULTY</p>
            <div style={s.diffRow}>
              {selected.difficulty.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  style={{ ...s.diffBtn, borderColor: difficulty === d ? selected.color : "#334155", color: difficulty === d ? selected.color : "#64748b", background: difficulty === d ? selected.color + "11" : "transparent" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
        {canStart && (
          <button style={s.ctaPrimary} onClick={() => go(VIEWS.ROOM)}>
            Begin {selected.label} · {difficulty} →
          </button>
        )}
      </div>
    </div>
  );
}

// ── INTERVIEW ROOM ────────────────────────────────────────────────────────────
function InterviewRoom({ go, interview, difficulty, user, onComplete }) {
  const duration = interview?.id === "system" ? 3600 : 2700;
  const [timer, setTimer] = useState(duration);
  const [started, setStarted] = useState(false);
  const [code, setCode] = useState("// Write your solution here\n\n");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "ai", text: `Hi ${user?.name?.split(" ")[0] || "there"}! I'm your AI interviewer. We'll be doing a ${difficulty} level ${interview?.label} interview today. Each round I'll ask you a different question — no repeats. When you're ready, start the timer and I'll give you your first question.` }
  ]);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("javascript");
  const [finalScore, setFinalScore] = useState(null);
  const [topic, setTopic] = useState(interview?.label || "Technical Interview");
  const [askedQuestions, setAskedQuestions] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const chatRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!started) return;
    timerRef.current = setInterval(() => setTimer((p) => {
      if (p <= 1) { clearInterval(timerRef.current); handleTimeUp(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const timerColor = timer < 300 ? "#ff4d4d" : timer < 600 ? "#ff9a3c" : "#00d4ff";
  const pct = (timer / duration) * 100;

  const handleTimeUp = () => {
    setMessages((p) => [...p, { role: "ai", text: "Time's up! Great effort. Let me score your overall performance." }]);
    completeInterview(70);
  };

  const completeInterview = (score) => {
    clearInterval(timerRef.current);
    setFinalScore(score);
  };

  const callAI = async (userMsg, systemPrompt) => {
    const res = await fetch("https://intrvwai-production.up.railway.app/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          ...messages.slice(-6).filter(m => m.text && m.text.length > 0).map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
          { role: "user", content: userMsg },
        ],
      }),
    });
    const data = await res.json();
    return data.content?.map((b) => b.text || "").join("") || "Let me think about that...";
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    setLoading(true);

    // Check if user wants a new question / next round
    const wantsNext = /next|another|new question|second round|ready|continue|move on/i.test(userMsg);
    if (wantsNext) setRoundNumber((r) => r + 1);

    const avoidList = askedQuestions.length > 0
      ? `You have already asked these questions in this session — do NOT repeat them or anything similar: ${askedQuestions.join(", ")}.`
      : "";

    const systemPrompt = `You are a senior software engineer at a top tech company conducting a ${difficulty} level ${interview?.label} mock interview. This is round ${roundNumber} of the session.
Ask one focused, unique question at a time. Be concise, direct, and professional. Simulate a real interview experience.
${avoidList}
Each new question must be completely different in topic and concept from all previous questions.
If the candidate asks for a hint, give a small nudge only. Do not give away answers.
When you ask a new coding question, start your message with "QUESTION:" so it can be tracked.`;

    try {
      const reply = await callAI(userMsg, systemPrompt);
      setMessages((p) => [...p, { role: "ai", text: reply }]);

      // Extract and track the question if AI asked one
      if (reply.startsWith("QUESTION:") || reply.includes("QUESTION:")) {
        const qMatch = reply.match(/QUESTION:\s*(.+?)(\n|$)/);
        if (qMatch) {
          setAskedQuestions((prev) => [...prev, qMatch[1].trim()]);
          setTopic(qMatch[1].trim());
        }
      }
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "Connection issue. Please try again." }]);
    }
    setLoading(false);
  };

  const submitCode = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    const userMsg = `Here is my ${lang} solution:\n\`\`\`${lang}\n${code}\n\`\`\``;
    setMessages((p) => [...p, { role: "user", text: userMsg }]);
    try {
      const reply = await callAI(userMsg, `You are a senior engineer reviewing a ${difficulty} ${interview?.label} interview code submission. Analyze for: correctness, time/space complexity, edge cases, readability, best practices. End your review with exactly this format on the last line: SCORE:[number] where number is 0-100. Be critical but fair.`);
      setMessages((p) => [...p, { role: "ai", text: reply }]);
      const match = reply.match(/SCORE:(\d+)/);
      if (match) {
        const score = Math.min(100, Math.max(0, parseInt(match[1])));
        setFinalScore(score);
        clearInterval(timerRef.current);
      }
    } catch {
      setMessages((p) => [...p, { role: "ai", text: "Error analyzing your code. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  if (finalScore !== null) {
    return (
      <div style={s.resultWrap}>
        <div style={s.resultCard}>
          <div style={s.resultIcon}>
            {finalScore >= 80 ? "🏆" : finalScore >= 60 ? "✅" : "📈"}
          </div>
          <h2 style={s.resultTitle}>Interview Complete</h2>
          <p style={s.resultSub}>{interview?.label} · {difficulty}</p>
          <div style={{ ...s.resultScore, color: finalScore >= 80 ? "#34d399" : finalScore >= 60 ? "#ff9a3c" : "#ff4d4d" }}>
            {finalScore}<span style={s.resultOut}>/100</span>
          </div>
          <p style={s.resultMsg}>
            {finalScore >= 80 ? "Excellent performance. You're interview-ready." : finalScore >= 60 ? "Solid effort. Keep practicing to improve." : "Keep going. Every attempt makes you better."}
          </p>
          <div style={s.resultBtns}>
            <button style={s.ctaPrimary} onClick={() => onComplete({ score: finalScore, topic })}>
              Save & Return to Dashboard
            </button>
            <button style={s.ctaGhost} onClick={() => { setFinalScore(null); setTimer(duration); setStarted(false); setCode("// Write your solution here\n\n"); setMessages([{ role: "ai", text: `Ready for another round? Start the timer whenever you are.` }]); }}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.room}>
      <div style={s.roomHeader}>
        <div style={s.roomInfo}>
          <span style={s.roomBack} onClick={() => setShowExitDialog(true)}>← Exit</span>
          <span style={s.roomTitle}>{interview?.label} · {difficulty}</span>
        </div>
        <div style={s.timerWrap}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke={timerColor} strokeWidth="4"
              strokeDasharray={`${(pct / 100) * 125.6} 125.6`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }} />
          </svg>
          <span style={{ ...s.roomTimer, color: timerColor }}>{fmt(timer)}</span>
        </div>
        <div style={s.roomControls}>
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={s.langSelect}>
            {["javascript", "python", "java", "c++", "typescript", "go"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {!started
            ? <button style={s.startBtn} onClick={() => {
                setStarted(true);
                setTimeout(async () => {
                  setLoading(true);
                  const systemPrompt = `You are a senior software engineer at a top tech company conducting a ${difficulty} level ${interview?.label} mock interview. Ask one focused, unique question to start the interview. Be concise and direct. When you ask a coding question, start your message with "QUESTION:".`;
                  try {
                    const res = await fetch("https://intrvwai-production.up.railway.app/api/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        model: "claude-haiku-4-5-20251001",
                        max_tokens: 1000,
                        system: systemPrompt,
                        messages: [{ role: "user", content: "Start the interview with your first question." }],
                      }),
                    });
                    const data = await res.json();
                    const reply = data.content?.map((b) => b.text || "").join("") || "Let me think of a question...";
                    setMessages((p) => [...p, { role: "ai", text: reply }]);
                    if (reply.includes("QUESTION:")) {
                      const qMatch = reply.match(/QUESTION:\s*(.+?)(\n|$)/);
                      if (qMatch) { setAskedQuestions([qMatch[1].trim()]); setTopic(qMatch[1].trim()); }
                    }
                  } catch {
                    setMessages((p) => [...p, { role: "ai", text: "Connection issue. Please try again." }]);
                  }
                  setLoading(false);
                }, 500);
              }}>▶ Start Timer</button>
            : <button style={s.submitBtn} onClick={submitCode} disabled={loading}>Submit Code</button>
          }
        </div>
      </div>

      <div style={s.roomBody}>
        <div style={s.editorPanel}>
          <div style={s.editorHeader}>
            <span style={s.editorTitle}>CODE EDITOR · {lang.toUpperCase()}</span>
            <div style={s.editorDots}>
              <span style={{ ...s.dot, background: "#ff5f57" }} />
              <span style={{ ...s.dot, background: "#ffbd2e" }} />
              <span style={{ ...s.dot, background: "#28c840" }} />
            </div>
          </div>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} style={s.editor} spellCheck={false} placeholder="// Write your solution here..." />
        </div>

        <div style={s.chatPanel}>
          <div style={s.chatHeader}>
            <span style={s.chatTitle}>AI INTERVIEWER</span>
            <span style={s.aiStatus}>● Live</span>
          </div>
          <div style={s.chatMessages} ref={chatRef}>
            {messages.map((msg, i) => (
              <div key={i} style={{ ...s.msgBubble, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "#6366f133" : "#1e293b", borderColor: msg.role === "user" ? "#6366f155" : "#334155" }}>
                <span style={s.msgRole}>{msg.role === "ai" ? "Interviewer" : "You"}</span>
                <p style={s.msgText}>{msg.text}</p>
              </div>
            ))}
            {loading && (
              <div style={{ ...s.msgBubble, alignSelf: "flex-start", background: "#1e293b", borderColor: "#334155" }}>
                <span style={s.msgRole}>Interviewer</span>
                <div style={s.typingDots}>
                  <span style={s.dot2} /><span style={{ ...s.dot2, animationDelay: "0.2s" }} /><span style={{ ...s.dot2, animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>
          <div style={s.chatInputRow}>
            <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Type your response... (Enter to send)" style={s.chatInput} rows={2} />
            <button style={{ ...s.sendBtn, opacity: loading ? 0.5 : 1 }} onClick={sendMessage} disabled={loading}>→</button>
          </div>
        </div>
      </div>
      {showExitDialog && (
        <div style={s.dialogOverlay}>
          <div style={s.dialogBox}>
            <h3 style={s.dialogTitle}>Exit Interview?</h3>
            <p style={s.dialogMsg}>Do you want to save your progress before leaving?</p>
            <div style={s.dialogBtns}>
              <button style={s.dialogSave} onClick={() => {
                setShowExitDialog(false);
                const currentScore = finalScore || Math.max(30, Math.round((roundNumber - 1) * 20 + 40));
                onComplete({ score: Math.min(100, currentScore), topic });
              }}>Save & Exit</button>
              <button style={s.dialogDiscard} onClick={() => {
                setShowExitDialog(false);
                clearInterval(timerRef.current);
                go(VIEWS.DASHBOARD);
              }}>Exit Without Saving</button>
              <button style={s.dialogCancel} onClick={() => setShowExitDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = {
  root: { minHeight: "100vh", background: "#030712", color: "#e2e8f0", fontFamily: "'DM Mono', monospace", position: "relative", overflowX: "hidden" },
  noise: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 },
  landing: { position: "relative", zIndex: 1, minHeight: "100vh" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #0f172a", position: "relative", zIndex: 2 },
  navLogo: { fontSize: 18, fontWeight: 700, color: "#00d4ff", letterSpacing: "0.1em" },
  navLinks: { display: "flex", alignItems: "center", gap: 16 },
  navLink: { background: "none", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  ctaSmall: { background: "#00d4ff", color: "#030712", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  hero: { maxWidth: 800, margin: "0 auto", padding: "120px 40px 80px", textAlign: "center", position: "relative", zIndex: 1 },
  heroTag: { fontSize: 11, letterSpacing: "0.2em", color: "#00d4ff", marginBottom: 24, fontWeight: 600 },
  heroTitle: { fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 24 },
  heroSub: { fontSize: 18, color: "#64748b", lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" },
  heroBtns: { display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 48 },
  ctaPrimary: { background: "#00d4ff", color: "#030712", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  ctaGhost: { background: "transparent", color: "#64748b", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 24px", fontSize: 14, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  companiesRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  companiesLabel: { fontSize: 12, color: "#334155", letterSpacing: "0.1em" },
  companies: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  companyTag: { fontSize: 12, color: "#475569", border: "1px solid #1e293b", borderRadius: 4, padding: "4px 10px" },
  statsRow: { display: "flex", justifyContent: "center", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", position: "relative", zIndex: 1 },
  statBox: { flex: 1, maxWidth: 200, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", borderRight: "1px solid #0f172a" },
  statValue: { fontSize: 32, fontWeight: 700, color: "#00d4ff", letterSpacing: "-0.02em" },
  statLabel: { fontSize: 12, color: "#475569", marginTop: 4, letterSpacing: "0.08em" },
  previewSection: { maxWidth: 900, margin: "0 auto", padding: "80px 40px", position: "relative", zIndex: 1 },
  sectionLabel: { fontSize: 11, letterSpacing: "0.2em", color: "#334155", marginBottom: 24, fontWeight: 600 },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  previewCard: { background: "#0a0f1e", border: "1px solid", borderRadius: 12, padding: 24 },
  previewIcon: { fontSize: 24, display: "block", marginBottom: 12 },
  previewTitle: { fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 },
  previewDesc: { fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 12 },
  previewMeta: { display: "flex", gap: 8 },
  previewDur: { fontSize: 12, fontWeight: 600 },
  archSection: { maxWidth: 900, margin: "0 auto", padding: "0 40px 80px", position: "relative", zIndex: 1 },
  archGrid: { display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  archBox: { display: "flex", alignItems: "center", gap: 8, background: "#0a0f1e", border: "1px solid #0f172a", borderRadius: 8, padding: "10px 16px" },
  archDot: { width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", display: "inline-block" },
  archSvc: { fontSize: 13, color: "#94a3b8" },
  archNote: { fontSize: 12, color: "#334155", letterSpacing: "0.08em" },
  footer: { textAlign: "center", padding: "24px", fontSize: 12, color: "#1e293b", borderTop: "1px solid #0a0f1e", position: "relative", zIndex: 1 },
  authWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 },
  authCard: { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420 },
  backBtn: { background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: "'DM Mono', monospace", marginBottom: 24, display: "block" },
  authLogo: { fontSize: 32, color: "#00d4ff", marginBottom: 16 },
  authTitle: { fontSize: 24, fontWeight: 700, color: "#f8fafc", marginBottom: 8 },
  authSub: { fontSize: 14, color: "#475569", marginBottom: 16 },
  authError: { background: "#ff4d4d11", border: "1px solid #ff4d4d44", borderRadius: 8, padding: "10px 14px", color: "#ff4d4d", fontSize: 13, marginBottom: 16 },
  authNote: { fontSize: 12, color: "#334155", textAlign: "center", marginTop: 12, lineHeight: 1.5 },
  authForm: { display: "flex", flexDirection: "column", gap: 14 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#64748b", letterSpacing: "0.08em" },
  input: { background: "#030712", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, fontFamily: "'DM Mono', monospace", outline: "none" },
  authBtn: { background: "#00d4ff", color: "#030712", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" },
  authSwitch: { fontSize: 13, color: "#475569", textAlign: "center", marginTop: 20 },
  authSwitchLink: { color: "#00d4ff", cursor: "pointer" },
  spinner: { width: 18, height: 18, border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #030712", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" },
  dash: { display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 },
  sidebar: { width: 220, background: "#0a0f1e", borderRight: "1px solid #0f172a", display: "flex", flexDirection: "column", padding: "24px 0" },
  sidebarLogo: { fontSize: 16, fontWeight: 700, color: "#00d4ff", padding: "0 24px", marginBottom: 32 },
  sideNav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  sideNavItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 24px", fontSize: 13, color: "#475569", cursor: "pointer" },
  sideNavActive: { color: "#e2e8f0", background: "#0f172a" },
  sideNavDot: { width: 4, height: 4, borderRadius: "50%", background: "currentColor" },
  sidebarBottom: { borderTop: "1px solid #0f172a", paddingTop: 12 },
  sidebarUser: { display: "flex", alignItems: "center", gap: 10, padding: "12px 24px" },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "#00d4ff22", border: "1px solid #00d4ff44", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4ff", fontSize: 13, fontWeight: 700, flexShrink: 0 },
  avatarName: { fontSize: 13, color: "#e2e8f0", fontWeight: 600 },
  avatarRole: { fontSize: 11, color: "#475569" },
  logoutBtn: { background: "none", border: "none", color: "#475569", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace", padding: "4px 24px", display: "block" },
  dashMain: { flex: 1, padding: "40px", overflowY: "auto" },
  dashHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 },
  dashTitle: { fontSize: 28, fontWeight: 700, color: "#f8fafc", marginBottom: 4 },
  dashSub: { fontSize: 14, color: "#475569" },
  scoreGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  scoreCard: { background: "#0a0f1e", border: "1px solid #0f172a", borderRadius: 12, padding: 20 },
  scoreCardLabel: { fontSize: 12, color: "#475569", marginBottom: 8, letterSpacing: "0.06em" },
  scoreCardValue: { fontSize: 28, fontWeight: 700 },
  scoreCardUnit: { fontSize: 13, color: "#475569" },
  skillSection: { background: "#0a0f1e", border: "1px solid #0f172a", borderRadius: 12, padding: 24, marginBottom: 24 },
  skillBars: { display: "flex", flexDirection: "column", gap: 14 },
  skillRow: { display: "flex", alignItems: "center", gap: 12 },
  skillName: { fontSize: 13, color: "#94a3b8", width: 140 },
  skillTrack: { flex: 1, height: 4, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  skillFill: { height: "100%", borderRadius: 4, transition: "width 1s ease" },
  skillPct: { fontSize: 13, fontWeight: 700, width: 30, textAlign: "right" },
  historySection: { background: "#0a0f1e", border: "1px solid #0f172a", borderRadius: 12, padding: 24 },
  historyList: { display: "flex", flexDirection: "column", gap: 12 },
  historyCard: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#030712", borderRadius: 8, border: "1px solid #0f172a" },
  historyLeft: { display: "flex", alignItems: "center", gap: 12 },
  historyType: { fontSize: 11, color: "#00d4ff", background: "#00d4ff11", border: "1px solid #00d4ff22", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.06em" },
  historyTopic: { fontSize: 13, color: "#94a3b8" },
  historyRight: { display: "flex", alignItems: "center", gap: 16 },
  historyScore: { fontSize: 14, fontWeight: 700 },
  historyDate: { fontSize: 12, color: "#334155" },
  emptyState: { fontSize: 14, color: "#334155", padding: "8px 0" },
  emptyHistory: { display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" },
  selectWrap: { minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", position: "relative", zIndex: 1 },
  selectInner: { width: "100%", maxWidth: 800 },
  selectTitle: { fontSize: 32, fontWeight: 700, color: "#f8fafc", marginBottom: 8 },
  selectSub: { fontSize: 14, color: "#475569", marginBottom: 32 },
  selectGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 },
  selectCard: { background: "#0a0f1e", border: "1px solid", borderRadius: 12, padding: 24, cursor: "pointer", transition: "all 0.15s" },
  selectIcon: { fontSize: 24, display: "block", marginBottom: 12 },
  selectCardTitle: { fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 },
  selectCardDesc: { fontSize: 13, color: "#475569", lineHeight: 1.6, marginBottom: 12 },
  selectDur: { fontSize: 12, fontWeight: 600 },
  diffWrap: { marginBottom: 32 },
  diffRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  diffBtn: { background: "transparent", border: "1px solid", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Mono', monospace", transition: "all 0.15s" },
  room: { display: "flex", flexDirection: "column", height: "100vh", position: "relative", zIndex: 1 },
  roomHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#0a0f1e", borderBottom: "1px solid #0f172a", gap: 16 },
  roomInfo: { display: "flex", alignItems: "center", gap: 16 },
  roomBack: { fontSize: 13, color: "#475569", cursor: "pointer" },
  roomTitle: { fontSize: 14, fontWeight: 600, color: "#94a3b8" },
  timerWrap: { display: "flex", alignItems: "center", gap: 10 },
  roomTimer: { fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", transition: "color 0.5s" },
  roomControls: { display: "flex", alignItems: "center", gap: 12 },
  langSelect: { background: "#030712", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 6, padding: "6px 10px", fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none" },
  startBtn: { background: "#34d39922", border: "1px solid #34d39944", color: "#34d399", borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  submitBtn: { background: "#00d4ff", color: "#030712", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  roomBody: { display: "flex", flex: 1, overflow: "hidden" },
  editorPanel: { flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #0f172a" },
  editorHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#0a0f1e", borderBottom: "1px solid #0f172a" },
  editorTitle: { fontSize: 11, color: "#475569", letterSpacing: "0.1em" },
  editorDots: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  editor: { flex: 1, background: "#030712", border: "none", color: "#e2e8f0", fontFamily: "'DM Mono', monospace", fontSize: 14, lineHeight: 1.7, padding: 20, resize: "none", outline: "none" },
  chatPanel: { width: 380, display: "flex", flexDirection: "column", background: "#0a0f1e" },
  chatHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #0f172a" },
  chatTitle: { fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.1em" },
  aiStatus: { fontSize: 11, color: "#34d399", letterSpacing: "0.06em" },
  chatMessages: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  msgBubble: { border: "1px solid", borderRadius: 10, padding: "10px 14px", maxWidth: "90%" },
  msgRole: { fontSize: 10, color: "#475569", display: "block", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" },
  msgText: { fontSize: 13, color: "#e2e8f0", lineHeight: 1.6, whiteSpace: "pre-wrap" },
  typingDots: { display: "flex", gap: 4, alignItems: "center", padding: "4px 0" },
  dot2: { width: 6, height: 6, borderRadius: "50%", background: "#475569", display: "inline-block", animation: "pulse 1.2s ease infinite" },
  chatInputRow: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #0f172a" },
  chatInput: { flex: 1, background: "#030712", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "'DM Mono', monospace", padding: "8px 12px", resize: "none", outline: "none", lineHeight: 1.5 },
  sendBtn: { background: "#00d4ff", color: "#030712", border: "none", borderRadius: 8, width: 36, fontWeight: 700, fontSize: 16, cursor: "pointer", transition: "opacity 0.2s" },
  resultWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 },
  resultCard: { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 440, width: "100%" },
  resultIcon: { fontSize: 48, marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: 700, color: "#f8fafc", marginBottom: 8 },
  resultSub: { fontSize: 14, color: "#475569", marginBottom: 24 },
  resultScore: { fontSize: 72, fontWeight: 700, lineHeight: 1, marginBottom: 16 },
  resultOut: { fontSize: 24, color: "#475569" },
  resultMsg: { fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.6 },
  resultBtns: { display: "flex", flexDirection: "column", gap: 12 },
  dialogOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  dialogBox: { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center" },
  dialogTitle: { fontSize: 20, fontWeight: 700, color: "#f8fafc", marginBottom: 12 },
  dialogMsg: { fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 },
  dialogBtns: { display: "flex", flexDirection: "column", gap: 10 },
  dialogSave: { background: "#00d4ff", color: "#030712", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  dialogDiscard: { background: "transparent", color: "#ff4d4d", border: "1px solid #ff4d4d33", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
  dialogCancel: { background: "transparent", color: "#475569", border: "1px solid #1e293b", borderRadius: 8, padding: "12px", fontSize: 14, cursor: "pointer", fontFamily: "'DM Mono', monospace" },
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #030712; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1); } }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #030712; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  textarea::placeholder { color: #334155; }
  input::placeholder { color: #334155; }
  option { background: #0a0f1e; }
  select option { background: #0a0f1e; color: #e2e8f0; }
`;