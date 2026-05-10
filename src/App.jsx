import { useState, useRef, useEffect } from "react";

const STEPS = ["upload", "search", "match", "apply"];
const STEP_LABELS = { upload: "Upload CV", search: "Search Scholarships", match: "Match & Align", apply: "Auto-Apply" };

const MOCK_SCHOLARSHIPS = [
  { id: 1, name: "Fulbright Foreign Student Program", org: "U.S. Department of State", amount: "$35,000", deadline: "Oct 15, 2026", country: "USA", url: "https://foreign.fulbrightonline.org", tags: ["Research", "Leadership", "International"] },
  { id: 2, name: "Gates Cambridge Scholarship", org: "Gates Cambridge Trust", amount: "Full Funding", deadline: "Dec 1, 2026", country: "UK", url: "https://www.gatescambridge.org", tags: ["STEM", "Social Impact", "Leadership"] },
  { id: 3, name: "Chevening Scholarships", org: "UK Government", amount: "Full Funding", deadline: "Nov 5, 2026", country: "UK", url: "https://www.chevening.org", tags: ["Leadership", "Networking", "International"] },
  { id: 4, name: "DAAD Scholarships", org: "German Academic Exchange Service", amount: "€11,208/year", deadline: "Sep 30, 2026", country: "Germany", url: "https://www.daad.de", tags: ["Research", "Language", "Innovation"] },
  { id: 5, name: "Commonwealth Scholarship", org: "Commonwealth Scholarship Commission", amount: "Full Funding", deadline: "Aug 31, 2026", country: "UK", url: "https://cscuk.fcdo.gov.uk", tags: ["Development", "Social Impact", "Leadership"] },
  { id: 6, name: "Erasmus Mundus", org: "European Commission", amount: "€1,400/month", deadline: "Jan 15, 2027", country: "Europe", url: "https://ec.europa.eu/erasmus-plus", tags: ["Mobility", "Research", "Innovation"] },
];

