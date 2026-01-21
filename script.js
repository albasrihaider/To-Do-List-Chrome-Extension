const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterSelect = document.getElementById('filterSelect');
const clearAllBtn = document.getElementById('clearAllBtn');

// 1. Load tasks from Chrome Storage on startup
chrome.storage.sync.get(['tasks'], (result) => {
    const tasks = result.tasks || [];
    tasks.forEach(task => renderTask(task));
});

// 2. Add Task Event
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text) {
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };
        renderTask(newTask);
        saveTasks();
        taskInput.value = '';
    }
});

// Allow pressing "Enter" in the input field to add a task
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
});

// 3. Render Task to DOM
function renderTask(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
        <div class="checkbox-container">
            <input type="checkbox" class="status-check" ${task.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
        </div>
        <div class="task-info">
            <span class="task-title" contenteditable="true">${task.text}</span>
            <span class="task-desc">Added on ${new Date(task.id).toLocaleDateString()}</span>
        </div>
        <button class="delete-btn">&times;</button>
    `;

    const titleSpan = li.querySelector('.task-title');

    // SAVE EDIT: Auto-save when user finishes typing or clicks away
    titleSpan.addEventListener('blur', () => saveTasks());

    titleSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleSpan.blur();
        }
    });

    // Toggle Completed Status
    li.querySelector('.status-check').addEventListener('change', (e) => {
        li.classList.toggle('completed', e.target.checked);
        saveTasks();
        applyFilter(); // Re-apply filter in case we are in "Active" or "Completed" view
    });

    // Delete Individual Task
    li.querySelector('.delete-btn').addEventListener('click', () => {
        li.remove();
        saveTasks();
    });

    taskList.appendChild(li);
}

// 4. Save current state to Storage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.task-item').forEach(li => {
        tasks.push({
            id: Number(li.dataset.id), // Ensure ID stays a number
            text: li.querySelector('.task-title').innerText,
            completed: li.classList.contains('completed')
        });
    });
    chrome.storage.sync.set({ tasks });
}

// 5. Filter Logic
function applyFilter() {
    const filterValue = filterSelect.value;
    const items = document.querySelectorAll('.task-item');

    items.forEach(item => {
        const isCompleted = item.classList.contains('completed');
        if (filterValue === 'all') {
            item.style.display = 'flex';
        } else if (filterValue === 'active') {
            item.style.display = isCompleted ? 'none' : 'flex';
        } else if (filterValue === 'completed') {
            item.style.display = isCompleted ? 'flex' : 'none';
        }
    });
}

filterSelect.addEventListener('change', applyFilter);

// 6. Clear All Tasks
clearAllBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all tasks?")) {
        taskList.innerHTML = '';
        chrome.storage.sync.set({ tasks: [] });
    }
});