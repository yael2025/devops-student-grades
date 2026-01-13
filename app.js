const fs = require("fs")
const path = require("path")


//helpers
function nowIso() {
    return new Date().toISOString()
}

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function logLine(logPath, line) {
    fs.appendFileSync(logPath, `[${nowIso()}] ${line}\n`, "utf8")
}

function fail(logPath, msg) {
    logLine(logPath, `ERROR: ${msg}`)
    console.error(msg)
    process.exit(1)
}

function parseScores(scoresStr) {
    // "90,78,100" -> [90,78,100]
    return scoresStr
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => Number(s))
}

function stats(arr) {
    const n = arr.length
    const min = Math.min(...arr)
    const max = Math.max(...arr)
    const sum = arr.reduce((a, b) => a + b, 0)
    const average = n ? (sum / n)  : 0;
    const variance = arr.reduce((a, x) => a + Math.pow(x - average, 2), 0) / n
    const std = Math.sqrt(variance)
    return { n, min, max, sum, average, std }
}

//red parameters from env (Jenkins-friendly)
const outDir = path.join(process.cwd(), "output")
ensureDir(outDir)

const logPath = path.join(outDir, "run.log")
fs.writeFileSync(logPath, "", "utf8")

logLine(logPath, "Script started");

const params = {
    studentName: process.env.STUDENT_NAME ?? "",
    studentId: process.env.STUDENT_ID ?? "",
    scores: process.env.SCORES ?? "",
    examDate: process.env.EXAM_DATE ?? "",
    hasBonus: (process.env.HAS_BONUS ?? "false").toLowerCase() === "true",
    bonusPoints: Number(process.env.BONUS_POINTS ?? "0"),
    passThreshold: Number(process.env.PASS_THRESHOLD ?? "60"),
}

logLine(logPath, `Params ${JSON.stringify(params)}`)

//validation
if (params.studentName.trim().length < 2) {
    fail(logPath, "STUDENT_NAME must be at least 2 characters.")
}

if (!/^[0-9]{5,12}$/.test(params.studentId)) {
    fail(logPath, "STUDENT_ID must be 5-12 digits.")
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(params.examDate)) {
    fail(logPath, "EXAM_DATE must be in YYYY-MM-DD format.")
}
const d = new Date(params.examDate + "T00:00:00Z")
if (isNaN(d.getTime())) {
    fail(logPath, "EXAM_DATE is not a valid date.")
}
if (params.scores.trim().length === 0) {
    fail(logPath, "SCORES is required (e.g., 90,78,100).")
}

const scoresArr = parseScores(params.scores)
if (scoresArr.length < 2) {
    fail(logPath, "SCORES must contain at least 2 numbers.")
}
if (scoresArr.some(x => Number.isNaN(x))) {
    fail(logPath, "SCORES contains invalid number.")
}
if (scoresArr.some(x => x < 0 || x > 100)) {
    fail(logPath, "Each score must be between 0 and 100.")
}
if (Number.isNaN(params.bonusPoints) || params.bonusPoints < 0 || params.bonusPoints > 20) {
    fail(logPath, "BONUS_POINTS must be a number between 0 and 20.")
}
if(Number.isNaN(params.passThreshold|| params.passThreshold<0 || params.passThreshold>100)){
    fail(logPath, "PASS_THRESHOLD must be a number between 0 and 100.")
}

logLine(logPath,"Validation passed")

//comute
const s = stats(scoresArr)
let finalScore=(s.average + (params.hasBonus? params.bonusPoints : 0))
if(finalScore>100) finalScore = 100;

const status = finalScore >= params.passThreshold? "PASS" : "FAIL"

logLine(logPath, `Stats : ${JSON.stringify(s)}`)
logLine(logPath, `FinalScore = ${finalScore.toFixed(2)} Status = ${status}`);

//generate HTML (bonus: chart + table + highlights)

const reportPath = path.join(outDir, "report.html")

