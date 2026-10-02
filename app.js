const STORAGE_KEY = 'pulseboard.tasks.v1';

const STAGES = {
  backlog: { label: 'Backlog', color: 'backlog' },
  inprogress: { label: 'Em progresso', color: 'inprogress' },
  review: { label: 'Revisão', color: 'review' },
  done: { label: 'Concluído', color: 'done' }
};

const state = {
  selectedDate: toISODate(new Date()),
  monthAnchor: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  filter: 'todos',
  query: ''
};

function toISODate(date) {
  const local = new Date(date);
  const offset = local.getTimezoneOffset();
  local.setMinutes(local.getMinutes() - offset);
  return local.toISOString().slice(0, 10);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

const defaultTasks = [
  {
    id: createId(),
    title: 'Reunião de estratégia',
    date: toISODate(new Date()),
    time: '09:30',
    category: 'Produto',
    owner: 'Ana',
    priority: 'alta',
    notes: 'Revisar roadmap e entregas da sprint.',
    stage: 'backlog'
  },
  {
    id: createId(),
    title: 'Ajustes de onboarding',
    date: toISODate(new Date()),
    time: '12:00',
    category: 'Operações',
    owner: 'Bruno',
    priority: 'media',
    notes: 'Validar checklist de primeira semana.',
    stage: 'inprogress'
  },
  {
    id: createId(),
    title: 'Campanha de lançamento',
    date: toISODate(new Date(Date.now() + 86400000)),
    time: '14:30',
    category: 'Marketing',
    owner: 'Lia',
    priority: 'alta',
    notes: 'Preparar materiais para apresentação externa.',
    stage: 'review'
  },
  {
    id: createId(),
    title: 'Relatório financeiro',
    date: toISODate(new Date(Date.now() + 172800000)),
    time: '16:00',
    category: 'Financeiro',
    owner: 'João',
    priority: 'baixa',
    notes: 'Resumo final de custos e previsões.',
    stage: 'done'
  }
];

let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
      return [...defaultTasks];
    }

    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((task) => ({
        ...task,
        priority: task.priority || 'media',
        owner: task.owner || 'Sem responsável',
        stage: task.stage || 'backlog'
      }));
    }

    return [...defaultTasks];
  } catch (_error) {
    return [...defaultTasks];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDayLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  }).format(date);
}

function formatShortDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short'
  }).format(date);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function getTasksForSelectedDate() {
  return tasks.filter((task) => task.date === state.selectedDate);
}

function getVisibleTasks() {
  const today = toISODate(new Date());

  let list = [...tasks];

  if (state.filter === 'hoje') {
    list = tasks.filter((task) => task.date === today);
  }

  if (state.filter === 'proximos') {
    list = tasks.filter((task) => task.date >= today);
  }

  if (state.filter === 'todos') {
    list = getTasksForSelectedDate();
  }

  if (state.query) {
    const term = state.query.toLowerCase();
    list = list.filter((task) => `${task.title} ${task.notes} ${task.owner} ${task.category}`.toLowerCase().includes(term));
  }

  return list.sort((a, b) => `${a.date} ${a.time || '23:59'}`.localeCompare(`${b.date} ${b.time || '23:59'}`));
}

function updateMetrics() {
  const selected = getTasksForSelectedDate();
  const progress = selected.filter((task) => task.stage === 'inprogress').length;
  const done = selected.filter((task) => task.stage === 'done').length;
  const upcomingTotal = tasks.filter((task) => task.date >= toISODate(new Date())).length;

  document.getElementById('total-tasks').textContent = String(selected.length);
  document.getElementById('progress-tasks').textContent = String(progress);
  document.getElementById('done-tasks').textContent = String(done);
  document.getElementById('summary-badge').textContent = String(upcomingTotal);
}

function renderHeader() {
  const titleEl = document.getElementById('current-title');
  const summaryDateEl = document.getElementById('summary-date');
  const selected = new Date(`${state.selectedDate}T00:00:00`);

  titleEl.textContent = state.selectedDate === toISODate(new Date())
    ? 'Hoje'
    : new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(selected);

  summaryDateEl.textContent = formatDayLabel(state.selectedDate);
}

