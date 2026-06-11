/**
 * topics.js — List all topics
 */

// Define topic icon mapping and tier mapping
const TOPIC_METADATA = {
  intro_systems: {
    icon: 'bi-display',
    tier: 'A',
    tierClass: 'tier-a',
    desc: 'Core tasks, graphics pipeline components, frames, raster vs vector systems.'
  },
  color_theory: {
    icon: 'bi-palette',
    tier: 'A',
    tierClass: 'tier-a',
    desc: 'Additive (RGB) and subtractive (CMY) models, HSL/HSV, YIQ, gamma, LUT, and quantization.'
  },
  transformations: {
    icon: 'bi-grid-3x3-gap',
    tier: 'A',
    tierClass: 'tier-a',
    desc: 'Translation, scaling, rotation, reflection, shear, homogeneous coords, composite multiplication.'
  },
  rasterization: {
    icon: 'bi-vector-pen',
    tier: 'B',
    tierClass: 'tier-b',
    desc: 'Scan conversion algorithms: DDA, Bresenham line, midpoint circle drawing and symmetry.'
  },
  region_filling: {
    icon: 'bi-paint-bucket',
    tier: 'C',
    tierClass: 'tier-c',
    desc: 'Boundary fill, flood fill, 4 vs 8 connectivity pixel leakage, and recursion overflows.'
  },
  image_enhancement: {
    icon: 'bi-magic',
    tier: 'B',
    tierClass: 'tier-b',
    desc: 'Spatial domain: Contrast stretching, histogram equalization, gamma mapping, and spatial filters.'
  },
  frequency_domain: {
    icon: 'bi-waves',
    tier: 'B',
    tierClass: 'tier-b',
    desc: 'Frequency domain: 2D DFT, low-pass, high-pass filters, convolution theorem, and Gibbs ringing.'
  },
  ar_vr: {
    icon: 'bi-vr',
    tier: 'A',
    tierClass: 'tier-a',
    desc: 'AR marker/markerless tracking, SLAM, levels of VR immersion, MR, and 360 spherical video.'
  },
  computer_vision: {
    icon: 'bi-eye',
    tier: 'C',
    tierClass: 'tier-c',
    desc: 'Computer Vision pipeline, image classification, object detection boxes, segmentation, and Sobel edge filters.'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const topicsGrid = document.getElementById('topics-grid');
  const progressBar = document.getElementById('overall-progress-bar');
  const progressText = document.getElementById('overall-progress-text');

  if (!topicsGrid) return;

  // Load topics list
  const topics = await loadData('topics.json');
  if (!topics) return;

  const progress = getProgress();

  // Calculate viewed count
  let viewedCount = 0;
  const totalTopics = topics.length;

  topicsGrid.innerHTML = ''; // Clear spinner

  topics.forEach((topic) => {
    const meta = TOPIC_METADATA[topic.id] || {
      icon: 'bi-book',
      tier: 'B',
      tierClass: 'tier-b',
      desc: 'Syllabus concept summary and reinforcement questions.'
    };

    const isViewed = progress.topics[topic.id] && progress.topics[topic.id].viewed;
    if (isViewed) viewedCount++;

    const statusBadge = isViewed
      ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check2-circle"></i> Studied</span>`
      : `<span class="badge bg-secondary-subtle text-muted border border-secondary-subtle">Not Started</span>`;

    const conceptsCount = topic.concepts ? topic.concepts.length : 0;
    const questionsCount = topic.questions ? topic.questions.length : 0;

    const cardHTML = `
      <div class="col-md-6 col-lg-4">
        <div class="panel-glass panel-glass-hover h-100 p-4 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="fs-2 text-info"><i class="bi ${meta.icon}"></i></div>
            <div class="d-flex gap-2">
              <span class="badge-tier ${meta.tierClass}">Tier ${meta.tier}</span>
              ${statusBadge}
            </div>
          </div>
          <h4 class="h5 mb-2">${topic.title}</h4>
          <p class="card-desc small flex-grow-1">${meta.desc}</p>
          <hr style="border-color: rgba(255,255,255,0.06);">
          <div class="d-flex justify-content-between card-desc small mb-3">
            <span><i class="bi bi-list-check"></i> ${conceptsCount} Concepts</span>
            <span><i class="bi bi-question-circle"></i> ${questionsCount} Qs</span>
          </div>
          <a href="topic.html?id=${topic.id}" class="btn btn-sm btn-outline-info w-100 py-2">
            ${isViewed ? 'Review Topic' : 'Start Revision'} <i class="bi bi-chevron-right ms-1"></i>
          </a>
        </div>
      </div>
    `;
    topicsGrid.insertAdjacentHTML('beforeend', cardHTML);
  });

  // Update Progress Tracker
  const percent = totalTopics > 0 ? Math.round((viewedCount / totalTopics) * 100) : 0;
  progressBar.style.width = `${percent}%`;
  progressBar.setAttribute('aria-valuenow', percent);
  progressText.textContent = `${percent}% Mastered (${viewedCount} of ${totalTopics})`;
});
