# Student Grades Processing System – DevOps Final Project

## Overview
This project demonstrates a complete DevOps CI pipeline using Jenkins, GitHub, and a Node.js script.

The pipeline runs on a Jenkins Master / Agent architecture, receives runtime parameters, validates input, executes a processing script, generates reports, and archives build artifacts automatically.

---

## Project Description
The system processes student exam grades by receiving student details and scores, validating the input, calculating results, and generating structured output files.

All processing is executed automatically through Jenkins as part of a Continuous Integration workflow.

---

## What the System Does
The application performs the following steps:
- Receives student details and exam scores as parameters
- Validates all inputs (types, formats, ranges)
- Calculates:
  - Average score
  - Minimum and maximum grades
  - Pass / fail result based on a defined threshold
- Applies bonus points when enabled
- Generates output reports and logs

---

## Input Parameters (Jenkins)
The system receives the following parameters from Jenkins:
- `STUDENT_NAME` – Student full name
- `STUDENT_ID` – Numeric student ID
- `SCORES` – Comma-separated list of grades
- `EXAM_DATE` – Exam date (YYYY-MM-DD)
- `PASS_THRESHOLD` – Minimum passing grade
- `HAS_BONUS` – Enable bonus points (true / false)
- `BONUS_POINTS` – Bonus points value

---

## Output Files
After execution, the system generates the following files:
- `output/report.html` – HTML report with student details, scores, and charts
- `output/summary.json` – Statistical summary of grades
- `output/run.log` – Execution log with timestamps and steps

These files are archived automatically as Jenkins build artifacts.

---

## Jenkins Pipeline Stages
The Jenkins pipeline consists of the following stages:
1. **Checkout** – Pulls the source code from GitHub
2. **Run Script** – Executes the Node.js script on the selected agent
3. **Validation** – Ensures all parameters are valid
4. **Generate Reports** – Creates HTML and JSON output files
5. **Archive Artifacts** – Saves output files and logs

---

## Repository Structure
├── app.js
├── Jenkinsfile
├── package.json
├── README.md
├── output/
│ ├── report.html
│ ├── summary.json
│ └── run.log
└── screenshots/

---

## Screenshots
All required screenshots are available in the `screenshots/` directory, including:
- Jenkins job configuration
- Parameter input screen
- Successful pipeline execution
- Console output
- Generated HTML report
- Archived artifacts
- GitHub repository
- Jenkins Master / Agent configuration

---

## Technologies Used
- Node.js
- Jenkins (Master / Agent)
- GitHub
- Linux (WSL)
- ngrok

---

## Conclusion
This project demonstrates the implementation of a full CI pipeline with parameterized execution, validation, artifact generation, and automation.

During the project, challenges such as SSH agent configuration, cross-platform execution, and secure external access using ngrok were addressed and resolved.

---

## Author
Yael
