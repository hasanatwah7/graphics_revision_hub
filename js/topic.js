/**
 * topic.js — Topic Detail Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const topicId = getParam('id');
  if (!topicId) {
    window.location.href = 'topics.html';
    return;
  }

  // Load topics database
  const topics = await loadData('topics.json');
  if (!topics) return;

  const topic = topics.find(t => t.id === topicId);
  if (!topic) {
    alert('Topic not found!');
    window.location.href = 'topics.html';
    return;
  }

  // Load progress
  const progress = getProgress();
  markTopicViewed(topicId); // Auto mark viewed on page open

  // Metadata mappings
  const METADATA = {
    intro_systems: { tier: 'A', class: 'tier-a' },
    color_theory: { tier: 'A', class: 'tier-a' },
    transformations: { tier: 'A', class: 'tier-a' },
    rasterization: { tier: 'B', class: 'tier-b' },
    region_filling: { tier: 'C', class: 'tier-c' },
    image_enhancement: { tier: 'B', class: 'tier-b' },
    frequency_domain: { tier: 'B', class: 'tier-b' },
    ar_vr: { tier: 'A', class: 'tier-a' },
    computer_vision: { tier: 'C', class: 'tier-c' }
  };

  const meta = METADATA[topicId] || { tier: 'B', class: 'tier-b' };

  // Set Page Title and Tier Info
  document.getElementById('topic-title').textContent = topic.title;
  const tierBadge = document.getElementById('topic-tier');
  tierBadge.textContent = `Tier ${meta.tier}`;
  tierBadge.className = `badge-tier mb-2 d-inline-block ${meta.class}`;

  // 1. Mark Studied Button
  const studiedBtn = document.getElementById('studied-btn');
  function updateStudiedButton() {
    const currentProgress = getProgress();
    const isTopicStudied = currentProgress.topics[topicId] && currentProgress.topics[topicId].viewed;
    if (isTopicStudied) {
      studiedBtn.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> Topic Studied';
      studiedBtn.className = 'btn btn-success px-4 py-2';
    } else {
      studiedBtn.innerHTML = '<i class="bi bi-bookmark-plus"></i> Mark as Studied';
      studiedBtn.className = 'btn btn-outline-success px-4 py-2';
    }
  }
  updateStudiedButton();

  studiedBtn.addEventListener('click', () => {
    const currentProgress = getProgress();
    if (!currentProgress.topics[topicId]) {
      currentProgress.topics[topicId] = { viewed: true, masteredConcepts: [], questionsCorrect: 0, questionsTotal: 0 };
    } else {
      currentProgress.topics[topicId].viewed = !currentProgress.topics[topicId].viewed;
    }
    saveProgress(currentProgress);
    updateStudiedButton();
  });

  // 2. Render Concepts Checklist
  const conceptsListContainer = document.getElementById('concepts-list');
  conceptsListContainer.innerHTML = '';
  
  // Load mastered concepts
  let masteredConcepts = [];
  if (progress.topics[topicId] && progress.topics[topicId].masteredConcepts) {
    masteredConcepts = progress.topics[topicId].masteredConcepts;
  }

  topic.concepts.forEach((concept, index) => {
    const isMastered = masteredConcepts.includes(concept.name);
    const checkedClass = isMastered ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted';
    const textStrikethrough = isMastered ? 'text-decoration-line-through text-muted' : '';

    const conceptHTML = `
      <div class="d-flex align-items-start gap-3 p-2 rounded hover-bg-glass" style="transition: all 0.2s;">
        <span class="fs-5 cursor-pointer concept-toggle-btn" data-index="${index}" style="cursor: pointer;">
          <i class="bi ${checkedClass}"></i>
        </span>
        <div>
          <h5 class="h6 mb-1 ${textStrikethrough}">${concept.name}</h5>
          <p class="text-muted small mb-0">${concept.description}</p>
        </div>
      </div>
    `;
    conceptsListContainer.insertAdjacentHTML('beforeend', conceptHTML);
  });

  // Concept click handler
  conceptsListContainer.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.concept-toggle-btn');
    if (!toggleBtn) return;

    const index = parseInt(toggleBtn.getAttribute('data-index'));
    const conceptName = topic.concepts[index].name;

    const currentProgress = getProgress();
    if (!currentProgress.topics[topicId]) {
      currentProgress.topics[topicId] = { viewed: true, masteredConcepts: [], questionsCorrect: 0, questionsTotal: 0 };
    }
    let mastered = currentProgress.topics[topicId].masteredConcepts || [];

    if (mastered.includes(conceptName)) {
      mastered = mastered.filter(name => name !== conceptName);
    } else {
      mastered.push(conceptName);
    }

    currentProgress.topics[topicId].masteredConcepts = mastered;
    saveProgress(currentProgress);

    // Refresh concepts render
    location.reload();
  });

  // 3. Render Formulas & Cheatsheet
  const formulasContainer = document.getElementById('formulas-content');
  formulasContainer.innerHTML = '';
  
  // Try to find concepts that resemble formulas or extract formula details
  const mathConcepts = topic.concepts.filter(c => 
    c.name.toLowerCase().includes('formula') || 
    c.description.toLowerCase().includes('formula') ||
    c.description.includes('=') ||
    c.description.includes('matrix') ||
    c.description.includes('R(θ)')
  );

  if (mathConcepts.length > 0) {
    let formulasHTML = '<div class="d-flex flex-column gap-3">';
    mathConcepts.forEach(c => {
      formulasHTML += `
        <div class="p-3 rounded" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
          <strong class="text-info">${c.name}</strong>
          <div class="mt-2 text-muted small">
            <code>${c.description}</code>
          </div>
        </div>
      `;
    });
    formulasHTML += '</div>';
    formulasContainer.innerHTML = formulasHTML;
  } else {
    formulasContainer.innerHTML = '<p class="text-muted small">No explicit mathematical formulas for this conceptual topic.</p>';
  }

  // 4. Render High-Yield Tips
  const highYieldContainer = document.getElementById('high-yield-list');
  highYieldContainer.innerHTML = '';
  if (topic.high_yield_notes && topic.high_yield_notes.length > 0) {
    topic.high_yield_notes.forEach(note => {
      highYieldContainer.insertAdjacentHTML('beforeend', `<li class="mb-2 small">${note}</li>`);
    });
  } else {
    document.getElementById('high-yield-panel').style.display = 'none';
  }

  // 5. Render Practice Questions
  const questionsContainer = document.getElementById('questions-list');
  const practiceProgress = document.getElementById('practice-progress');
  questionsContainer.innerHTML = '';

  const totalQs = topic.questions.length;
  let correctCount = progress.topics[topicId]?.questionsCorrect || 0;
  practiceProgress.textContent = `${correctCount} / ${totalQs} Solved`;

  topic.questions.forEach((q, index) => {
    const questionId = `${topicId}_q${index}`;
    const mistakeProgress = getProgress();
    const isMistake = mistakeProgress.mistakes.some(m => m.id === questionId);

    const qHTML = `
      <div class="qa-card mb-3" id="q-card-${index}">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
          <span class="badge bg-secondary-subtle text-info">Question ${index + 1}</span>
          <button class="btn btn-sm text-warning flag-btn p-0" data-index="${index}">
            <i class="bi ${isMistake ? 'bi-flag-fill' : 'bi-flag'}"></i>
          </button>
        </div>
        <h5 class="h6 mb-3">${q.question}</h5>
        
        <button class="reveal-btn btn-sm mt-1 show-answer-btn" data-index="${index}">
          Reveal Answer
        </button>

        <div class="answer-panel d-none mt-3" id="answer-panel-${index}">
          <p class="mb-2 small text-light"><strong>Answer:</strong> ${q.answer}</p>
          ${q.explanation ? `<p class="text-muted small mb-3"><strong>Explanation:</strong> ${q.explanation}</p>` : ''}
          
          <div class="d-flex gap-2">
            <button class="btn btn-success feedback-btn correct-btn" data-index="${index}">
              <i class="bi bi-hand-thumbs-up"></i> Got it Correct
            </button>
            <button class="btn btn-danger feedback-btn mistake-btn" data-index="${index}">
              <i class="bi bi-exclamation-triangle"></i> Made a Mistake
            </button>
          </div>
        </div>
      </div>
    `;
    questionsContainer.insertAdjacentHTML('beforeend', qHTML);
  });

  // Click handlers for practice questions
  questionsContainer.addEventListener('click', (e) => {
    const revealBtn = e.target.closest('.show-answer-btn');
    const correctBtn = e.target.closest('.correct-btn');
    const mistakeBtn = e.target.closest('.mistake-btn');
    const flagBtn = e.target.closest('.flag-btn');

    if (revealBtn) {
      const idx = revealBtn.getAttribute('data-index');
      const panel = document.getElementById(`answer-panel-${idx}`);
      panel.classList.toggle('d-none');
      revealBtn.textContent = panel.classList.contains('d-none') ? 'Reveal Answer' : 'Hide Answer';
    }

    if (correctBtn) {
      const idx = parseInt(correctBtn.getAttribute('data-index'));
      const questionId = `${topicId}_q${idx}`;
      
      // Update correct counts in localstorage
      const currentProgress = getProgress();
      if (!currentProgress.topics[topicId]) {
        currentProgress.topics[topicId] = { viewed: true, masteredConcepts: [], questionsCorrect: 0, questionsTotal: totalQs };
      }
      
      // Remove from mistakes if it was there
      currentProgress.mistakes = currentProgress.mistakes.filter(m => m.id !== questionId);
      
      // Safety cap check and update correct count
      let currentCorrect = currentProgress.topics[topicId].questionsCorrect || 0;
      if (currentCorrect < totalQs) {
        currentProgress.topics[topicId].questionsCorrect = currentCorrect + 1;
      }
      
      saveProgress(currentProgress);
      alert('Well done! Question marked as mastered.');
      location.reload();
    }

    if (mistakeBtn) {
      const idx = parseInt(mistakeBtn.getAttribute('data-index'));
      const q = topic.questions[idx];
      const questionId = `${topicId}_q${idx}`;

      recordMistake({
        id: questionId,
        type: 'topic',
        source: topic.title,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation || ''
      });

      alert('Question added to your Mistakes Review list!');
      location.reload();
    }

    if (flagBtn) {
      const idx = parseInt(flagBtn.getAttribute('data-index'));
      const q = topic.questions[idx];
      const questionId = `${topicId}_q${idx}`;
      
      const currentProgress = getProgress();
      const isAlreadyMistake = currentProgress.mistakes.some(m => m.id === questionId);

      if (isAlreadyMistake) {
        removeMistake(questionId);
        alert('Question unflagged.');
      } else {
        recordMistake({
          id: questionId,
          type: 'topic',
          source: topic.title,
          question: q.question,
          answer: q.answer,
          explanation: q.explanation || ''
        });
        alert('Question flagged and added to mistakes list.');
      }
      location.reload();
    }
  });

});
