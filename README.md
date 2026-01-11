# Student Grades Processing System – DevOps Project

## Project Description
This project is a student grades processing system designed to receive student data and exam scores, validate the input, calculate results, and generate summary reports.

The system is executed automatically through a CI pipeline and produces structured outputs that represent the final results of the processing.

---

## What the System Does
The application performs the following steps:
- Receives student details and exam scores as input
- Validates that all inputs are in a correct format
- Calculates:
  - Average score
  - Minimum and maximum grades
  - Pass / fail result based on a defined threshold
- Applies bonus points when enabled
- Generates output reports and logs

---

## Input Data
The system receives the following inputs:
- Student name
- Student ID
- List of exam scores (comma-separated)
- Exam date
- Passing grade threshold
- Optional bonus points

---

## Output Files
After execution, the system generates the following files:
- `output/report.html` – A human-readable HTML report with student details and grades
- `output/summary.json` – A statistical summary of the processed grades
- `output/run.log` – Execution log file

These files are saved as build artifacts.

---

## Example Use Case
The system can be used to automatically process exam results for a student, calculate final outcomes, and generate downloadable reports without manual intervention.

---

## Technologies Used
- Node.js
- Jenkins
- GitHub
- Linux (WSL)
- ngrok

---

## Author
Yael
