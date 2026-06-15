// ==========================================
// GLOBAL STATE
// ==========================================

let tasks = [];
// use window.currentEditId as the single source of truth for edit state
window.currentEditId = window.currentEditId || null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

// ==========================================
// API FUNCTIONS
// ==========================================

async function loadTasks() {

    try {

        const response = await fetch('/tasks');

        if (!response.ok)
            throw new Error('Failed to load tasks');

        tasks = await response.json();

        updateCards();

        if (typeof renderCharts === "function") {
            renderCharts();
        }

        renderTasks();

    } catch (error) {

        console.error(error);

        if (typeof showToast === 'function')
            showToast('Unable to load tasks');
    }
}

async function addTask() {

    const payload = getFormData();

    if (!payload.title || payload.title.trim() === '') {
        if (typeof showToast === 'function') showToast('Please enter a task title');
        return;
    }

    try {

        let response;
        let successMessage;


        if (window.currentEditId) {

            response = await fetch(`/tasks/${window.currentEditId}`, {

                method: 'PUT',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(payload)
            });

            successMessage = 'Task updated successfully';

        } else {

            response = await fetch('/tasks', {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify(payload)
            });

            successMessage = 'Task added successfully';
        }

        if (!response.ok) {

            const message = await response.text();

            throw new Error(message);
        }

        window.currentEditId = null;

        clearForm();

        const addButton =
            document.querySelector('.btn-primary');

        if (addButton)
            addButton.textContent = 'Add Task';

        if (typeof showToast === 'function')
            showToast(successMessage);

        loadTasks();

    } catch (error) {

        if (typeof showToast === 'function')
            showToast(error.message);
    }
}

async function deleteTask(id) {

    if (!confirm('Delete this task?'))
        return;

    try {

        const response = await fetch(`/tasks/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task from server');
        }

        if (typeof showToast === 'function')
            showToast('Task deleted successfully');

        loadTasks();

    } catch (error) {

        console.error(error);

        if (typeof showToast === 'function')
            showToast('Delete failed');
    }
}

async function toggleStatus(id) {

    try {

        const response = await fetch(`/tasks/${id}/toggle`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error('Failed to update status on server');
        }

        if (typeof showToast === 'function')
            showToast('Status updated');

        loadTasks();

    } catch (error) {

        console.error(error);

        if (typeof showToast === 'function')
            showToast('Status update failed');
    }
}

function logout() {
    if (typeof showToast === 'function')
        showToast('Logging out...');
    window.location.href = '/logout';
}

// ==========================================
// FORM HELPERS
// ==========================================

function getFormData() {

    return {

        title:
            document.getElementById('title').value,

        dueDate:
            document.getElementById('dueDate').value,

        priority:
            document.getElementById('priority').value,

        status:
            document.getElementById('status').value,

        estimatedHours:
            parseInt(
                document.getElementById('estimatedHours').value
            ) || 0,

        rewardForCompletion:
            document.getElementById('reward').value
    };
}

function clearForm() {

    document.getElementById('title').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('priority').value = 'Medium';
    document.getElementById('status').value = 'Pending';
    document.getElementById('estimatedHours').value = '';
    document.getElementById('reward').value = '';
}

// ==========================================
// DASHBOARD CARDS
// ==========================================

function updateCards() {

    const total =
        tasks.length;

    const pending =
        tasks.filter(task =>
            task.status === 'Pending'
        ).length;

    const completed =
        tasks.filter(task =>
            task.status === 'Completed'
        ).length;

    const totalElement =
        document.getElementById('totalTasks');

    const pendingElement =
        document.getElementById('pendingTasks');

    const completedElement =
        document.getElementById('completedTasks');

    if (totalElement)
        totalElement.textContent = total;

    if (pendingElement)
        pendingElement.textContent = pending;

    if (completedElement)
        completedElement.textContent = completed;
}

// ==========================================
// TASK TABLE
// ==========================================

function renderTasks() {

    const searchInput =
        document.getElementById('search');

    const searchText =
        searchInput
            ? searchInput.value.toLowerCase()
            : '';

    const filteredTasks =
        tasks.filter(task =>
            task.title
                .toLowerCase()
                .includes(searchText)
        );

    let html = '';

    filteredTasks.forEach(task => {

        html += `
        <tr>

            <td>${task.id}</td>

            <td>${task.title}</td>

            <td>
                ${new Date(task.dueDate)
                    .toLocaleDateString()}
            </td>

            <td>${task.priority}</td>

            <td>

                <span
                    class="badge ${
                        task.status === 'Completed'
                            ? 'completed'
                            : 'pending'
                    }"
                    style="cursor:pointer"
                    onclick="toggleStatus(${task.id})">

                    ${task.status}

                </span>

            </td>

            <td>${task.estimatedHours}</td>

            <td>${task.rewardForCompletion}</td>

            <td>

                <button
                    class="btn-primary"
                    onclick="editTask(${task.id})">
                    Edit
                </button>

                <button
                    class="btn-danger"
                    onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </td>

        </tr>`;
    });

    document.getElementById('taskTable').innerHTML =
        html;
}

// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {

    const task =
        tasks.find(t => t.id === id);

    if (!task)
        return;

    // Open edit modal and populate fields (modal.js exposes openEditModal)
    if (typeof openEditModal === 'function') {
        openEditModal(task);
        currentEditId = id;
        return;
    }

    // Fallback (if modal script not loaded): populate top form
    document.getElementById('title').value = task.title;
    document.getElementById('dueDate').value = task.dueDate.split('T')[0];
    document.getElementById('priority').value = task.priority;
    document.getElementById('status').value = task.status;
    document.getElementById('estimatedHours').value = task.estimatedHours;
    document.getElementById('reward').value = task.rewardForCompletion;
    window.currentEditId = id;
    const addButton = document.querySelector('.btn-primary');
    if (addButton) addButton.textContent = 'Update Task';
}