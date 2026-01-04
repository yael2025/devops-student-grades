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
    const avg = sum / n
    const variance = arr.reduce((a, x) => a + Math.pow(x - avg, 2), 0) / n
    const std = Math.sqrt(variance)
    return { n, min, max, sum, avg, std }
}

//red parameters from env (Jenkins-friendly)
const outDir = path.join(process.cwd(), "outpot")
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
let finalScore=(s.avg + (params.hasBonus? params.bonusPoints : 0))
if(finalScore>100) finalScore = 100;

const status = finalScore >= params.passThreshold? "PASS" : "FAIL"

logLine(logPath, `Stats : ${JSON.stringify(s)}`)
logLine(logPath, `FinalScore = ${finalScore.toFixed(2)} Status = ${status}`);

//generate HTML (bonus: chart + table + highlights)

const reportPath = path.join(outDir, "report.html")

const scoreJson = JSON.stringify(scoresArr);

const html = `<!doctype html>
<html lang = "en">
<head>
<meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Student Grade Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
  body { font-family: Arial, sans-serif; margin: 24px; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .status-pass { color: #0a7a0a; font-weight: bold; }
    .status-fail { color: #b00020; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; }
    th { background: #f5f5f5; text-align: left; }
    .small { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Student Grade Report</h1>
  <p class="small">Generated: ${nowIso()}</p> 
  
  <div class="card">
    <h2>Student</h2>
    <p><b>Name:</b> ${params.studentName}</p>
    <p><b>ID:</b> ${params.studentId}</p>
    <p><b>Exam Date:</b> ${params.examDate}</p>
  </div>
  
  <div class="card">
    <h2>Result</h2>
    <p><b>Average:</b> ${s.avg.toFixed(2)}</p>
    <p><b>Bonus Applied:</b> ${params.hasBonus ? "Yes" : "No"} (${params.hasBonus ? params.bonusPoints : 0})</p>
    <p><b>Final Score:</b> ${finalScore.toFixed(2)}</p>
    <p><b>Threshold:</b> ${params.passThreshold}</p>
    <p><b>Status:</b> <span class="${status === "PASS" ? "status-pass" : "status-fail"}">${status}</span></p>
  </div>
  
  <div class="card">
    <h2>Scores</h2>
    <table>
      <thead><tr><th>#</th><th>Score</th></tr></thead>
      <tbody>
        ${scoresArr.map((v, i) => `<tr><td>${i + 1}</td><td>${v}</td></tr>`).join("")}
      </tbody>
    </table>
    <p class="small">Min: ${s.min} | Max: ${s.max} | Std Dev: ${s.std.toFixed(2)}</p>
  </div>

  <div class="card">
    <h2>Chart (Bonus)</h2>
    <canvas id="scoresChart" height="90"></canvas>
  </div>

  <script>
    const scores = ${scoresJson};
    const labels = scores.map((_, i) => "Test " + (i+1));
    const ctx = document.getElementById("scoresChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Scores",
          data: scores,
          tension: 0.3
        }]
      },
      options: {
        scales: { y: { min: 0, max: 100 } }
      }
    });
  </script>
  
 </body>
</html>`;

fs.writeFileSync(reportPath, html, "utf8")
logLine(logPath,`Wrote HTML report: ${reportPath}` )

logLine(logPath, "Script finished successfully")
console.log(`OK: report generated at ${reportPath}`);