const scoreJson = JSON.stringify(scoresArr);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Student Grade Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    :root{
      --bg: #0b1220;
      --card: rgba(255,255,255,0.08);
      --card2: rgba(255,255,255,0.06);
      --border: rgba(255,255,255,0.12);
      --text: rgba(255,255,255,0.92);
      --muted: rgba(255,255,255,0.70);
      --muted2: rgba(255,255,255,0.55);
      --shadow: 0 18px 40px rgba(0,0,0,0.35);
      --radius: 18px;
      --pass: #22c55e;
      --fail: #ef4444;
      --warn: #f59e0b;
      --accent: #60a5fa;
      --chip: rgba(96,165,250,0.18);
    }

    *{ box-sizing: border-box; }
    body{
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", "Noto Sans", "Liberation Sans", sans-serif;
      color: var(--text);
      background:
        radial-gradient(1200px 700px at 20% 10%, rgba(96,165,250,0.28), transparent 55%),
        radial-gradient(900px 600px at 90% 30%, rgba(34,197,94,0.18), transparent 55%),
        radial-gradient(900px 600px at 40% 90%, rgba(244,114,182,0.12), transparent 55%),
        var(--bg);
      min-height: 100vh;
    }

    .container{
      max-width: 1100px;
      margin: 0 auto;
      padding: 28px 18px 60px;
    }

    header{
      display:flex;
      align-items:flex-end;
      justify-content:space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .title{
      display:flex;
      flex-direction:column;
      gap: 6px;
    }

    h1{
      margin:0;
      font-size: 28px;
      letter-spacing: 0.2px;
    }
    .subtitle{
      color: var(--muted);
      font-size: 13px;
    }

    .badge{
      display:inline-flex;
      align-items:center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow);
      white-space: nowrap;
      font-size: 13px;
      color: var(--muted);
    }
    .dot{
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: ${status === "PASS" ? "var(--pass)" : "var(--fail)"};
      box-shadow: 0 0 0 4px rgba(34,197,94,0.15);
    }
    .dot.fail{ box-shadow: 0 0 0 4px rgba(239,68,68,0.15); }

    .grid{
      display:grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 16px;
    }

    @media (max-width: 880px){
      .grid{ grid-template-columns: 1fr; }
      header{ align-items:flex-start; flex-direction:column; }
    }

    .card{
      background: linear-gradient(180deg, var(--card), var(--card2));
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }

    .card h2{
      margin: 0 0 10px;
      font-size: 16px;
      color: rgba(255,255,255,0.88);
      font-weight: 650;
      letter-spacing: 0.2px;
    }

    .kv{
      display:grid;
      grid-template-columns: 140px 1fr;
      row-gap: 10px;
      column-gap: 12px;
      margin-top: 10px;
      font-size: 14px;
    }
    .k{ color: var(--muted2); }
    .v{ color: var(--text); }

    .pill{
      display:inline-flex;
      align-items:center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.05);
      font-size: 12px;
      color: var(--muted);
    }
    .pill strong{ color: var(--text); font-weight: 650; }
    .pill.accent{ background: var(--chip); border-color: rgba(96,165,250,0.35); }
    .pill.pass{ background: rgba(34,197,94,0.16); border-color: rgba(34,197,94,0.35); }
    .pill.fail{ background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.35); }

    .score-big{
      display:flex;
      align-items:flex-end;
      justify-content:space-between;
      gap: 12px;
      margin-top: 6px;
    }
    .score-big .num{
      font-size: 44px;
      font-weight: 750;
      letter-spacing: -1px;
      line-height: 1;
    }
    .score-big .meta{
      display:flex;
      flex-direction:column;
      gap: 8px;
      align-items:flex-end;
      text-align:right;
    }

    .divider{
      height:1px;
      background: rgba(255,255,255,0.10);
      margin: 14px 0;
    }

    table{
      width:100%;
      border-collapse: collapse;
      overflow:hidden;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.10);
    }
    thead th{
      text-align:left;
      font-size: 12px;
      font-weight: 650;
      padding: 10px 12px;
      color: rgba(255,255,255,0.75);
      background: rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(255,255,255,0.10);
    }
    tbody td{
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.88);
      font-size: 13px;
    }
    tbody tr:hover td{
      background: rgba(255,255,255,0.05);
    }
    tbody tr:last-child td{ border-bottom: none; }

    .right{ text-align:right; }
    .muted{ color: var(--muted); font-size: 12px; }

    .chart-wrap{
      height: 240px;
      margin-top: 10px;
    }

    footer{
      margin-top: 16px;
      color: var(--muted2);
      font-size: 12px;
      display:flex;
      justify-content:space-between;
      gap: 10px;
      flex-wrap:wrap;
    }
    code{
      background: rgba(255,255,255,0.06);
      padding: 2px 6px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.85);
    }
  </style>
