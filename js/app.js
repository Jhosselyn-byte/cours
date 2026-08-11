/* ==========================================================================
   LÓGICA E INTERACTIVIDAD PRINCIPAL - PORTAL DE SÍLABOS UNAP - FINESI
   Estudiante: Briggitte Jhosselyn Vilca Chambilla
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Identify page
  const isIndexPage = document.getElementById('index-courses-grid') !== null;
  const isSyllabiPage = document.getElementById('syllabi-main-view') !== null;

  if (isIndexPage) {
    initIndexPage();
  }

  if (isSyllabiPage) {
    initSyllabiPage();
  }

  initModal();
});

/* --------------------------------------------------------------------------
   SISTEMA DE TEMA (DARK / LIGHT MODE)
   -------------------------------------------------------------------------- */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  });
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('.theme-toggle-btn i');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  });
}

/* --------------------------------------------------------------------------
   PÁGINA PRINCIPAL (INDEX.HTML)
   -------------------------------------------------------------------------- */
function initIndexPage() {
  const grid = document.getElementById('index-courses-grid');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let activeCategory = 'all';
  let searchQuery = '';

  function render() {
    grid.innerHTML = '';
    
    const filtered = window.SILABOS_DATA.filter(course => {
      const matchesCategory = activeCategory === 'all' || course.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = course.title.toLowerCase().includes(q) ||
                            course.code.toLowerCase().includes(q) ||
                            course.teacher.name.toLowerCase().includes(q) ||
                            course.prerequisite.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <i class="fas fa-search" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">No se encontraron sílabos</h3>
          <p style="color: var(--text-muted); font-size: 0.95rem;">Prueba ajustando los términos de búsqueda o los filtros seleccionados.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(course => {
      const card = document.createElement('article');
      card.className = 'course-card';
      card.innerHTML = `
        <div class="card-header">
          <div class="card-top-row">
            <span class="course-code-badge">
              <i class="fas fa-bookmark"></i> ${course.code}
            </span>
            <span class="course-category-tag">${course.category}</span>
          </div>
          <h3 class="course-title">${course.title}</h3>
          <div class="card-meta-row">
            <span class="card-meta-item"><i class="fas fa-award"></i> ${course.credits} Créditos</span>
            <span class="card-meta-item"><i class="fas fa-clock"></i> ${course.totalHours} Horas</span>
            <span class="card-meta-item"><i class="fas fa-layer-group"></i> Ciclo ${course.cycle}</span>
          </div>
        </div>

        <div class="card-body">
          <div class="teacher-info-box">
            <div class="teacher-avatar">
              <i class="fas fa-user-tie"></i>
            </div>
            <div class="teacher-details">
              <span class="teacher-label">Docente Responsable</span>
              <span class="teacher-name">${course.teacher.name}</span>
            </div>
          </div>

          <div class="prereq-box">
            <i class="fas fa-link"></i>
            <div>
              <strong style="color: var(--text-main);">Prerrequisito:</strong> ${course.prerequisite}
            </div>
          </div>

          <p class="sumilla-snippet">
            ${course.sumilla}
          </p>
        </div>

        <div class="card-footer">
          <a href="${course.htmlPage}" class="btn btn-primary">
            <i class="fas fa-book-open"></i> Ver Página del Sílabo
          </a>
          <button class="btn btn-outline btn-icon-only preview-btn" data-id="${course.code}" title="Vista previa rápida">
            <i class="fas fa-eye"></i>
          </button>
          <a href="${course.file}" target="_blank" class="btn btn-outline btn-icon-only" title="Abrir archivo PDF/HTML original">
            <i class="fas ${course.fileType === 'pdf' ? 'fa-file-pdf' : 'fa-file-code'}"></i>
          </a>
        </div>
      `;

      grid.appendChild(card);
    });

    grid.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openCourseModal(id);
      });
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
  }

  render();
}

/* --------------------------------------------------------------------------
   CATÁLOGO GENERAL DE SÍLABOS (SILABOS.HTML - VISTA VERTICAL CONTINUA)
   -------------------------------------------------------------------------- */
