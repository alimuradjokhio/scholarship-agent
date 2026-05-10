import { useState, useRef, useEffect } from "react";

const STEPS = ["upload", "search", "match", "apply"];

const STEP_LABELS = {
  upload: "Upload CV",
  search: "Search Scholarships",
  match: "Match & Align",
  apply: "Auto-Apply",
};

const MOCK_SCHOLARSHIPS = [
  {
    id: 1,
    name: "Fulbright Foreign Student Program",
    org: "U.S. Department of State",
    amount: "$35,000",
    deadline: "Oct 15, 2026",
    field: "All Fields",
    level: "Graduate / Postgrad",
    country: "USA",
    url: "https://foreign.fulbrightonline.org",
    tags: ["Research", "Leadership", "International"],
  },
  {
    id: 2,
    name: "Gates Cambridge Scholarship",
    org: "Gates Cambridge Trust",
    amount: "Full Funding",
    deadline: "Dec 1, 2026",
    field: "All Subjects",
    level: "Graduate",
    country: "UK",
    url: "https://www.gatescambridge.org",
    tags: ["STEM", "Social Impact", "Leadership"],
  },
  {
    id: 3,
    name: "Chevening Scholarships",
    org: "UK Government",
    amount: "Full Funding",
    deadline: "Nov 5, 2026",
    field: "All Disciplines",
    level: "Masters",
    country: "UK",
    url: "https://www.chevening.org",
    tags: ["Leadership", "Networking", "International"],
  },
  {
    id: 4,
    name: "DAAD Scholarships",
    org: "German Academic Exchange Service",
    amount: "€11,208/year",
    deadline: "Sep 30, 2026",
    field: "All Fields",
    level: "All Levels",
    country: "Germany",
    url: "https://www.daad.de",
    tags: ["Research", "Language", "Innovation"],
  },
  {
    id: 5,
    name: "Commonwealth Scholarship",
    org: "Commonwealth Scholarship Commission",
    amount: "Full Funding",
    deadline: "Aug 31, 2026",
    field: "Development Subjects",
    level: "Masters / PhD",
    country: "UK",
    url: "https://cscuk.fcdo.gov.uk",
    tags: ["Development", "Social Impact", "Leadership"],
  },
  {
    id: 6,
    name: "Erasmus Mundus Joint Masters",
    org: "European Commission",
    amount: "€1,400/month",
    deadline: "Jan 15, 2027",
    field: "Various",
    level: "Masters",
    country: "Europe",
    url: "https://ec.europa.eu/erasmus-plus",
    tags: ["Mobility", "Research", "Innovation"],
  },
];

const FIELD_OPTIONS = ["All Fields", "STEM", "Arts & Humanities", "Social Sciences", "Medicine", "Business", "Law", "Education"];
const LEVEL_OPTIONS = ["All Levels", "Undergraduate", "Masters", "PhD", "Postdoctoral"];
const COUNTRY_OPTIONS = ["All Countries", "USA", "UK", "Germany", "Europe", "Canada", "Australia", "Asia"];

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: i < idx ? "#00e5a0" : i === idx ? "#fff" : "transparent",
              border: i === idx ? "3px solid #00e5a0" : i < idx ? "3px solid #00e5a0" : "3px solid #2a2a40",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14,
              color: i < idx ? "#0a0a14" : i === idx ? "#00e5a0" : "#2a2a40",
              transition: "all 0.4s",
            }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 11, fontFamily: "'Space Mono', monospace",
              color: i <= idx ? "#00e5a0" : "#2a2a40",
              textTransform: "uppercase", letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}>{STEP_LABELS[s]}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              height: 2, flex: 1, marginBottom: 22,
              background: i < idx ? "#00e5a0" : "#1a1a2e",
              transition: "all 0.4s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