function renderBoard() {
  const board = document.getElementById('pipeline-board');
  const visibleTasks = getVisibleTasks();

  const columns = Object.entries(STAGES).map(([stageKey, stageMeta]) => {
    const stageTasks = visibleTasks.filter((task) => task.stage === stageKey);

    return `
      <div class="pipeline-column ${stageMeta.color}">
        <div class="column-head">
          <span>${stageMeta.label}</span>
          <span class="column-count">${stageTasks.length}</span>
        </div>
        <div class="column-list">
          ${stageTasks.length ? stageTasks.map((task) => `
            <article class="pipeline-card" data-task-id="${task.id}">
              <div class="card-topline">
                <span class="priority priority-${task.priority || 'media'}">${task.priority ? task.priority.toUpperCase() : 'MEDIA'}</span>
                <span class="task-time">${escapeHtml(task.time || 'Sem hora')}</span>
              </div>
              <h3>${escapeHtml(task.title)}</h3>
              <div class="task-submeta">
                <span>${escapeHtml(task.category)}</span>
                <span>${escapeHtml(task.owner || 'Sem responsável')}</span>
              </div>
              ${task.notes ? `<p>${escapeHtml(task.notes)}</p>` : ''}
              <div class="task-footer">
                <span>${escapeHtml(formatShortDate(task.date))}</span>
                <div class="card-actions">
                  ${task.stage !== 'backlog' ? `<button type="button" data-action="move-stage" data-direction="prev" data-id="${task.id}" aria-label="Etapa anterior">←</button>` : ''}
                  ${task.stage !== 'done' ? `<button type="button" data-action="move-stage" data-direction="next" data-id="${task.id}" aria-label="Próxima etapa">→</button>` : ''}
                </div>
              </div>
            </article>
          `).join('') : '<div class="empty-column">Sem itens</div>'}
        </div>
      </div>
    `;
  }).join('');

  board.innerHTML = columns;
}

function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthName = document.getElementById('month-name');
  const monthDate = new Date(state.monthAnchor);
  monthName.textContent = formatMonthLabel(monthDate);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startWeekOffset + lastDay.getDate()) / 7) * 7;

  const weekdayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const header = weekdayNames.map((day) => `<span class="calendar-weekday">${day}</span>`).join('');

  const cells = [];
  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startWeekOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const isCurrentMonth = cellDate.getMonth() === month;
    const isoDate = toISODate(cellDate);
    const hasTasks = tasks.some((task) => task.date === isoDate);
    const isSelected = isoDate === state.selectedDate;

    cells.push(`
      <button
        type="button"
        class="calendar-day ${!isCurrentMonth ? 'muted' : ''} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''}"
        data-date="${isoDate}"
        title="${isoDate}"
      >
        <span>${cellDate.getDate()}</span>
      </button>
    `);
  }

  calendarGrid.innerHTML = `${header}${cells.join('')}`;
}

function renderTeam() {
  const teamList = document.getElementById('team-list');
  const byPerson = {};

  tasks.forEach((task) => {
    const owner = task.owner || 'Sem respons�vel';
    byPerson[owner] = (byPerson[owner] || 0) + 1;
  });

  const entries = Object.entries(byPerson).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const teamCount = document.getElementById('team-count');
  teamCount.textContent = String(entries.length);

  if (!entries.length) {
    teamList.innerHTML = '<div class="empty-team">Sem respons�veis</div>';
    return;
  }

  teamList.innerHTML = entries.map(([owner, count]) => `
    <div class="team-item">
      <div class="avatar">${escapeHtml(owner.slice(0, 1).toUpperCase())}</div>
      <div>
        <strong>${escapeHtml(owner)}</strong>
        <small>${count} tarefa${count > 1 ? 's' : ''}</small>
      </div>
    </div>
  `).join('');
}

function render() {
  renderHeader();
  updateMetrics();
  renderBoard();
  renderCalendar();
  renderTeam();
  document.getElementById('date-picker').value = state.selectedDate;
  const searchInput = document.getElementById('search-input');
  if (searchInput && searchInput.value !== state.query) {
    searchInput.value = state.query;
  }
}

