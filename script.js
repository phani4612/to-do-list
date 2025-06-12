const form = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const darkModeToggle = document.getElementById('dark-mode-toggle');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const text = document.getElementById('task-input').value.trim();
  const dueDate = document.getElementById('due-date').value;
  const category = document.getElementById('category-input').value.trim();
  const priority = document.getElementById('priority').value;

  if (text) {
    addTask(text, priority, false, dueDate, category);
    saveTasks();
    form.reset();
  }
});

darkModeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

window.addEventListener('load', () => {
  const saved = JSON.parse(localStorage.getItem('tasks')) || [];
  saved.forEach(task => addTask(task.text, task.priority, task.completed, task.dueDate, task.category));
  if (localStorage.getItem('darkMode') === "true") {
    document.body.classList.add('dark');
    darkModeToggle.checked = true;
  }
  Notification.requestPermission();
  setInterval(checkReminders, 60000); // every minute
});

function addTask(text, priority, completed = false, dueDate = "", category = "") {
  const li = document.createElement('li');
  li.classList.add(`priority-${priority}`);
  li.dataset.completed = completed;
  li.setAttribute('draggable', true);

  li.ondragstart = e => {
    e.dataTransfer.setData('text/plain', li.dataset.index);
    li.classList.add('dragging');
  };
  li.ondragend = () => li.classList.remove('dragging');

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = text;
  if (completed) span.classList.add('completed');

  span.onclick = () => {
    span.classList.toggle('completed');
    li.dataset.completed = span.classList.contains('completed');
    saveTasks();
  };

  const info = document.createElement('div');
  info.innerHTML = `<small>Due: ${dueDate || 'N/A'} | Category: ${category || 'None'}</small>`;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const editBtn = document.createElement('button');
  editBtn.textContent = '✏️';
  editBtn.onclick = () => {
    const newText = prompt('Edit task:', span.textContent);
    if (newText) {
      span.textContent = newText.trim();
      saveTasks();
    }
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.onclick = () => {
    li.remove();
    saveTasks();
  };

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(span);
  li.appendChild(info);
  li.appendChild(actions);
  taskList.appendChild(li);

  setDragAndDrop();
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#task-list li').forEach(li => {
    const text = li.querySelector('.task-text').textContent;
    const completed = li.querySelector('.task-text').classList.contains('completed');
    const priority = ['low', 'medium', 'high'].find(p => li.classList.contains(`priority-${p}`));
    const info = li.querySelector('small').textContent.split("|");
    const dueDate = info[0].replace("Due:", "").trim();
    const category = info[1].replace("Category:", "").trim();
    tasks.push({ text, priority, completed, dueDate, category });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function filterTasks(type) {
  document.querySelectorAll('#task-list li').forEach(li => {
    const isCompleted = li.dataset.completed === "true";
    if (type === 'all') li.style.display = 'flex';
    else if (type === 'completed' && isCompleted) li.style.display = 'flex';
    else if (type === 'active' && !isCompleted) li.style.display = 'flex';
    else li.style.display = 'none';
  });
}

function checkReminders() {
  const now = new Date();
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.forEach(task => {
    if (!task.completed && task.dueDate) {
      const taskTime = new Date(task.dueDate);
      const diff = (taskTime - now) / 60000;
      if (diff > 0 && diff < 1) {
        if (Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: "⏰ " + task.text + " is due soon!",
            icon: "https://cdn-icons-png.flaticon.com/512/726/726476.png"
          });
        }
      }
    }
  });
}

function setDragAndDrop() {
  const listItems = document.querySelectorAll('#task-list li');
  listItems.forEach((li, index) => li.dataset.index = index);

  taskList.ondragover = e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const afterElement = [...taskList.querySelectorAll('li:not(.dragging)')].find(el => {
      const rect = el.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2;
    });
    if (afterElement == null) {
      taskList.appendChild(dragging);
    } else {
      taskList.insertBefore(dragging, afterElement);
    }
  };

  taskList.ondrop = () => saveTasks();
}
