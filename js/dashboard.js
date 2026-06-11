/**
 * dashboard.js — Analytics and Metrics Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load databases
  const topics = await loadData('topics.json');
  const exams = await loadData('exams.json');

  if (!topics || !exams) return;

  const progress = getProgress();

  // 1. Calculate General Stats
  const totalTopics = topics.length;
  let viewedTopicsCount = 0;
  let totalConcepts = 0;
  let masteredConceptsCount = 0;

  topics.forEach(t => {
    const totalC = t.concepts.length;
    totalConcepts += totalC;

    const topicProgress = progress.topics[t.id];
    if (topicProgress) {
      if (topicProgress.viewed) viewedTopicsCount++;
      if (topicProgress.masteredConcepts) {
        masteredConceptsCount += topicProgress.masteredConcepts.length;
      }
    }
  });

  const totalExams = exams.length;
  let solvedExamsCount = 0;
  if (progress.exams) {
    solvedExamsCount = Object.keys(progress.exams).length;
  }

  let mockScoreText = '—';
  if (progress.mock_exam) {
    const pct = Math.round((progress.mock_exam.score / progress.mock_exam.total) * 100);
    mockScoreText = `${progress.mock_exam.score}/${progress.mock_exam.total} (${pct}%)`;
  }

  // 2. Update Stats Displays
  document.getElementById('dash-topics-read').textContent = `${viewedTopicsCount} / ${totalTopics}`;
  document.getElementById('dash-concepts-mastered').textContent = `${masteredConceptsCount} / ${totalConcepts}`;
  document.getElementById('dash-exams-solved').textContent = `${solvedExamsCount} / ${totalExams}`;
  document.getElementById('dash-mock-score').textContent = mockScoreText;

  // 3. Readiness Calculation
  let readiness = 0;
  readiness += viewedTopicsCount * 5; // max 45% (if 9 topics)
  readiness += solvedExamsCount * 15; // max 45% (if 3 exams)
  if (progress.mock_exam) {
    readiness += 5; // 5%
  }
  // Cap at 100
  readiness = Math.min(readiness, 100);

  document.getElementById('dash-readiness-percent').textContent = `${readiness}%`;
  const readinessBar = document.getElementById('dash-readiness-bar');
  readinessBar.style.width = `${readiness}%`;
  readinessBar.setAttribute('aria-valuenow', readiness);

  const feedbackText = document.getElementById('dash-readiness-feedback');
  if (readiness === 0) {
    feedbackText.textContent = "Jump into the Topics section to get started.";
  } else if (readiness < 40) {
    feedbackText.textContent = "Revision is underway! Review more chapters.";
  } else if (readiness < 75) {
    feedbackText.textContent = "Great job! Solve past papers to sharpen your speed.";
  } else {
    feedbackText.textContent = "Excellent preparation! Clean up mistakes to guarantee an A+.";
  }

  // 4. Render Chapter Concept Mastery Bars
  const masteryContainer = document.getElementById('chapters-mastery-list');
  masteryContainer.innerHTML = '';

  topics.forEach(t => {
    const totalC = t.concepts.length;
    const masteredList = (progress.topics[t.id] && progress.topics[t.id].masteredConcepts) || [];
    const masteredC = masteredList.length;
    const pct = totalC > 0 ? Math.round((masteredC / totalC) * 100) : 0;

    let barColor = 'bg-info';
    if (pct >= 80) barColor = 'bg-success';
    else if (pct >= 40) barColor = 'bg-warning';
    else barColor = 'bg-danger';

    const itemHTML = `
      <div>
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="text-white small fw-bold">${t.title}</span>
          <span class="text-muted small">${masteredC} / ${totalC} Mastered (${pct}%)</span>
        </div>
        <div class="progress" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px;">
          <div class="progress-bar ${barColor}" role="progressbar" style="width: ${pct}%; border-radius: 3px;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
    masteryContainer.insertAdjacentHTML('beforeend', itemHTML);
  });

  // 5. Render Past Exam History
  const historyContainer = document.getElementById('exams-history-list');
  historyContainer.innerHTML = '';

  exams.forEach(exam => {
    const year = exam.year;
    const attempt = progress.exams && progress.exams[year];
    const totalQ = exam.questions.length;

    let displayHTML = '';
    if (attempt) {
      const pct = Math.round((attempt.score / attempt.total) * 100);
      displayHTML = `
        <div class="p-3 rounded mb-2" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(16, 185, 129, 0.15);">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <strong class="text-white">${year} Final Exam</strong>
            <span class="text-success fw-bold">${pct}%</span>
          </div>
          <span class="text-muted small">Score: ${attempt.score} / ${attempt.total} | Date: ${attempt.date}</span>
        </div>
      `;
    } else {
      displayHTML = `
        <div class="p-3 rounded mb-2" style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05);">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <strong class="text-muted">${year} Final Exam</strong>
            <span class="text-muted small">Not Attempted</span>
          </div>
          <a href="exam.html?year=${year}" class="btn btn-sm btn-outline-primary mt-2 py-1">Solve Now</a>
        </div>
      `;
    }
    historyContainer.insertAdjacentHTML('beforeend', displayHTML);
  });

  // 6. Dynamic Study Recommendations
  const recContainer = document.getElementById('recommendations-list');
  recContainer.innerHTML = '';

  const recommendations = [];

  // Check Tier A topics not viewed
  const tierAtopics = ['intro_systems', 'color_theory', 'transformations', 'ar_vr'];
  tierAtopics.forEach(id => {
    const t = topics.find(topic => topic.id === id);
    const viewed = progress.topics[id] && progress.topics[id].viewed;
    if (t && !viewed) {
      recommendations.push(`Study High-Yield Tier A topic: <strong>${t.title}</strong>.`);
    }
  });

  // Check unattempted exams
  exams.forEach(exam => {
    const attempted = progress.exams && progress.exams[exam.year];
    if (!attempted) {
      recommendations.push(`Attempt the <strong>${exam.year} Final Exam</strong> paper.`);
    }
  });

  // Check active mistakes
  const mistakesCount = progress.mistakes ? progress.mistakes.length : 0;
  if (mistakesCount > 0) {
    recommendations.push(`Clear the <strong>${mistakesCount} mistakes</strong> saved in your mistakes list.`);
  }

  // Fallback if everything is done
  if (recommendations.length === 0) {
    recommendations.push("You have studied all topics and completed all exams! Excellent work.");
  }

  recommendations.slice(0, 4).forEach(rec => {
    recContainer.insertAdjacentHTML('beforeend', `<li class="mb-2">${rec}</li>`);
  });

  // 7. Reset Progress Button
  const resetBtn = document.getElementById('reset-progress-btn');
  resetBtn.addEventListener('click', () => {
    const conf = confirm("Are you sure you want to delete all revision progress, scores, and saved mistakes? This action is permanent.");
    if (conf) {
      localStorage.removeItem('cg_progress_v1');
      alert("All progress has been reset.");
      location.reload();
    }
  });

});