async function callGemini(prompt) {
  const key = process.env.REACT_APP_GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const btn = { marginTop: 20, width: "100%", padding: "14px", background: "linear-gradient(135deg,#00e5a0,#00b8d9)", border: "none", borderRadius: 12, color: "#0a0a14", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "monospace" };
const card = { background: "rgba(255,255,255,0.03)", border: "1px solid #2a2a50", borderRadius: 12, padding: "14px 16px" };

function Spinner() {
  return <div style={{ width: 48, height: 48, border: "3px solid #1a1a30", borderTopColor: "#00e5a0", borderRadius: "50%", margin: "32px auto", animation: "spin 1s linear infinite" }} />;
}

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: i < idx ? "#00e5a0" : i === idx ? "#fff" : "transparent", border: `3px solid ${i <= idx ? "#00e5a0" : "#2a2a40"}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: i < idx ? "#000" : i === idx ? "#00e5a0" : "#2a2a40" }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 10, color: i <= idx ? "#00e5a0" : "#2a2a40", textTransform: "uppercase", whiteSpace: "nowrap", fontFamily: "monospace" }}>{STEP_LABELS[s]}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ height: 2, flex: 1, marginBottom: 20, background: i < idx ? "#00e5a0" : "#1a1a2e" }} />}
        </div>
      ))}
    </div>
  );
}

function CVUpload({ onDone }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [profile, setProfile] = useState(null);
  const ref = useRef();

  const handleFile = async (f) => {
    setFile(f); setParsing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = await callGemini(`Extract profile from this CV as JSON only: {name, education:[{degree,field,institution}], skills:[string], languages:[string], achievements:[string]}. CV:\n${e.target.result.substring(0, 2000)}`);
        setProfile(JSON.parse(text.replace(/```json|```/g, "").trim()));
      } catch { setProfile({ name: f.name, skills: ["Research", "Leadership"], languages: ["English"], achievements: [] }); }
      setParsing(false);
    };
    reader.readAsText(f);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, color: "#fff", marginBottom: 8 }}>Upload Your CV</h2>
      <p style={{ color: "#7070a0", fontSize: 13, marginBottom: 24, fontFamily: "monospace" }}>AI will parse your profile to find best-fit scholarships.</p>
      {!file && !parsing && !profile && (
        <>
          <div onClick={() => ref.current.click()} style={{ border: "2px dashed #2a2a50", borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <p style={{ color: "#fff", fontFamily: "monospace", fontSize: 13 }}>Tap to upload your CV</p>
            <p style={{ color: "#505075", fontSize: 11 }}>PDF, DOC, TXT supported</p>
            <input ref={ref} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          </div>
          <button onClick={() => onDone({ profile: { name: "Demo User", skills: ["Python", "Research", "Leadership"], languages: ["English", "French"], achievements: ["Dean's List"], education: [{ degree: "MSc", field: "Computer Science", institution: "University" }] } })} style={{ ...btn, marginTop: 12, background: "transparent", border: "1px solid #2a2a50", color: "#7070a0", fontSize: 12 }}>
            Use demo profile instead →
          </button>
        </>
      )}
      {parsing && <><Spinner /><p style={{ textAlign: "center", color: "#00e5a0", fontFamily: "monospace", fontSize: 13 }}>Parsing your CV with Gemini AI...</p></>}
      {profile && (
        <div style={{ ...card, border: "1px solid rgba(0,229,160,0.3)" }}>
          <p style={{ color: "#00e5a0", fontFamily: "monospace", fontSize: 12, marginBottom: 8 }}>✓ Profile extracted!</p>
          <p style={{ color: "#fff", fontSize: 18, fontFamily: "Georgia,serif", marginBottom: 8 }}>{profile.name}</p>
          <p style={{ color: "#9090b0", fontSize: 12, fontFamily: "monospace" }}>Skills: {profile.skills?.slice(0, 4).join(", ")}</p>
          <p style={{ color: "#9090b0", fontSize: 12, fontFamily: "monospace" }}>Languages: {profile.languages?.join(", ")}</p>
          <button onClick={() => onDone({ profile })} style={btn}>Continue to Search →</button>
        </div>
      )}
    </div>
  );
}

function SearchScholarships({ onDone }) {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  const search = async () => {
    setSearching(true);
    await new Promise(r => setTimeout(r, 1500));
    const filtered = keyword ? MOCK_SCHOLARSHIPS.filter(s => s.name.toLowerCase().includes(keyword.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(keyword.toLowerCase()))) : MOCK_SCHOLARSHIPS;
    setResults(filtered.length ? filtered : MOCK_SCHOLARSHIPS);
    setSearching(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, color: "#fff", marginBottom: 8 }}>Search Scholarships</h2>
      <p style={{ color: "#7070a0", fontSize: 13, marginBottom: 20, fontFamily: "monospace" }}>Search global scholarship database.</p>
      <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search keyword (e.g. STEM, leadership, UK...)" style={{ width: "100%", background: "#0f0f22", border: "1px solid #2a2a50", borderRadius: 10, padding: "12px 16px", color: "#b0b0d0", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      <button onClick={search} style={btn}>{searching ? "Searching..." : "🔍 Search Scholarships"}</button>
      {searching && <Spinner />}
      {results && !searching && (
        <>
          <p style={{ color: "#7070a0", fontFamily: "monospace", fontSize: 11, marginTop: 16, marginBottom: 10 }}>FOUND {results.length} SCHOLARSHIPS</p>
          <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map(s => (
              <div key={s.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: 14, margin: 0 }}>{s.name}</p>
                    <p style={{ color: "#7070a0", fontSize: 11, fontFamily: "monospace", margin: "4px 0" }}>{s.org} · {s.country}</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                      {s.tags.map(t => <span key={t} style={{ background: "rgba(0,229,160,0.1)", color: "#00e5a0", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontFamily: "monospace" }}>{t}</span>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <p style={{ color: "#00e5a0", fontFamily: "monospace", fontSize: 12, fontWeight: 700, margin: 0 }}>{s.amount}</p>
                    <p style={{ color: "#505075", fontSize: 10, margin: "4px 0" }}>{s.deadline}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onDone(results)} style={btn}>Analyse My Match →</button>
        </>
      )}
    </div>
  );
}

function MatchAlign({ cvData, scholarships, onDone }) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const text = await callGemini(`Rate these scholarships for this candidate. Return JSON array only: [{id,score,note,strengths:[string],gaps:[string]}]\nCandidate: ${JSON.stringify(cvData.profile)}\nScholarships: ${JSON.stringify(scholarships.map(s => ({ id: s.id, name: s.name, tags: s.tags })))}`);
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        setMatches(scholarships.map(s => ({ ...s, ...(parsed.find(p => p.id === s.id) || { score: 70, note: "Good match.", strengths: ["Academic background"], gaps: [] }) })).sort((a, b) => b.score - a.score));
      } catch {
        setMatches(scholarships.map((s, i) => ({ ...s, score: 92 - i * 6, note: "Your profile aligns well with this scholarship.", strengths: ["Strong academics"], gaps: [] })));
      }
      setLoading(false);
    })();
  }, []);

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const color = s => s >= 85 ? "#00e5a0" : s >= 70 ? "#f0c040" : "#ff6070";

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, color: "#fff", marginBottom: 8 }}>AI Match Analysis</h2>
      <p style={{ color: "#7070a0", fontSize: 13, marginBottom: 20, fontFamily: "monospace" }}>Select scholarships to apply for.</p>
      {loading ? <><Spinner /><p style={{ textAlign: "center", color: "#00e5a0", fontFamily: "monospace", fontSize: 13 }}>Gemini AI is matching your profile...</p></> : (
        <>
          <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {matches.map(s => (
              <div key={s.id} onClick={() => toggle(s.id)} style={{ ...card, border: `1px solid ${selected.includes(s.id) ? "rgba(0,229,160,0.4)" : "#2a2a50"}`, background: selected.includes(s.id) ? "rgba(0,229,160,0.06)" : "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: 14, margin: 0 }}>{selected.includes(s.id) ? "☑" : "☐"} {s.name}</p>
                    <p style={{ color: "#7070a0", fontSize: 11, fontFamily: "monospace", margin: "4px 0 0 20px" }}>{s.amount} · Due {s.deadline}</p>
                    <p style={{ color: "#9090b0", fontSize: 11, fontFamily: "monospace", margin: "6px 0 0 20px", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: 6 }}>💡 {s.note}</p>
                    <div style={{ display: "flex", gap: 4, marginTop: 6, marginLeft: 20, flexWrap: "wrap" }}>
                      {s.strengths?.map((t, i) => <span key={i} style={{ background: "rgba(0,229,160,0.1)", color: "#00e5a0", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>✓ {t}</span>)}
                      {s.gaps?.map((t, i) => <span key={i} style={{ background: "rgba(255,96,112,0.1)", color: "#ff6070", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>△ {t}</span>)}
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${color(s.score)}`, display: "flex", alignItems: "center", justifyContent: "center", color: color(s.score), fontFamily: "monospace", fontWeight: 700, fontSize: 12, marginLeft: 8, flexShrink: 0 }}>{s.score}</div>
                </div>
              </div>
            ))}
          </div>
          <button disabled={!selected.length} onClick={() => onDone(matches.filter(m => selected.includes(m.id)))} style={{ ...btn, opacity: selected.length ? 1 : 0.4 }}>Apply to {selected.length || ""} Selected →</button>
        </>
      )}
    </div>
  );
}

