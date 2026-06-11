/**
 * home.js — Home Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const progress = getProgress();

  // 1. Calculate stats
  // Topics: count how many topics have been viewed
  const totalTopics = 10;
  let viewedTopicsCount = 0;
  if (progress.topics) {
    viewedTopicsCount = Object.values(progress.topics).filter(t => t.viewed).length;
  }

  const exams = await loadData('exams.json');
  const totalExams = exams ? exams.length : 5;

  // Exams: count how many exams have been solved
  let solvedExamsCount = 0;
  if (progress.exams) {
    solvedExamsCount = Object.keys(progress.exams).length;
  }

  // Mistakes: count active mistakes
  const mistakesCount = progress.mistakes ? progress.mistakes.length : 0;

  // Mock exam: high score
  let mockScoreText = '—';
  if (progress.mock_exam) {
    const pct = Math.round((progress.mock_exam.score / progress.mock_exam.total) * 100);
    mockScoreText = `${progress.mock_exam.score}/${progress.mock_exam.total} (${pct}%)`;
  }

  // Update DOM stats
  document.getElementById('stat-topics').textContent = `${viewedTopicsCount} / ${totalTopics}`;
  document.getElementById('stat-exams').textContent = `${solvedExamsCount} / ${totalExams}`;
  document.getElementById('stat-mistakes').textContent = mistakesCount;
  document.getElementById('stat-mock').textContent = mockScoreText;

  // 2. Calculate Readiness Percentage
  // Formula:
  // - Topics viewed: 5% each (max 50%)
  // - Exams solved: 15% each (max 45%)
  // - Mock exam completed: 5% (max 5%)
  // Total = 100%
  let readiness = 0;
  readiness += viewedTopicsCount * 5;
  readiness += solvedExamsCount * 15;
  if (progress.mock_exam) {
    readiness += 5;
  }

  // Clamp readiness to 100%
  readiness = Math.min(readiness, 100);

  // Update circular progress ring
  const circle = document.getElementById('readiness-circle');
  const percentText = document.getElementById('readiness-percent');
  const feedbackText = document.getElementById('readiness-feedback');

  if (circle && percentText) {
    // 502.6 is the circumference for r=80 (2 * pi * 80 = 502.65)
    const circumference = 502.6;
    const offset = circumference - (readiness / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    percentText.textContent = `${readiness}%`;

    // Dynamic feedback messages
    if (readiness === 0) {
      feedbackText.textContent = "Welcome! Tap 'Start Studying' below to kick off your revision.";
    } else if (readiness < 30) {
      feedbackText.textContent = "Nice start! Read through a few chapters in the Topics tab.";
    } else if (readiness < 60) {
      feedbackText.textContent = "You're making solid progress! Try solving the 2023 or 2024 Past Exam.";
    } else if (readiness < 90) {
      feedbackText.textContent = "Looking great! Run a Mock Exam to test your limits under time pressure.";
    } else {
      feedbackText.textContent = "Outstanding readiness! Review your remaining mistakes and you're fully set!";
    }
  }
});