function openModal(dateValue = state.selectedDate) {
  const modal = document.getElementById('task-modal');
  const form = document.getElementById('task-form');
  form.elements.namedItem('date').value = dateValue;
  form.elements.namedItem('title').focus();
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('task-modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('task-form').reset();
}

function setSelectedDate(dateString) {
  state.selectedDate = dateString;
  state.monthAnchor = new Date(`${dateString}T00:00:00`);
  state.monthAnchor.setDate(1);
  render();
}

function adjustDate(offset) {
  const currentDate = new Date(`${state.selectedDate}T00:00:00`);
  currentDate.setDate(currentDate.getDate() + offset);
  setSelectedDate(toISODate(currentDate));
}

function adjustMonth(offset) {
  const nextMonth = new Date(state.monthAnchor);
  nextMonth.setMonth(nextMonth.getMonth() + offset);
  state.monthAnchor = nextMonth;
  render();
}

function updateStage(id, direction) {
  tasks = tasks.map((task) => {
    if (task.id !== id) return task;

    const order = ['backlog', 'inprogress', 'review', 'done'];
    const currentIndex = order.indexOf(task.stage);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    const safeIndex = Math.min(Math.max(targetIndex, 0), order.length - 1);

    return { ...task, stage: order[safeIndex] };
  });

  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  const datePicker = document.getElementById('date-picker');
  const addButton = document.getElementById('add-button');
  const todayButton = document.getElementById('today-button');
  const prevDayButton = document.getElementById('prev-day');
  const nextDayButton = document.getElementById('next-day');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const monthResetButton = document.getElementById('month-reset');
  const taskForm = document.getElementById('task-form');
  const closeModalButtons = document.querySelectorAll('[data-close-modal="true"]');
  const searchInput = document.getElementById('search-input');

  datePicker.value = state.selectedDate;

  document.querySelectorAll('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      render();
    });
  });

  addButton.addEventListener('click', () => openModal(state.selectedDate));
  todayButton.addEventListener('click', () => {
    state.selectedDate = toISODate(new Date());
    state.monthAnchor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    state.filter = 'todos';
    render();
  });
  prevDayButton.addEventListener('click', () => adjustDate(-1));
  nextDayButton.addEventListener('click', () => adjustDate(1));
  prevMonthButton.addEventListener('click', () => adjustMonth(-1));
  nextMonthButton.addEventListener('click', () => adjustMonth(1));
  monthResetButton.addEventListener('click', () => {
    state.monthAnchor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    render();
  });

  datePicker.addEventListener('change', (event) => {
    const value = event.target.value || toISODate(new Date());
    setSelectedDate(value);
  });

  searchInput.addEventListener('input', (event) => {
    state.query = event.target.value.trim();
    render();
  });

  closeModalButtons.forEach((button) => button.addEventListener('click', closeModal));
  document.getElementById('close-modal').addEventListener('click', closeModal);

  document.addEventListener('click', (event) => {
    const actionElement = event.target.closest('[data-action]');
    if (!actionElement) {
      const calendarDay = event.target.closest('.calendar-day');
      if (calendarDay) {
        setSelectedDate(calendarDay.dataset.date);
      }
      return;
    }

    const { action, id, direction } = actionElement.dataset;
    if (action === 'move-stage') {
      updateStage(id, direction);
      return;
    }
  });

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(taskForm);
    const title = String(formData.get('title') || '').trim();
    const date = String(formData.get('date') || '').trim();
    const stage = String(formData.get('stage') || 'backlog');
    const priority = String(formData.get('priority') || 'media');

    if (!title || !date) return;

    const newTask = {
      id: createId(),
      title,
      date,
      time: String(formData.get('time') || '').trim(),
      category: String(formData.get('category') || 'Produto').trim(),
      owner: String(formData.get('owner') || 'Sem respons�vel').trim(),
      priority,
      notes: String(formData.get('notes') || '').trim(),
      stage: Object.prototype.hasOwnProperty.call(STAGES, stage) ? stage : 'backlog'
    };

    tasks = [...tasks, newTask];
    state.selectedDate = date;
    state.filter = 'todos';
    state.query = '';
    saveTasks();
    closeModal();
    render();
  });

  render();
});