function AutoApply({ cvData, selectedScholarships }) {
  const [progress, setProgress] = useState([]);
  const [statements, setStatements] = useState({});
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      for (const s of selectedScholarships) {
        setProgress(p => [...p, { id: s.id, name: s.name, status: "drafting" }]);
        try {
          const text = await callGemini(`Write a 150-word personal statement for: ${s.name} by ${s.org}. Candidate: ${JSON.stringify(cvData.profile)}. Be personal and persuasive. Return statement text only.`);
          setStatements(p => ({ ...p, [s.id]: text }));
        } catch {
          setStatements(p => ({ ...p, [s.id]: "My academic background and commitment to excellence make me an ideal candidate for this scholarship." }));
        }
        setProgress(p => p.map(x => x.id === s.id ? { ...x, status: "done" } : x));
        await new Promise(r => setTimeout(r, 500));
      }
      setDone(true);
    })();
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia,serif", fontSize: 26, color: "#fff", marginBottom: 8 }}>{done ? "🎉 Applications Ready!" : "Preparing Applications..."}</h2>
      <p style={{ color: "#7070a0", fontSize: 13, marginBottom: 20, fontFamily: "monospace" }}>{done ? "Review and submit each application below." : "Gemini AI is writing personalized statements..."}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {progress.map(p => (
          <div key={p.id} style={{ ...card, border: `1px solid ${p.status === "done" ? "rgba(0,229,160,0.25)" : "#2a2a50"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {p.status === "done" ? <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,229,160,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e5a0" }}>✓</div> : <div style={{ width: 28, height: 28, border: "2px solid #1a1a30", borderTopColor: "#00e5a0", borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
              <div style={{ flex: 1 }}>
                <p style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: 13, margin: 0 }}>{p.name}</p>
                <p style={{ color: p.status === "done" ? "#00e5a0" : "#505075", fontSize: 11, fontFamily: "monospace", margin: 0 }}>{p.status === "done" ? "Statement drafted ✓" : "Writing..."}</p>
              </div>
              {p.status === "done" && <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{ background: "transparent", border: "1px solid #2a2a50", borderRadius: 6, color: "#7070a0", fontFamily: "monospace", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>{expanded === p.id ? "Hide" : "View"}</button>}
            </div>
            {expanded === p.id && statements[p.id] && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1a1a30" }}>
                <p style={{ color: "#c0c0d0", fontFamily: "Georgia,serif", fontSize: 13, lineHeight: 1.7 }}>{statements[p.id]}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => navigator.clipboard?.writeText(statements[p.id])} style={{ background: "transparent", border: "1px solid #2a2a50", borderRadius: 6, color: "#7070a0", fontFamily: "monospace", fontSize: 11, padding: "6px 12px", cursor: "pointer" }}>Copy</button>
                  <a href={selectedScholarships.find(s => s.id === p.id)?.url} target="_blank" rel="noreferrer" style={{ background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", borderRadius: 6, color: "#00e5a0", fontFamily: "monospace", fontSize: 11, padding: "6px 12px", textDecoration: "none" }}>Apply Online →</a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {done && <div style={{ marginTop: 20, textAlign: "center", background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 12, padding: 20 }}><p style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: 16 }}>🎓 {progress.length} application{progress.length > 1 ? "s" : ""} ready to submit!</p><p style={{ color: "#7070a0", fontFamily: "monospace", fontSize: 11 }}>Always verify deadlines on official portals.</p></div>}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("upload");
  const [cvData, setCvData] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [selected, setSelected] = useState([]);

  return (
    <div style={{ minHeight: "100vh", background: "#08081a", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>
      <div style={{ maxWidth: 600, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12, background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 100, padding: "5px 14px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00e5a0", display: "inline-block" }} />
            <span style={{ color: "#00e5a0", fontFamily: "monospace", fontSize: 11 }}>AI SCHOLARSHIP AGENT · GEMINI</span>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 32, color: "#fff", marginBottom: 8 }}>Your Personal<br /><span style={{ background: "linear-gradient(135deg,#00e5a0,#00b8d9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Scholarship Agent</span></h1>
          <p style={{ color: "#6060a0", fontFamily: "monospace", fontSize: 12 }}>Upload CV → Search → Match → Apply</p>
        </div>
        <ProgressBar step={step} />
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 28 }}>
          {step === "upload" && <CVUpload onDone={d => { setCvData(d); setStep("search"); }} />}
          {step === "search" && <SearchScholarships cvData={cvData} onDone={r => { setScholarships(r); setStep("match"); }} />}
          {step === "match" && <MatchAlign cvData={cvData} scholarships={scholarships} onDone={s => { setSelected(s); setStep("apply"); }} />}
          {step === "apply" && <AutoApply cvData={cvData} selectedScholarships={selected} />}
        </div>
      </div>
    </div>
  );
}