</head>

<body>
  <div class="container">
    <header>
      <div class="title">
        <h1>Student Grade Report</h1>
        <div class="subtitle">Generated: ${nowIso()}</div>
      </div>

      <div class="badge">
        <span class="dot ${status === "PASS" ? "" : "fail"}"></span>
        <span>Status: <b style="color:${status === "PASS" ? "var(--pass)" : "var(--fail)"}">${status}</b></span>
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <h2>Student Details</h2>
        <div class="kv">
          <div class="k">Name</div><div class="v">${params.studentName}</div>
          <div class="k">Student ID</div><div class="v">${params.studentId}</div>
          <div class="k">Exam Date</div><div class="v">${params.examDate}</div>
          <div class="k">Scores</div><div class="v"><span class="pill accent"><strong>${scoresArr.length}</strong> tests</span></div>
        </div>

        <div class="divider"></div>

        <h2>Results</h2>
        <div class="score-big">
          <div>
            <div class="muted">Final Score</div>
            <div class="num" style="color:${status === "PASS" ? "var(--pass)" : "var(--fail)"}">${finalScore.toFixed(2)}</div>
          </div>
          <div class="meta">
            <span class="pill">Average: <strong>${s.average.toFixed(2)}</strong></span>
            <span class="pill">Threshold: <strong>${params.passThreshold}</strong></span>
            <span class="pill ${params.hasBonus ? "pass" : ""}">
              Bonus: <strong>${params.hasBonus ? `Yes (+${params.bonusPoints})` : "No"}</strong>
            </span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="muted">
          Min: <b style="color:var(--text)">${s.min}</b> ·
          Max: <b style="color:var(--text)">${s.max}</b> ·
          Std Dev: <b style="color:var(--text)">${s.std.toFixed(2)}</b>
        </div>
      </div>

      <div class="card">
        <h2>Chart</h2>
        <div class="muted">Score trend across tests</div>
        <div class="chart-wrap">
          <canvas id="scoresChart"></canvas>
        </div>

        <div class="divider"></div>

        <h2>Scores Table</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th class="right">Score</th>
            </tr>
          </thead>
          <tbody>
            ${scoresArr.map((v, i) => `
              <tr>
                <td>Test ${i + 1}</td>
                <td class="right"><b>${v}</b></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <footer>
      <div>Artifacts: <code>output/report.html</code> · <code>output/run.log</code> · <code>output/summary.json</code></div>
      <div class="muted">CI generated via Jenkins pipeline</div>
    </footer>
  </div>

  <script>
    const scores = ${JSON.stringify(scoresArr)};
    const labels = scores.map((_, i) => "Test " + (i + 1));
    const ctx = document.getElementById("scoresChart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Scores",
          data: scores,
          tension: 0.35,
          fill: true,
          borderWidth: 2,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "rgba(255,255,255,0.75)" } }
        },
        scales: {
          x: { ticks: { color: "rgba(255,255,255,0.65)" }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: { min: 0, max: 100, ticks: { color: "rgba(255,255,255,0.65)" }, grid: { color: "rgba(255,255,255,0.06)" } }
        }
      }
    });
  </script>
</body>
</html>`;

fs.writeFileSync(reportPath, html, "utf8")
logLine(logPath,`Wrote HTML report: ${reportPath}` )

logLine(logPath, "Script finished successfully")
console.log(`OK: report generated at ${reportPath}`);


const summary = {
    students: 1,
    scoresCount : scoresArr.length,
    average: s.average,
    min: Math.min(...scoresArr.map(s => s.grade)),
    max: Math.max(...scoresArr.map(s => s.grade)),
    finalScore: Number(finalScore.toFixed(2)),
    status: status,
    examDate: params.examDate,
    passThreshold: params.passThreshold,
    bonusApplied: params.hasBonus,
    bonusPoints: params.hasBonus ? params.bonusPoints: 0
  };
  
 
  
  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf-8"
  );

  logLine(logPath, `Wrote summery JSON : ${path.join(outDir, "summery.json")}`)
  
  console.log("Summary:" ,summary);
 