function initSyllabiPage() {
  const sidebarList = document.getElementById('sidebar-course-list');
  const mainView = document.getElementById('syllabi-main-view');

  const urlParams = new URLSearchParams(window.location.search);
  let activeCourseId = urlParams.get('curso') || urlParams.get('id') || window.SILABOS_DATA[0].code;

  function renderSidebar() {
    sidebarList.innerHTML = '';
    window.SILABOS_DATA.forEach(course => {
      const item = document.createElement('li');
      item.className = `course-nav-item ${course.code === activeCourseId ? 'active' : ''}`;
      item.innerHTML = `
        <span class="course-nav-code">${course.code}</span>
        <span class="course-nav-name">${course.title}</span>
      `;
      item.addEventListener('click', () => {
        activeCourseId = course.code;
        const newUrl = `${window.location.pathname}?curso=${course.code}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        renderSidebar();
        renderMainView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      sidebarList.appendChild(item);
    });
  }

  function renderMainView() {
    const course = window.SILABOS_DATA.find(c => c.code === activeCourseId) || window.SILABOS_DATA[0];

    mainView.innerHTML = `
      <!-- Encabezado del Sílabo -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 2px solid var(--border-color);">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="course-code-badge" style="font-size: 0.85rem; padding: 0.3rem 0.75rem;">
            <i class="fas fa-bookmark"></i> CÓDIGO: ${course.code}
          </span>
          <span class="course-category-tag" style="font-size: 0.8rem; padding: 0.25rem 0.75rem;">
            ${course.category}
          </span>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); background: var(--bg-main); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); border: 1px solid var(--border-color);">
            Ciclo ${course.cycle} | Semestre 2026-I
          </span>
        </div>
        <h1 style="font-size: clamp(1.5rem, 4.5vw, 2.2rem); font-weight: 700; color: var(--primary-navy); line-height: 1.25;">
          ${course.title}
        </h1>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
          <a href="${course.htmlPage}" class="btn btn-primary">
            <i class="fas fa-external-link-alt"></i> Ir a la Página del Sílabo
          </a>
          <a href="${course.file}" target="_blank" class="btn btn-outline">
            <i class="fas ${course.fileType === 'pdf' ? 'fa-file-pdf' : 'fa-file-code'}"></i> Archivo Original
          </a>
          <button onclick="window.print()" class="btn btn-outline">
            <i class="fas fa-print"></i> Imprimir
          </button>
        </div>
      </div>

      <!-- 1. INFORMACIÓN GENERAL (VERTICAL) -->
      <section style="margin-bottom: 2.25rem;">
        <h3 class="section-title"><i class="fas fa-list-ul"></i> 1. Información General del Curso</h3>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-label">Docente Responsable</div>
            <div class="info-card-value">${course.teacher.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">${course.teacher.condition}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Especialidad del Docente</div>
            <div class="info-card-value">${course.teacher.specialty}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Créditos y Horas</div>
            <div class="info-card-value">${course.credits} Créditos (${course.totalHours} Horas)</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">Teóricas: ${course.theoryHours}h | Prácticas: ${course.practiceHours}h</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Prerrequisito</div>
            <div class="info-card-value">${course.prerequisite}</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Plan de Estudios</div>
            <div class="info-card-value">2021 - 2025 Versión 2.0</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Ambiente de Aprendizaje</div>
            <div class="info-card-value">${course.classroom}</div>
          </div>
        </div>
      </section>

      <!-- 2. SUMILLA (VERTICAL) -->
      <section style="margin-bottom: 2.25rem;">
        <h3 class="section-title"><i class="fas fa-book-reader"></i> 2. Sumilla de la Asignatura</h3>
        <div style="background: var(--bg-main); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); line-height: 1.65; font-size: 0.98rem; color: var(--text-main);">
          ${course.sumilla}
        </div>
      </section>

      <!-- 3. LOGRO DE APRENDIZAJE (VERTICAL) -->
      <section style="margin-bottom: 2.25rem;">
        <h3 class="section-title"><i class="fas fa-bullseye"></i> 3. Logro de Aprendizaje</h3>
        <div style="background: rgba(111, 78, 55, 0.12); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--primary-accent); line-height: 1.65; font-size: 0.98rem; color: var(--text-main);">
          <strong>Competencia General Lograda:</strong> ${course.logro}
        </div>
      </section>

      <!-- 4. UNIDADES DIDÁCTICAS (VERTICAL CONTINUO DE SEMANAS 1 A 18) -->
      <section style="margin-bottom: 2.25rem;">
        <h3 class="section-title"><i class="fas fa-calendar-alt"></i> 4. Tratamiento de Unidades Didácticas (Semanas 1 a 18)</h3>
        ${course.units.map(unit => `
          <div style="margin-bottom: 2rem;">
            <div style="background: var(--primary-navy); color: #FFFFFF; padding: 0.85rem 1.15rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
              <h4 style="font-size: clamp(1rem, 3.5vw, 1.15rem); font-weight: 700;">UNIDAD ${unit.number}: ${unit.title}</h4>
              <p style="font-size: 0.82rem; opacity: 0.9; margin-top: 0.2rem;"><strong>Duración:</strong> ${unit.duration}</p>
            </div>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;"><strong>Logro de Unidad:</strong> ${unit.logro}</p>

            <div class="weeks-container">
              ${unit.weeks.map(w => `
                <div class="week-card">
                  <span class="week-badge">Semana ${w.week}</span>
                  <div class="week-topic">${w.topic}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </section>

      <!-- 5. EVALUACIÓN Y METODOLOGÍA (VERTICAL) -->
      <section style="margin-bottom: 2.25rem;">
        <h3 class="section-title"><i class="fas fa-chart-pie"></i> 5. Sistema de Evaluación y Metodología</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          <div class="info-card">
            <div class="info-card-label">Exámenes Teórico-Prácticos</div>
            <div class="info-card-value">40% Promedio Ponderado</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Trabajos Aplicativos / Portafolio</div>
            <div class="info-card-value">35% Seguimiento Continuo</div>
          </div>
          <div class="info-card">
            <div class="info-card-label">Laboratorios / Sustentación</div>
            <div class="info-card-value">25% Evaluación Continua</div>
          </div>
        </div>

        <div style="background: var(--bg-main); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <strong style="color: var(--primary-navy); display: block; margin-bottom: 0.5rem; font-size: 1.05rem;">Estrategias Metodológicas:</strong>
          <ul style="padding-left: 1.25rem; line-height: 1.8; color: var(--text-main); font-size: 0.95rem;">
            <li>Clases magistrales activas y desarrollo práctico de laboratorios computacionales.</li>
            <li>Resolución de problemas reales aplicados a la Ingeniería Estadística e Informática.</li>
            <li>Uso obligatorio de software especializado y portafolios digitales de evidencias.</li>
          </ul>
        </div>
      </section>

      <!-- 6. DOCUMENTO OFICIAL (VERTICAL) -->
      <section style="margin-bottom: 1rem;">
        <h3 class="section-title"><i class="fas fa-file-pdf"></i> 6. Documento Oficial del Sílabo</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <a href="${course.file}" target="_blank" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-external-link-alt"></i> Abrir o Descargar Documento Original Completo
          </a>
          <div class="document-viewer-wrapper">
            <iframe src="${course.file}" class="document-viewer-iframe" title="Visor de Sílabo ${course.code}"></iframe>
          </div>
        </div>
      </section>
    `;
  }

  renderSidebar();
  renderMainView();
}

/* --------------------------------------------------------------------------
   MODAL DE VISTA PREVIA RÁPIDA
   -------------------------------------------------------------------------- */
function initModal() {
  const modalBackdrop = document.getElementById('course-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!modalBackdrop) return;

  closeBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });
}

function openCourseModal(courseCode) {
  const course = window.SILABOS_DATA.find(c => c.code === courseCode);
  if (!course) return;

  const modalBackdrop = document.getElementById('course-modal');
  const modalTitle = document.getElementById('modal-course-title');
  const modalBody = document.getElementById('modal-course-body');
  const modalActionBtn = document.getElementById('modal-action-btn');

  modalTitle.textContent = `${course.code}: ${course.title}`;
  modalActionBtn.href = course.htmlPage;

  modalBody.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <div class="info-card">
        <div class="info-card-label">Docente</div>
        <div class="info-card-value">${course.teacher.name}</div>
      </div>
      <div class="info-card">
        <div class="info-card-label">Créditos / Horas</div>
        <div class="info-card-value">${course.credits} Créditos (${course.totalHours} hrs)</div>
      </div>
      <div class="info-card">
        <div class="info-card-label">Prerrequisito</div>
        <div class="info-card-value">${course.prerequisite}</div>
      </div>
    </div>

    <div>
      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.5rem;">Sumilla</h4>
      <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.6;">${course.sumilla}</p>
    </div>

    <div style="margin-top: 1.25rem;">
      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--primary-navy); margin-bottom: 0.5rem;">Unidades del Curso</h4>
      ${course.units.map(u => `
        <div style="background: var(--bg-main); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 0.5rem;">
          <strong>Unidad ${u.number}:</strong> ${u.title}
        </div>
      `).join('')}
    </div>
  `;

  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modalBackdrop = document.getElementById('course-modal');
  if (modalBackdrop) {
    modalBackdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}