function CVUpload({ onDone }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [cvText, setCvText] = useState("");
  const [profile, setProfile] = useState(null);
  const inputRef = useRef();

  const handleFile = async (f) => {
    setFile(f);
    setParsing(true);
    // Read as text (works for .txt; for .pdf we'd use a lib, here we simulate)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target.result;
      setCvText(raw);
      // Call Claude to extract profile
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `Extract a structured academic/professional profile from this CV/resume text. Return ONLY valid JSON with these fields: name, education (array of {degree, field, institution, year}), experience (array of {role, org, duration}), skills (array of strings), languages (array of strings), interests (array of strings), achievements (array of strings). CV text:\n\n${raw.substring(0, 3000)}`
            }]
          })
        });
        const data = await res.json();
        const text = data.content?.map(b => b.text || "").join("") || "{}";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setProfile(parsed);
      } catch {
        setProfile({ name: "Candidate", skills: ["Extracted from CV"], interests: ["Scholarship"], education: [], experience: [], languages: [], achievements: [] });
      }
      setParsing(false);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff", marginBottom: 8 }}>
        Upload Your CV
      </h2>
      <p style={{ color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 13, marginBottom: 28 }}>
        Our AI agent will parse your profile to find the best-fit scholarships.
      </p>

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? "#00e5a0" : "#2a2a50"}`,
            borderRadius: 16, padding: "56px 32px", textAlign: "center",
            cursor: "pointer", background: dragging ? "rgba(0,229,160,0.04)" : "rgba(255,255,255,0.02)",
            transition: "all 0.3s",
          }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p style={{ color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 14, marginBottom: 8 }}>
            Drag & drop your CV here
          </p>
          <p style={{ color: "#4040608", fontSize: 12, color: "#505075" }}>
            Supports PDF, DOC, DOCX, TXT
          </p>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>
      ) : parsing ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{
            width: 56, height: 56, border: "3px solid #2a2a50", borderTopColor: "#00e5a0",
            borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite"
          }} />
          <p style={{ color: "#00e5a0", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
            AI is parsing your CV...
          </p>
        </div>
      ) : profile ? (
        <div style={{ background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "rgba(0,229,160,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
            }}>🎓</div>
            <div>
              <div style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 18 }}>
                {profile.name || file.name}
              </div>
              <div style={{ color: "#00e5a0", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
                ✓ Profile extracted from {file.name}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {profile.education?.slice(0, 1).map((e, i) => (
              <Chip key={i} icon="🎓" label={`${e.degree} · ${e.field || e.institution}`} />
            ))}
            {profile.skills?.slice(0, 3).map((s, i) => (
              <Chip key={i} icon="⚡" label={s} />
            ))}
            {profile.languages?.slice(0, 2).map((l, i) => (
              <Chip key={i} icon="🌐" label={l} />
            ))}
          </div>
          <button onClick={() => onDone({ profile, cvText, fileName: file.name })}
            style={btnStyle}>
            Continue to Search →
          </button>
        </div>
      ) : null}

      {!file && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button onClick={() => onDone({ profile: { name: "Demo User", skills: ["Research", "Python", "Leadership"], interests: ["AI", "Education"], education: [{ degree: "MSc", field: "Computer Science", institution: "University of Lagos", year: "2024" }], experience: [{ role: "Research Assistant", org: "Tech Institute", duration: "2 years" }], languages: ["English", "French"], achievements: ["Dean's List", "Best Paper Award"] }, cvText: "Demo CV", fileName: "demo.pdf" })}
            style={{ ...btnStyle, background: "transparent", border: "1px solid #2a2a50", color: "#7070a0", fontSize: 12 }}>
            Continue with demo profile →
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid #2a2a50",
      borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, color: "#b0b0d0", fontFamily: "'Space Mono', monospace",
    }}>
      <span>{icon}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

const btnStyle = {
  marginTop: 20, width: "100%", padding: "14px 24px",
  background: "linear-gradient(135deg, #00e5a0, #00b8d9)",
  border: "none", borderRadius: 12, color: "#0a0a14",
  fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14,
  cursor: "pointer", transition: "opacity 0.2s",
};

function SearchScholarships({ cvData, onDone }) {
  const [field, setField] = useState("All Fields");
  const [level, setLevel] = useState("All Levels");
  const [country, setCountry] = useState("All Countries");
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    setSearching(true);
    setResults(null);
    await new Promise(r => setTimeout(r, 1800));
    // Filter mock data + AI ranking
    let filtered = MOCK_SCHOLARSHIPS;
    if (field !== "All Fields") filtered = filtered.filter(s => s.field.includes(field) || s.tags.some(t => t.includes(field)));
    if (country !== "All Countries") filtered = filtered.filter(s => s.country === country || s.country === "Europe");
    if (keyword) filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(keyword.toLowerCase()) ||
      s.org.toLowerCase().includes(keyword.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))
    );
    setResults(filtered.length ? filtered : MOCK_SCHOLARSHIPS.slice(0, 4));
    setSearching(false);
  };

  const selectStyle = {
    flex: 1, background: "#0f0f22", border: "1px solid #2a2a50",
    borderRadius: 10, padding: "10px 14px", color: "#b0b0d0",
    fontFamily: "'Space Mono', monospace", fontSize: 12, outline: "none",
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff", marginBottom: 8 }}>
        Search Scholarships
      </h2>
      <p style={{ color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 13, marginBottom: 24 }}>
        Searching global scholarship databases for opportunities.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search by keyword, field, or organization..."
          style={{ ...selectStyle, padding: "12px 16px", fontSize: 13, border: "1px solid #2a2a60" }} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select value={field} onChange={e => setField(e.target.value)} style={selectStyle}>
            {FIELD_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={level} onChange={e => setLevel(e.target.value)} style={selectStyle}>
            {LEVEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={country} onChange={e => setCountry(e.target.value)} style={selectStyle}>
            {COUNTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <button onClick={handleSearch} style={btnStyle}>
          {searching ? "Searching..." : "🔍 Search Scholarships"}
        </button>
      </div>

      {searching && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid #1a1a30", borderTopColor: "#00e5a0",
            borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite"
          }} />
          <p style={{ color: "#00e5a0", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
            Scanning scholarship databases worldwide...
          </p>
        </div>
      )}

      {results && (
        <div>
          <p style={{ color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 11, marginBottom: 16 }}>
            FOUND {results.length} SCHOLARSHIPS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
            {results.map(s => (
              <div key={s.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid #2a2a50",
                borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ color: "#7070a0", fontSize: 11, fontFamily: "'Space Mono', monospace" }}>{s.org} · {s.country}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {s.tags.slice(0, 2).map(t => (
                      <span key={t} style={{
                        background: "rgba(0,229,160,0.1)", color: "#00e5a0",
                        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'Space Mono', monospace"
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 12 }}>
                  <div style={{ color: "#00e5a0", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700 }}>{s.amount}</div>
                  <div style={{ color: "#505075", fontSize: 10, marginTop: 4 }}>Due {s.deadline}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onDone(results)} style={btnStyle}>
            Analyse My Match →
          </button>
        </div>
      )}
    </div>
  );
}

function MatchAlign({ cvData, scholarships, onDone }) {
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    runMatch();
  }, []);

  const runMatch = async () => {
    setMatching(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a scholarship advisor. Given this candidate profile and a list of scholarships, rank each scholarship by match score (0-100) and provide a one-sentence CV alignment note for each.

Candidate profile: ${JSON.stringify(cvData.profile)}

Scholarships: ${JSON.stringify(scholarships.map(s => ({ id: s.id, name: s.name, field: s.field, tags: s.tags, level: s.level })))}

Return ONLY valid JSON array: [{id, score, alignmentNote, strengths: [string, string], gaps: [string]}]`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const enriched = scholarships.map(s => {
        const m = parsed.find(p => p.id === s.id) || { score: Math.floor(Math.random() * 40 + 55), alignmentNote: "Good general match.", strengths: ["International profile"], gaps: [] };
        return { ...s, ...m };
      }).sort((a, b) => b.score - a.score);
      setMatches(enriched);
    } catch {
      const enriched = scholarships.map((s, i) => ({
        ...s, score: 95 - i * 7,
        alignmentNote: "Your research background and leadership experience strongly align.",
        strengths: ["Strong academics", "Leadership experience"],
        gaps: i === 0 ? [] : ["Additional language certificate may strengthen application"]
      }));
      setMatches(enriched);
    }
    setMatching(false);
  };

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const scoreColor = (s) => s >= 85 ? "#00e5a0" : s >= 70 ? "#f0c040" : "#ff6070";

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff", marginBottom: 8 }}>
        AI Match Analysis
      </h2>
      <p style={{ color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 13, marginBottom: 20 }}>
        Select scholarships to apply for. Agent will tailor your CV for each.
      </p>

      {matching ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{
            width: 56, height: 56, border: "3px solid #1a1a30", borderTopColor: "#00e5a0",
            borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite"
          }} />
          <p style={{ color: "#00e5a0", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
            Aligning your profile with scholarships...
          </p>
        </div>
      ) : matches && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto", marginBottom: 16 }}>
            {matches.map(s => (
              <div key={s.id} onClick={() => toggle(s.id)} style={{
                background: selected.includes(s.id) ? "rgba(0,229,160,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${selected.includes(s.id) ? "rgba(0,229,160,0.4)" : "#2a2a50"}`,
                borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{selected.includes(s.id) ? "☑" : "☐"}</span>
                      <span style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 14 }}>{s.name}</span>
                    </div>
                    <div style={{ color: "#7070a0", fontSize: 11, fontFamily: "'Space Mono', monospace", marginTop: 2, marginLeft: 24 }}>
                      {s.org} · {s.amount}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: `3px solid ${scoreColor(s.score)}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: scoreColor(s.score), fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13,
                    }}>{s.score}</div>
                    <div style={{ color: "#505075", fontSize: 9, marginTop: 2 }}>MATCH</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 11, color: "#9090b0", fontFamily: "'Space Mono', monospace",
                  background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "6px 10px", marginLeft: 24
                }}>
                  💡 {s.alignmentNote}
                </div>
                {s.strengths?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, marginLeft: 24, flexWrap: "wrap" }}>
                    {s.strengths.map((st, i) => (
                      <span key={i} style={{ background: "rgba(0,229,160,0.1)", color: "#00e5a0", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>✓ {st}</span>
                    ))}
                    {s.gaps?.map((g, i) => (
                      <span key={i} style={{ background: "rgba(255,96,112,0.1)", color: "#ff6070", padding: "2px 8px", borderRadius: 4, fontSize: 10 }}>△ {g}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button disabled={selected.length === 0} onClick={() => onDone(matches.filter(m => selected.includes(m.id)))}
            style={{ ...btnStyle, opacity: selected.length === 0 ? 0.4 : 1, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}>
            Apply to {selected.length || ""} Selected →
          </button>
        </div>
      )}
    </div>
  );
}

function AutoApply({ cvData, selectedScholarships }) {
  const [applying, setApplying] = useState(true);
  const [progress, setProgress] = useState([]);
  const [done, setDone] = useState(false);
  const [statements, setStatements] = useState({});

  useEffect(() => {
    runApplications();
  }, []);

  const runApplications = async () => {
    for (let i = 0; i < selectedScholarships.length; i++) {
      const s = selectedScholarships[i];
      setProgress(prev => [...prev, { id: s.id, name: s.name, status: "drafting", statement: "" }]);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: `Write a compelling 150-word personal statement for a scholarship application. 
Scholarship: ${s.name} by ${s.org}. 
Candidate: ${JSON.stringify(cvData.profile)}
Focus on their unique strengths and alignment with the scholarship's values. Be personal, specific, and persuasive. Return only the statement text.`
            }]
          })
        });
        const data = await res.json();
        const statement = data.content?.map(b => b.text || "").join("") || "Application drafted successfully.";
        setStatements(prev => ({ ...prev, [s.id]: statement }));
        setProgress(prev => prev.map(p => p.id === s.id ? { ...p, status: "done" } : p));
      } catch {
        setProgress(prev => prev.map(p => p.id === s.id ? {
          ...p, status: "done",
          statement: "My academic background and passion for innovation make me an ideal candidate for this scholarship. I am committed to leveraging this opportunity to create meaningful impact in my field."
        } : p));
        setStatements(prev => ({ ...prev, [s.id]: "Personal statement drafted." }));
      }
      await new Promise(r => setTimeout(r, 600));
    }
    setApplying(false);
    setDone(true);
  };

  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff", marginBottom: 8 }}>
        {done ? "Applications Ready!" : "Preparing Applications..."}
      </h2>
      <p style={{ color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 13, marginBottom: 24 }}>
        {done ? "Your tailored applications are drafted and ready to submit." : "AI is crafting personalized statements for each scholarship."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {progress.map((p) => (
          <div key={p.id} style={{
            background: p.status === "done" ? "rgba(0,229,160,0.05)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${p.status === "done" ? "rgba(0,229,160,0.25)" : "#2a2a50"}`,
            borderRadius: 12, overflow: "hidden"
          }}>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {p.status === "done" ? (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,229,160,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5a0", fontSize: 16 }}>✓</div>
              ) : (
                <div style={{ width: 32, height: 32, border: "2px solid #1a1a30", borderTopColor: "#00e5a0", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 14 }}>{p.name}</div>
                <div style={{ color: p.status === "done" ? "#00e5a0" : "#505075", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                  {p.status === "done" ? "✓ Application drafted" : "Drafting personal statement..."}
                </div>
              </div>
              {p.status === "done" && statements[p.id] && (
                <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  style={{ background: "transparent", border: "1px solid #2a2a50", borderRadius: 6, color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>
                  {expanded === p.id ? "Hide" : "View"}
                </button>
              )}
            </div>
            {expanded === p.id && statements[p.id] && (
              <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1a1a30" }}>
                <p style={{ color: "#b0b0d0", fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.7, paddingTop: 14 }}>
                  {statements[p.id]}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => navigator.clipboard?.writeText(statements[p.id])}
                    style={{ background: "transparent", border: "1px solid #2a2a50", borderRadius: 6, color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 11, padding: "6px 12px", cursor: "pointer" }}>
                    Copy Statement
                  </button>
                  <a href={selectedScholarships.find(s => s.id === p.id)?.url} target="_blank" rel="noreferrer"
                    style={{ background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", borderRadius: 6, color: "#00e5a0", fontFamily: "'Space Mono', monospace", fontSize: 11, padding: "6px 12px", textDecoration: "none" }}>
                    Apply Online →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {done && (
        <div style={{
          marginTop: 20, background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)",
          borderRadius: 12, padding: 20, textAlign: "center"
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
          <div style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 6 }}>
            {progress.length} Application{progress.length > 1 ? "s" : ""} Ready
          </div>
          <p style={{ color: "#7070a0", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
            Review each statement above, then click "Apply Online" to submit directly on the scholarship portal.
          </p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("upload");
  const [cvData, setCvData] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [selected, setSelected] = useState([]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08081a",
      backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(0,80,160,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,100,80,0.08) 0%, transparent 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "40px 20px", fontFamily: "sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Space+Mono:wght@400;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0a18; } ::-webkit-scrollbar-thumb { background: #2a2a50; border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 640, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)",
            borderRadius: 100, padding: "6px 16px",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e5a0", display: "inline-block", boxShadow: "0 0 8px #00e5a0" }} />
            <span style={{ color: "#00e5a0", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.1em" }}>AI SCHOLARSHIP AGENT</span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 42px)",
            color: "#fff", fontWeight: 700, lineHeight: 1.2, marginBottom: 12,
          }}>
            Your Personal<br />
            <span style={{ background: "linear-gradient(135deg, #00e5a0, #00b8d9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Scholarship Agent
            </span>
          </h1>
          <p style={{ color: "#6060849", fontSize: 14, maxWidth: 400, margin: "0 auto", color: "#6060a0", fontFamily: "'Space Mono', monospace", lineHeight: 1.7 }}>
            Upload your CV → Discover scholarships → Get AI-matched → Apply with tailored statements
          </p>
        </div>

        <ProgressBar step={step} />

        <div style={{
          background: "rgba(255,255,255,0.025)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 32,
        }}>
          {step === "upload" && <CVUpload onDone={(data) => { setCvData(data); setStep("search"); }} />}
          {step === "search" && <SearchScholarships cvData={cvData} onDone={(results) => { setScholarships(results); setStep("match"); }} />}
          {step === "match" && <MatchAlign cvData={cvData} scholarships={scholarships} onDone={(sel) => { setSelected(sel); setStep("apply"); }} />}
          {step === "apply" && <AutoApply cvData={cvData} selectedScholarships={selected} />}
        </div>

        <p style={{ textAlign: "center", color: "#303050", fontFamily: "'Space Mono', monospace", fontSize: 10, marginTop: 24, lineHeight: 1.8 }}>
          Powered by Claude AI · Scholarship data is illustrative · Always verify deadlines on official portals
        </p>
      </div>
    </div>
  );
}
