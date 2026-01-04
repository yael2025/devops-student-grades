pipeline {
  agent none

  parameters {
    choice(name: 'RUN_ON', choices: ['master', 'agent'], description: 'Where to run the script')
    string(name: 'STUDENT_NAME', defaultValue: 'Yael', description: 'Student name')
    string(name: 'STUDENT_ID', defaultValue: '12345', description: '5-12 digits')
    string(name: 'SCORES', defaultValue: '90,78,100,65', description: 'Comma-separated scores (0-100)')
    string(name: 'EXAM_DATE', defaultValue: '2026-01-04', description: 'YYYY-MM-DD')
    booleanParam(name: 'HAS_BONUS', defaultValue: true, description: 'Apply bonus?')
    string(name: 'BONUS_POINTS', defaultValue: '5', description: '0-20')
    string(name: 'PASS_THRESHOLD', defaultValue: '60', description: '0-100')
  }

  stages {
    stage('Checkout') {
      agent any
      steps {
        checkout scm
      }
    }

    stage('Run on selected node') {
      agent { label "${params.RUN_ON == 'agent' ? 'agent' : 'built-in'}" }

      environment {
        STUDENT_NAME = "${params.STUDENT_NAME}"
        STUDENT_ID = "${params.STUDENT_ID}"
        SCORES = "${params.SCORES}"
        EXAM_DATE = "${params.EXAM_DATE}"
        HAS_BONUS = "${params.HAS_BONUS}"
        BONUS_POINTS = "${params.BONUS_POINTS}"
        PASS_THRESHOLD = "${params.PASS_THRESHOLD}"
      }

      steps {
        sh 'node -v && npm -v'
        sh 'node app.js'
      }

      post {
        always {
          archiveArtifacts artifacts: 'output/report.html, output/run.log', fingerprint: true
        }
      }
    }
  }
}
