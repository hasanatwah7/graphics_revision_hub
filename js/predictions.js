/**
 * predictions.js — Logic for Exam Predictions
 */

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('predictions-container');
  if (!container) return;

  // Load predictions
  const predictions = await loadData('predictions.json');
  if (!predictions) return;

  let activeFilter = 'all';

  function getConfidenceBadgeClass(confidence) {
    switch (confidence) {
      case 'High': return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Medium': return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'Low': return 'bg-info-subtle text-info border border-info-subtle';
      default: return 'bg-secondary-subtle text-muted';
    }
  }

  function renderPredictions() {
    container.innerHTML = '';

    const filtered = activeFilter === 'all' 
      ? predictions 
      : predictions.filter(p => p.confidence === activeFilter);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <p class="text-muted">No predicted questions found for this category.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((p, idx) => {
      const badgeClass = getConfidenceBadgeClass(p.confidence);
      
      const cardHTML = `
        <div class="col-md-6">
          <div class="panel-glass p-4 h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge ${badgeClass} text-uppercase px-2.5 py-1.5 fs-7">${p.confidence} Confidence</span>
              <span class="text-muted small fw-bold">${p.title}</span>
            </div>
            
            <h5 class="h6 mb-4 flex-grow-1" style="line-height: 1.6;">${p.question}</h5>
            
            <button class="reveal-btn btn-sm w-100 reveal-pred-btn" data-index="${idx}">
              Reveal Answer
            </button>

            <div class="answer-panel d-none mt-3" id="pred-answer-${idx}">
              <p class="mb-2 small text-light"><strong>Answer:</strong></p>
              <pre class="mb-3" style="font-size: 0.85rem; white-space: pre-wrap;">${p.answer}</pre>
              <p class="text-muted small mb-0"><strong>Why this is predicted:</strong> ${p.explanation}</p>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  // Set up filter click events
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Toggle active states
      filterBtns.forEach(b => {
        b.classList.remove('active-filter', 'btn-info', 'btn-danger', 'btn-warning');
        b.classList.add('btn-outline-secondary');
        // Reset color specific outlines
        const conf = b.getAttribute('data-confidence');
        if (conf === 'High') b.className = 'btn btn-sm btn-outline-danger filter-btn';
        if (conf === 'Medium') b.className = 'btn btn-sm btn-outline-warning filter-btn';
        if (conf === 'Low') b.className = 'btn btn-sm btn-outline-info filter-btn';
        if (conf === 'all') b.className = 'btn btn-sm btn-outline-info filter-btn';
      });

      const target = e.currentTarget;
      const confidence = target.getAttribute('data-confidence');
      
      // Update active style
      target.classList.remove('btn-outline-danger', 'btn-outline-warning', 'btn-outline-info', 'btn-outline-secondary');
      if (confidence === 'High') target.classList.add('btn-danger', 'text-white');
      else if (confidence === 'Medium') target.classList.add('btn-warning');
      else target.classList.add('btn-info');

      activeFilter = confidence;
      renderPredictions();
    });
  });

  // Toggle reveal answer buttons
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.reveal-pred-btn');
    if (!btn) return;

    const idx = btn.getAttribute('data-index');
    const panel = document.getElementById(`pred-answer-${idx}`);
    panel.classList.toggle('d-none');
    btn.textContent = panel.classList.contains('d-none') ? 'Reveal Answer' : 'Hide Answer';
  });

  // Init render
  renderPredictions();
});
