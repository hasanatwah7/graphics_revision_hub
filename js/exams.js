/**
 * exams.js — Lists past exams
 */

document.addEventListener('DOMContentLoaded', async () => {
  const examsGrid = document.getElementById('exams-grid');
  if (!examsGrid) return;

  // Load exams database
  const exams = await loadData('exams.json');
  if (!exams) return;

  const progress = getProgress();
  examsGrid.innerHTML = ''; // Clear spinner

  exams.forEach(exam => {
    const year = exam.year;
    const qCount = exam.questions.length;
    
    // Check if attempted in progress
    const attempt = progress.exams && progress.exams[year];
    const isAttempted = !!attempt;

    let scoreHTML = '';
    let statusBadge = '<span class="badge bg-secondary-subtle text-muted border border-secondary-subtle">Unsolved</span>';
    let btnText = 'Solve Exam';
    let btnClass = 'btn-outline-primary';

    if (isAttempted) {
      const pct = Math.round((attempt.score / attempt.total) * 100);
      statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle">Completed</span>';
      btnText = 'Retake Exam';
      btnClass = 'btn-outline-success';
      
      scoreHTML = `
        <div class="mt-3">
          <div class="d-flex justify-content-between small text-muted mb-1">
            <span>Score: <strong>${attempt.score}/${attempt.total}</strong></span>
            <span>${pct}%</span>
          </div>
          <div class="progress" style="height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px;">
            <div class="progress-bar bg-success" role="progressbar" style="width: ${pct}%; border-radius: 3px;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <span class="small text-muted d-block mt-1" style="font-size: 0.75rem;">Last Attempt: ${attempt.date}</span>
        </div>
      `;
    }

    const cardHTML = `
      <div class="col-md-6 col-lg-4">
        <div class="panel-glass panel-glass-hover p-4 d-flex flex-column h-100">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h3 class="h4 mb-0 text-white">${year} Final Exam</h3>
            ${statusBadge}
          </div>
          <p class="text-muted small flex-grow-1">
            Official final exam from ${year}. Covers ${qCount} multiple choice questions spanning all syllabus sections.
          </p>
          <div class="text-muted small mb-3">
            <i class="bi bi-patch-question text-info"></i> ${qCount} Multiple Choice Questions
          </div>
          ${scoreHTML}
          <div class="mt-4">
            <a href="exam.html?year=${year}" class="btn btn-sm ${btnClass} w-100 py-2">
              ${btnText} <i class="bi bi-chevron-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>
    `;
    examsGrid.insertAdjacentHTML('beforeend', cardHTML);
  });
});
