// Enhanced Football Performance Dashboard Application
// API Base URL
const API_BASE = window.location.origin;

// Global State
const appState = {
    user: null,
    token: null,
    currentTeam: null,
    teams: [],
    players: [],
    currentPage: 'home'
};

// Utility Functions
const api = {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (appState.token) {
            headers['Authorization'] = `Bearer ${appState.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok && response.status === 401) {
            // Token expired, logout
            logout();
            throw new Error('Session expired');
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    },

    get(endpoint) {
        return this.request(endpoint);
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// PDF Export Function
async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Performance Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

    // Add team info
    if (appState.currentTeam) {
        doc.text(`Team: ${appState.currentTeam.name}`, 20, 40);
    }

    // Add player count
    doc.text(`Total Players: ${appState.players.length}`, 20, 50);

    doc.save('performance-report.pdf');
    showNotification('Report exported successfully!', 'success');
}

// CSV Export Function
function exportToCSV() {
    const headers = ['Name', 'Position', 'Age', 'Jersey Number', 'Team'];
    const rows = appState.players.map(p => [
        p.name,
        p.position,
        p.age || 'N/A',
        p.jersey_number || 'N/A',
        p.team || 'N/A'
    ]);

    let csv = headers.join(',') + '\\n';
    rows.forEach(row => {
        csv += row.join(',') + '\\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players-export.csv';
    a.click();
    showNotification('CSV exported successfully!', 'success');
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
                type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
        } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Authentication Functions
async function login(email, password) {
    try {
        const response = await api.post('/auth/login', {
            username: email.split('@')[0],
            password: password
        });

        appState.token = response.access_token;
        appState.user = { email };
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify({ email }));

        return true;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}

async function register(email, password) {
    try {
        await api.post('/auth/register', {
            username: email.split('@')[0],
            email: email,
            password: password
        });
        return true;
    } catch (error) {
        console.error('Registration failed:', error);
        return false;
    }
}

function logout() {
    appState.token = null;
    appState.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        appState.token = token;
        appState.user = JSON.parse(user);
        return true;
    }
    return false;
}

// Data Loading Functions
async function loadTeams() {
    try {
        appState.teams = await api.get('/teams');
        if (appState.teams.length > 0 && !appState.currentTeam) {
            appState.currentTeam = appState.teams[0];
            applyTeamTheme(appState.currentTeam);
        }
    } catch (error) {
        console.error('Failed to load teams:', error);
        appState.teams = [];
    }
}

async function loadPlayers() {
    try {
        appState.players = await api.get('/players');
    } catch (error) {
        console.error('Failed to load players:', error);
        appState.players = [];
    }
}

// Team Theme Application
function applyTeamTheme(team) {
    if (!team) return;

    const root = document.documentElement;
    root.style.setProperty('--team-primary', team.color_primary || '#00ff88');
    root.style.setProperty('--team-secondary', team.color_secondary || '#00ccff');

    // Update all accent colors
    const accentElements = document.querySelectorAll('.text-pitch-accent, .bg-pitch-accent, .border-pitch-accent');
    accentElements.forEach(el => {
        el.style.color = team.color_primary;
    });
}

// Modal System
function showModal(title, content, actions = []) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75';
    modal.innerHTML = `
        <div class="glass-panel p-8 rounded-2xl w-full max-w-2xl mx-4 relative">
            <button class="absolute top-4 right-4 text-gray-400 hover:text-white" onclick="this.closest('.fixed').remove()">
                <i class="fa-solid fa-times text-xl"></i>
            </button>
            <h2 class="text-2xl font-bold text-white mb-6">${title}</h2>
            <div class="modal-content">${content}</div>
            <div class="mt-6 flex gap-3 justify-end">
                ${actions.map(action => `
                    <button class="${action.class}" onclick="${action.onclick}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Player Management
async function showAddPlayerModal() {
    const content = `
        <form id="add-player-form" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Name</label>
                    <input type="text" name="name" required class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Position</label>
                    <select name="position" required class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                        <option value="Forward">Forward</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Defender">Defender</option>
                        <option value="Goalkeeper">Goalkeeper</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Age</label>
                    <input type="number" name="age" min="15" max="50" class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Jersey Number</label>
                    <input type="number" name="jersey_number" min="1" max="99" class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                </div>
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-400 mb-2">Team</label>
                    <select name="team_id" class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                        <option value="">No Team</option>
                        ${appState.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        </form>
    `;

    const modal = showModal('Add New Player', content, [
        {
            label: 'Cancel',
            class: 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600',
            onclick: 'this.closest(".fixed").remove()'
        },
        {
            label: 'Add Player',
            class: 'px-4 py-2 bg-pitch-accent text-pitch-dark rounded-lg hover:bg-pitch-accent/90',
            onclick: 'handleAddPlayer()'
        }
    ]);
}

async function handleAddPlayer() {
    const form = document.getElementById('add-player-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric fields
    if (data.age) data.age = parseInt(data.age);
    if (data.jersey_number) data.jersey_number = parseInt(data.jersey_number);
    if (data.team_id) data.team_id = parseInt(data.team_id);

    // Generate photo URL
    data.photo_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&size=256`;

    try {
        await api.post('/players', data);
        showNotification('Player added successfully!', 'success');
        await loadPlayers();
        document.querySelector('.fixed.inset-0').remove();
        renderPage(appState.currentPage);
    } catch (error) {
        showNotification('Failed to add player', 'error');
    }
}

async function deletePlayer(playerId, playerName) {
    if (!confirm(`Are you sure you want to delete ${playerName}?`)) return;

    try {
        await api.delete(`/players/${playerId}`);
        showNotification('Player deleted successfully!', 'success');
        await loadPlayers();
        renderPage(appState.currentPage);
    } catch (error) {
        showNotification('Failed to delete player', 'error');
    }
}

// Team Management
async function showAddTeamModal() {
    const content = `
        <form id="add-team-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Team Name</label>
                <input type="text" name="name" required class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Division</label>
                <input type="text" name="division" class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
                    <input type="color" name="color_primary" value="#00ff88" class="w-full h-12 bg-pitch-light border border-gray-700 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Secondary Color</label>
                    <input type="color" name="color_secondary" value="#00ccff" class="w-full h-12 bg-pitch-light border border-gray-700 rounded-lg">
                </div>
            </div>
        </form>
    `;

    showModal('Add New Team', content, [
        {
            label: 'Cancel',
            class: 'px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600',
            onclick: 'this.closest(".fixed").remove()'
        },
        {
            label: 'Add Team',
            class: 'px-4 py-2 bg-pitch-accent text-pitch-dark rounded-lg hover:bg-pitch-accent/90',
            onclick: 'handleAddTeam()'
        }
    ]);
}

async function handleAddTeam() {
    const form = document.getElementById('add-team-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        await api.post('/teams', data);
        showNotification('Team added successfully!', 'success');
        await loadTeams();
        document.querySelector('.fixed.inset-0').remove();
        renderPage('teams');
    } catch (error) {
        showNotification('Failed to add team', 'error');
    }
}

async function deleteTeam(teamId, teamName) {
    if (!confirm(`Are you sure you want to delete ${teamName}? This will also delete all players in this team.`)) return;

    try {
        await api.delete(`/teams/${teamId}`);
        showNotification('Team deleted successfully!', 'success');
        await loadTeams();
        renderPage('teams');
    } catch (error) {
        showNotification('Failed to delete team', 'error');
    }
}

function switchTeam(team) {
    appState.currentTeam = team;
    applyTeamTheme(team);
    showNotification(`Switched to ${team.name}`, 'info');
    renderPage(appState.currentPage);
}

// Make functions globally available
window.exportToPDF = exportToPDF;
window.exportToCSV = exportToCSV;
window.showAddPlayerModal = showAddPlayerModal;
window.handleAddPlayer = handleAddPlayer;
window.deletePlayer = deletePlayer;
window.showAddTeamModal = showAddTeamModal;
window.handleAddTeam = handleAddTeam;
window.deleteTeam = deleteTeam;
window.switchTeam = switchTeam;
window.logout = logout;
window.renderPage = function (page) { /* Will be defined in main initialization */ };
