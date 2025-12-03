/**
 * Football Performance Dashboard - Enhanced Application Logic
 * Handles Authentication, Routing, API Interactions, and UI Rendering
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration & State ---
    const API_BASE = ''; // Relative path
    const STATE = {
        token: localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        currentTeam: null, // { id, name, color_primary, color_secondary }
        teams: [],
        players: [],
        periodDays: 7
    };

    // --- DOM Elements ---
    const els = {
        authOverlay: document.getElementById('auth-overlay'),
        appLayout: document.getElementById('app-layout'),
        loginForm: document.getElementById('login-form'),
        pageContent: document.getElementById('page-content'),
        navItems: document.querySelectorAll('.nav-item'),
        sidebar: document.querySelector('aside'),
        mobileHeader: document.querySelector('header')
    };

    // --- Initialization ---
    init();

    function init() {
        setupEventListeners();
        checkAuth();
    }

    function setupEventListeners() {
        // Login
        els.loginForm.addEventListener('submit', handleLogin);

        // Navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const page = anchor.getAttribute('href').substring(1);
                navigateTo(page);
            });
        });

        // Mobile Menu (Basic toggle)
        const menuBtn = document.querySelector('.fa-bars').parentElement;
        menuBtn.addEventListener('click', () => {
            els.sidebar.classList.toggle('hidden');
            els.sidebar.classList.toggle('fixed');
            els.sidebar.classList.toggle('inset-0');
            els.sidebar.classList.toggle('z-50');
            els.sidebar.classList.toggle('w-full');
        });
    }

    // --- Authentication ---
    async function checkAuth() {
        if (STATE.token) {
            // Validate token (optional: call a /me endpoint if exists, or just trust for MVP)
            showApp();
            await loadInitialData();
            navigateTo('home');
        } else {
            showLogin();
        }
    }

    function showLogin() {
        els.authOverlay.classList.remove('opacity-0', 'pointer-events-none');
        els.appLayout.classList.add('hidden');
    }

    function showApp() {
        els.authOverlay.classList.add('opacity-0', 'pointer-events-none');
        els.appLayout.classList.remove('hidden');
    }

    async function handleLogin(e) {
        e.preventDefault();
        const usernameInput = els.loginForm.querySelector('input#username');
        const passwordInput = els.loginForm.querySelector('input#password');
        const btn = els.loginForm.querySelector('button');
        const errorDiv = document.getElementById('login-error');
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        const originalText = btn.innerText;
        btn.innerText = 'Authenticating...';
        btn.disabled = true;
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                let msg = errData.detail || 'Login failed';
                if (typeof msg === 'object') {
                    msg = JSON.stringify(msg);
                }
                throw new Error(msg);
            }

            const data = await response.json();
            STATE.token = data.access_token;
            STATE.user = { username: username };
            
            localStorage.setItem('token', STATE.token);
            localStorage.setItem('user', JSON.stringify(STATE.user));

            showApp();
            await loadInitialData();
            navigateTo('home');

        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'An error occurred during login';
            errorDiv.classList.remove('hidden');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    function logout() {
        STATE.token = null;
        STATE.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showLogin();
    }

    // --- Data Loading ---
    async function loadInitialData() {
        try {
            const teams = await apiCall('/teams');
            STATE.teams = teams;
            if (teams.length > 0 && !STATE.currentTeam) {
                selectTeam(teams[0]);
            }
        } catch (e) {
            console.error('Failed to load initial data', e);
        }
    }

    function selectTeam(team) {
        STATE.currentTeam = team;
        // Update UI Colors
        if (team.color_primary) {
            document.documentElement.style.setProperty('--color-pitch-accent', team.color_primary);
            // We need to update Tailwind config dynamically or use CSS variables. 
            // Since Tailwind is compiled/CDN, we can inject a style tag to override classes or just use inline styles for key elements.
            // For this MVP, we'll set CSS variables that we can use in style attributes or custom classes.
        }
        // Refresh current view
        const hash = window.location.hash.substring(1) || 'home';
        navigateTo(hash);
    }

    // --- API Helper ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const headers = {
            'Authorization': `Bearer ${STATE.token}`,
            'Content-Type': 'application/json'
        };
        
        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE}${endpoint}`, config);
        if (res.status === 401) {
            logout();
            throw new Error('Unauthorized');
        }
        if (!res.ok) {
            let errMsg = 'API Error';
            try {
                const err = await res.json();
                errMsg = err.detail || errMsg;
            } catch (e) {
                // If JSON parse fails, try text
                const text = await res.text();
                errMsg = text || `API Error (${res.status})`;
            }
            throw new Error(errMsg);
        }
        
        // Handle 204 No Content (successful deletion)
        if (res.status === 204 || res.status === 204) {
            return null;
        }
        
        return res.json();
    }

    // --- Navigation & Routing ---
    async function navigateTo(page) {
        // Update Sidebar Active State
        els.navItems.forEach(item => {
            const href = item.getAttribute('href').substring(1);
            if (href === page) {
                item.classList.remove('text-gray-400', 'hover:bg-white/5');
                item.classList.add('bg-pitch-accent/10', 'text-pitch-accent', 'border', 'border-pitch-accent/20');
            } else {
                item.classList.add('text-gray-400', 'hover:bg-white/5');
                item.classList.remove('bg-pitch-accent/10', 'text-pitch-accent', 'border', 'border-pitch-accent/20');
            }
        });

        // Render Content
        els.pageContent.innerHTML = '<div class="flex justify-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-pitch-accent"></i></div>';
        
        try {
            switch(page) {
                case 'home': await renderHome(); break;
                case 'teams': await renderTeams(); break;
                case 'players': await renderPlayers(); break;
                case 'stats': await renderAnalytics(); break;
                case 'training-load': await renderTrainingLoad(); break;
                case 'injury-risk': await renderInjuryRisk(); break;
                case 'schedule': await renderSchedule(); break;
                default: await renderHome();
            }
        } catch (e) {
            els.pageContent.innerHTML = `<div class="text-red-500 p-4">Error loading page: ${e.message}</div>`;
        }
    }

    // --- Renderers ---

    async function renderHome() {
        // Fetch summary data
        const [insights, schedule, players] = await Promise.all([
            apiCall(`/analytics/insights?days=7${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`),
            apiCall(`/schedule?limit=1${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`),
            apiCall(`/players${STATE.currentTeam ? `?team_id=${STATE.currentTeam.id}` : ''}`)
        ]);

        const nextMatch = schedule[0];
        const nextMatchText = nextMatch ? new Date(nextMatch.event_date).toLocaleDateString() : 'No upcoming';
        const nextMatchOpponent = nextMatch ? nextMatch.opponent : '-';
        const totalPlayers = players.length;

        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between relative z-10">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Dashboard</h2>
                    <p class="text-gray-400">Welcome back, Coach. Team: <span class="text-pitch-accent">${STATE.currentTeam ? STATE.currentTeam.name : 'All Teams'}</span></p>
                </div>
                <button onclick="window.exportReport()" class="bg-pitch-light border border-pitch-accent/30 text-pitch-accent px-4 py-2 rounded-lg hover:bg-pitch-accent hover:text-pitch-dark transition-colors text-sm font-medium">
                    <i class="fa-solid fa-download mr-2"></i> Export Report
                </button>
            </div>

            <!-- Welcome Banner -->
            <div class="glass-panel rounded-2xl p-8 mb-6 bg-gradient-to-r from-pitch-dark to-pitch-accent/10 border border-pitch-accent/20">
                <h3 class="text-2xl font-bold text-white mb-2">Performance Overview</h3>
                <p class="text-gray-400">Track your team's physical condition and match readiness in real-time.</p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onclick="window.navigateTo('players')" class="glass-panel p-6 rounded-2xl border-l-4 border-pitch-accent hover:translate-y-[-2px] transition-transform cursor-pointer group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Active Players</p>
                            <h3 class="text-3xl font-bold text-white mt-1">${insights.summary.total_players_analyzed}</h3>
                        </div>
                        <div class="p-2 bg-pitch-accent/10 rounded-lg text-pitch-accent group-hover:bg-pitch-accent group-hover:text-pitch-dark transition-colors">
                            <i class="fa-solid fa-user-group"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-green-400">
                        <span>View Roster →</span>
                    </div>
                </div>

                <div onclick="window.navigateTo('training-load')" class="glass-panel p-6 rounded-2xl border-l-4 border-pitch-secondary hover:translate-y-[-2px] transition-transform cursor-pointer group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Training Load</p>
                            <h3 class="text-3xl font-bold text-white mt-1">${insights.summary.players_optimal_load} <span class="text-sm font-normal text-gray-400">Optimal</span></h3>
                        </div>
                        <div class="p-2 bg-pitch-secondary/10 rounded-lg text-pitch-secondary group-hover:bg-pitch-secondary group-hover:text-pitch-dark transition-colors">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-yellow-400">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                        <span>${insights.summary.players_needing_recovery} need recovery</span>
                    </div>
                </div>

                <div onclick="window.navigateTo('injury-risk')" class="glass-panel p-6 rounded-2xl border-l-4 border-purple-500 hover:translate-y-[-2px] transition-transform cursor-pointer group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Injury Risk</p>
                            <h3 class="text-3xl font-bold text-white mt-1">${insights.injury_prevention.length > 0 ? 'High' : 'Low'}</h3>
                        </div>
                        <div class="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <i class="fa-solid fa-heart-pulse"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-gray-400">
                        <span>${insights.injury_prevention.length} alerts</span>
                    </div>
                </div>

                <div onclick="window.navigateTo('schedule')" class="glass-panel p-6 rounded-2xl border-l-4 border-orange-500 hover:translate-y-[-2px] transition-transform cursor-pointer group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Next Match</p>
                            <h3 class="text-xl font-bold text-white mt-1 truncate">${nextMatchText}</h3>
                        </div>
                        <div class="p-2 bg-orange-500/10 rounded-lg text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <i class="fa-solid fa-calendar"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-gray-400">
                        <span>vs. ${nextMatchOpponent}</span>
                    </div>
                </div>
            </div>
        `;

        // Expose functions globally for onclick handlers
        window.navigateTo = navigateTo;
        window.exportReport = exportReport;
    }

    async function renderPlayers() {
        const players = await apiCall(`/players${STATE.currentTeam ? `?team_id=${STATE.currentTeam.id}` : ''}`);
        
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Players</h2>
                    <p class="text-gray-400">Total Players: ${players.length}</p>
                </div>
                <button onclick="window.openAddPlayerModal()" class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                    <i class="fa-solid fa-plus mr-2"></i> Add Player
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${players.map(player => `
                    <div class="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all group relative">
                        <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onclick="window.editPlayer(${player.id})" class="text-pitch-accent hover:text-pitch-accent/80"><i class="fa-solid fa-edit"></i></button>
                            <button onclick="window.deletePlayer(${player.id})" class="text-red-400 hover:text-red-300"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div class="flex items-center gap-4 mb-4 cursor-pointer" onclick="window.viewPlayer(${player.id})">
                            <img src="${player.photo_url || `https://ui-avatars.com/api/?name=${player.name}&background=random`}" class="w-16 h-16 rounded-full border-2 border-pitch-accent object-cover">
                            <div>
                                <h3 class="text-xl font-bold text-white">${player.name}</h3>
                                <p class="text-pitch-accent text-sm">${player.position} #${player.jersey_number || '-'}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-500">Age</p>
                                <p class="text-white">${player.age || '-'}</p>
                            </div>
                            <div>
                                <p class="text-gray-500">Status</p>
                                <p class="text-green-400">Active</p>
                            </div>
                        </div>
                        
                        <!-- Hover Popup (Simple implementation via group-hover) -->
                        <div class="absolute left-0 bottom-full mb-2 w-full p-4 glass-panel rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                            <div class="flex items-center gap-3 mb-2">
                                <img src="${player.photo_url || `https://ui-avatars.com/api/?name=${player.name}&background=random`}" class="w-10 h-10 rounded-full">
                                <div>
                                    <p class="font-bold text-white">${player.name}</p>
                                    <p class="text-xs text-gray-400">Click for details</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        window.openAddPlayerModal = openAddPlayerModal;
        window.closeAddPlayerModal = closeAddPlayerModal;
        window.clearPlayerPhoto = clearPlayerPhoto;
        window.editPlayer = editPlayer;
        window.openEditPlayerModal = openEditPlayerModal;
        window.closeEditPlayerModal = closeEditPlayerModal;
        window.clearEditPlayerPhoto = clearEditPlayerPhoto;
        window.deletePlayer = deletePlayer;
        window.viewPlayer = viewPlayer;
    }

    async function renderTeams() {
        const teams = await apiCall('/teams');
        
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Teams</h2>
                    <p class="text-gray-400">Manage your squads</p>
                </div>
                <button onclick="window.openAddTeamModal()" class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                    <i class="fa-solid fa-plus mr-2"></i> Add Team
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${teams.map(team => `
                    <div onclick="window.selectTeam(${team.id})" class="glass-panel p-6 rounded-2xl border-t-4 hover:translate-y-[-4px] transition-transform cursor-pointer ${STATE.currentTeam && STATE.currentTeam.id === team.id ? 'ring-2 ring-pitch-accent' : ''}" style="border-color: ${team.color_primary || '#00ff88'}">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-white">${team.name}</h3>
                                <p class="text-gray-400 text-sm mt-1">${team.division || 'League'}</p>
                            </div>
                            <button onclick="event.stopPropagation(); window.deleteTeam(${team.id})" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div class="mt-4">
                            <span class="text-xs text-gray-500">Click to switch context</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        window.openAddTeamModal = openAddTeamModal;
        window.closeAddTeamModal = closeAddTeamModal;
        window.deleteTeam = deleteTeam;
        window.selectTeam = (id) => {
            const team = teams.find(t => t.id === id);
            if (team) selectTeam(team);
        };
    }

    async function renderTrainingLoad() {
        const data = await apiCall(`/analytics/training-load?days=${STATE.periodDays}${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`);
        
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Training Load</h2>
                    <p class="text-gray-400">Load analysis for last ${STATE.periodDays} days</p>
                </div>
            </div>

            <div class="glass-panel rounded-2xl overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th class="px-6 py-4">Player</th>
                                <th class="px-6 py-4">Load Score</th>
                                <th class="px-6 py-4">Total Mins</th>
                                <th class="px-6 py-4">Avg Distance</th>
                                <th class="px-6 py-4">Recommendation</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800 text-sm">
                            ${data.players.map(p => `
                                <tr class="hover:bg-white/5 transition-colors">
                                    <td class="px-6 py-4 flex items-center gap-3">
                                        <img src="${p.photo_url || `https://ui-avatars.com/api/?name=${p.player_name}&background=random`}" class="w-8 h-8 rounded-full">
                                        <span class="font-medium text-white">${p.player_name}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div class="h-full ${p.load_score > 85 ? 'bg-red-500' : p.load_score > 50 ? 'bg-green-500' : 'bg-yellow-500'}" style="width: ${p.load_score}%"></div>
                                            </div>
                                            <span class="text-white">${p.load_score}%</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-white">${p.total_minutes} min</td>
                                    <td class="px-6 py-4 text-white">${p.avg_distance_km} km</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 rounded-full text-xs ${p.status === 'warning' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}">
                                            ${p.recommendation}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async function renderInjuryRisk() {
        const data = await apiCall(`/analytics/injury-risk${STATE.currentTeam ? `?team_id=${STATE.currentTeam.id}` : ''}`);
        
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Injury Risk Analysis</h2>
                    <p class="text-gray-400">Predictive analysis based on workload and biometrics</p>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
                ${data.players.map(p => `
                    <div class="glass-panel p-4 rounded-xl border-l-4 ${p.risk_level === 'high' ? 'border-red-500' : p.risk_level === 'medium' ? 'border-yellow-500' : 'border-green-500'}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <img src="${p.photo_url || `https://ui-avatars.com/api/?name=${p.player_name}&background=random`}" class="w-12 h-12 rounded-full">
                                <div>
                                    <h3 class="font-bold text-white">${p.player_name}</h3>
                                    <p class="text-sm text-gray-400">${p.position} | Risk Score: ${p.risk_score}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="px-3 py-1 rounded-full text-sm font-bold ${p.risk_level === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}">
                                    ${p.risk_level.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        ${p.risk_factors.length > 0 ? `
                            <div class="mt-4 pt-4 border-t border-gray-800">
                                <p class="text-xs text-gray-500 uppercase mb-2">Risk Factors</p>
                                <div class="flex flex-wrap gap-2">
                                    ${p.risk_factors.map(f => `<span class="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">${f}</span>`).join('')}
                                </div>
                                <p class="mt-2 text-sm text-pitch-accent"><i class="fa-solid fa-user-doctor mr-2"></i>${p.recommendation}</p>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    async function renderSchedule() {
        const events = await apiCall(`/schedule${STATE.currentTeam ? `?team_id=${STATE.currentTeam.id}` : ''}`);
        
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Schedule</h2>
                    <p class="text-gray-400">Upcoming matches and training sessions</p>
                </div>
            </div>

            <div class="space-y-4">
                ${events.length === 0 ? '<p class="text-gray-500">No upcoming events scheduled.</p>' : ''}
                ${events.map(event => `
                    <div class="glass-panel p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${event.is_important ? 'border border-pitch-accent/50' : ''}">
                        <div class="flex items-center gap-6">
                            <div class="text-center min-w-[60px]">
                                <p class="text-sm text-gray-400 uppercase">${new Date(event.event_date).toLocaleString('default', { month: 'short' })}</p>
                                <p class="text-2xl font-bold text-white">${new Date(event.event_date).getDate()}</p>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h3 class="text-xl font-bold text-white">${event.title}</h3>
                                    ${event.is_important ? '<span class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">IMPORTANT</span>' : ''}
                                </div>
                                <p class="text-gray-400">${event.event_type === 'match' ? `vs ${event.opponent}` : event.notes || 'Training Session'}</p>
                                <p class="text-sm text-gray-500 mt-1"><i class="fa-solid fa-location-dot mr-1"></i> ${event.location || 'Training Ground'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-2xl font-mono text-pitch-accent">${new Date(event.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async function renderAnalytics() {
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Analytics</h2>
                    <p class="text-gray-400">Deep dive into performance metrics</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.setPeriod(7)" class="px-4 py-2 rounded-lg ${STATE.periodDays === 7 ? 'bg-pitch-accent text-pitch-dark' : 'bg-pitch-light text-gray-400'}">7 Days</button>
                    <button onclick="window.setPeriod(30)" class="px-4 py-2 rounded-lg ${STATE.periodDays === 30 ? 'bg-pitch-accent text-pitch-dark' : 'bg-pitch-light text-gray-400'}">30 Days</button>
                </div>
            </div>
            
            <div class="glass-panel p-6 rounded-2xl mb-6">
                <h3 class="text-lg font-bold text-white mb-4">AI Insights</h3>
                <div id="ai-insights-container" class="space-y-3">
                    <p class="text-gray-400">Loading insights...</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="glass-panel p-6 rounded-2xl">
                    <canvas id="loadChart"></canvas>
                </div>
                <div class="glass-panel p-6 rounded-2xl">
                    <canvas id="riskChart"></canvas>
                </div>
            </div>
        `;

        window.setPeriod = (days) => {
            STATE.periodDays = days;
            renderAnalytics();
        };

        // Load Data
        const insights = await apiCall(`/analytics/insights?days=${STATE.periodDays}${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`);
        
        // Render Text Insights
        const container = document.getElementById('ai-insights-container');
        container.innerHTML = `
            ${insights.recovery_recommendations.map(r => `
                <div class="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <i class="fa-solid fa-bed-pulse text-blue-400 mt-1"></i>
                    <div>
                        <p class="text-white font-medium">${r.player_name}: ${r.reason}</p>
                        <p class="text-sm text-gray-400">${r.action}</p>
                    </div>
                </div>
            `).join('')}
            ${insights.workload_optimization.map(w => `
                <div class="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <i class="fa-solid fa-chart-line text-green-400 mt-1"></i>
                    <div>
                        <p class="text-white font-medium">${w.player_name}: ${w.current_load}</p>
                        <p class="text-sm text-gray-400">${w.recommendation}</p>
                    </div>
                </div>
            `).join('')}
        `;

        // Render Charts
        new Chart(document.getElementById('loadChart'), {
            type: 'bar',
            data: {
                labels: ['Recovery', 'Optimal', 'High Load'],
                datasets: [{
                    label: 'Player Distribution',
                    data: [insights.summary.players_needing_recovery, insights.summary.players_optimal_load, 0], // Simplified
                    backgroundColor: ['#ef4444', '#00ff88', '#fbbf24']
                }]
            },
            options: { plugins: { title: { display: true, text: 'Load Distribution', color: '#fff' } } }
        });
    }

    // --- Modals & Actions ---

    async function openAddPlayerModal() {
        const modal = document.getElementById('add-player-modal');
        modal.classList.remove('hidden');
        
        // Clear form
        document.getElementById('add-player-form').reset();
        document.getElementById('player-form-error').classList.add('hidden');
        window.playerPhotoData = null;
        document.getElementById('player-photo-preview').innerHTML = '<i class="fa-solid fa-user text-gray-500 text-3xl"></i>';
        document.getElementById('player-photo-clear').classList.add('hidden');
        
        // Populate team dropdown
        const teamSelect = document.getElementById('player-team');
        teamSelect.innerHTML = '<option value="">Select Team</option>';
        STATE.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (STATE.currentTeam && STATE.currentTeam.id === team.id) {
                option.selected = true;
            }
            teamSelect.appendChild(option);
        });
        
        // Handle photo upload
        document.getElementById('player-photo').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    window.playerPhotoData = event.target.result;
                    document.getElementById('player-photo-preview').innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
                    document.getElementById('player-photo-clear').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        };
        
        // Handle form submission
        document.getElementById('add-player-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('player-name').value.trim();
            const position = document.getElementById('player-position').value;
            const teamId = document.getElementById('player-team').value;
            const jersey = document.getElementById('player-jersey').value || 0;
            const birthDate = document.getElementById('player-birth-date').value;
            const errorDiv = document.getElementById('player-form-error');
            
            if (!name || !position) {
                errorDiv.textContent = 'Please fill in all required fields';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            try {
                errorDiv.classList.add('hidden');
                const playerData = {
                    name,
                    position,
                    team_id: teamId ? parseInt(teamId) : null,
                    jersey_number: jersey ? parseInt(jersey) : null,
                    birth_date: birthDate || null
                };
                
                // Only include photo_url if provided
                if (window.playerPhotoData) {
                    playerData.photo_url = window.playerPhotoData;
                }
                
                await apiCall('/players', 'POST', playerData);
                closeAddPlayerModal();
                await renderPlayers();
            } catch (e) {
                errorDiv.textContent = e.message || 'Failed to add player';
                errorDiv.classList.remove('hidden');
            }
        };
    }

    function closeAddPlayerModal() {
        document.getElementById('add-player-modal').classList.add('hidden');
    }

    function clearPlayerPhoto() {
        window.playerPhotoData = null;
        document.getElementById('player-photo').value = '';
        document.getElementById('player-photo-preview').innerHTML = '<i class="fa-solid fa-user text-gray-500 text-3xl"></i>';
        document.getElementById('player-photo-clear').classList.add('hidden');
    }

    async function deletePlayer(id) {
        if (!confirm("Are you sure you want to delete this player?")) return;
        try {
            await apiCall(`/players/${id}`, 'DELETE');
            await renderPlayers();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    async function editPlayer(id) {
        try {
            const player = await apiCall(`/players/${id}`);
            openEditPlayerModal(player);
        } catch (e) {
            alert('Error loading player: ' + e.message);
        }
    }

    async function openEditPlayerModal(player) {
        const modal = document.getElementById('edit-player-modal');
        modal.classList.remove('hidden');
        
        // Store current player ID for submission
        window.editingPlayerId = player.id;
        window.editPlayerPhotoData = null;
        
        // Populate form with current player data
        document.getElementById('edit-player-name').value = player.name || '';
        document.getElementById('edit-player-position').value = player.position || '';
        document.getElementById('edit-player-jersey').value = player.jersey_number || '';
        document.getElementById('edit-player-birth-date').value = player.birth_date || '';
        document.getElementById('edit-player-form-error').classList.add('hidden');
        
        // Set photo preview
        if (player.photo_url) {
            document.getElementById('edit-player-photo-preview').innerHTML = `<img src="${player.photo_url}" class="w-full h-full object-cover">`;
        } else {
            document.getElementById('edit-player-photo-preview').innerHTML = '<i class="fa-solid fa-user text-gray-500 text-3xl"></i>';
        }
        document.getElementById('edit-player-photo-clear').classList.add('hidden');
        document.getElementById('edit-player-photo').value = '';
        
        // Populate team dropdown
        const teamSelect = document.getElementById('edit-player-team');
        teamSelect.innerHTML = '<option value="">Select Team</option>';
        STATE.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (player.team_id && player.team_id === team.id) {
                option.selected = true;
            }
            teamSelect.appendChild(option);
        });
        
        // Handle photo upload
        document.getElementById('edit-player-photo').onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    window.editPlayerPhotoData = event.target.result;
                    document.getElementById('edit-player-photo-preview').innerHTML = `<img src="${event.target.result}" class="w-full h-full object-cover">`;
                    document.getElementById('edit-player-photo-clear').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        };
        
        // Handle form submission
        document.getElementById('edit-player-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('edit-player-name').value.trim();
            const position = document.getElementById('edit-player-position').value;
            const teamId = document.getElementById('edit-player-team').value;
            const jersey = document.getElementById('edit-player-jersey').value || 0;
            const birthDate = document.getElementById('edit-player-birth-date').value;
            const errorDiv = document.getElementById('edit-player-form-error');
            
            if (!name || !position) {
                errorDiv.textContent = 'Please fill in all required fields';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            try {
                errorDiv.classList.add('hidden');
                const playerData = {
                    name,
                    position,
                    team_id: teamId ? parseInt(teamId) : null,
                    jersey_number: jersey ? parseInt(jersey) : null,
                    birth_date: birthDate || null
                };
                
                // Only include photo_url if a new photo was uploaded
                if (window.editPlayerPhotoData) {
                    playerData.photo_url = window.editPlayerPhotoData;
                }
                
                await apiCall(`/players/${window.editingPlayerId}`, 'PUT', playerData);
                closeEditPlayerModal();
                await renderPlayers();
            } catch (e) {
                errorDiv.textContent = e.message || 'Failed to update player';
                errorDiv.classList.remove('hidden');
            }
        };
    }

    function closeEditPlayerModal() {
        document.getElementById('edit-player-modal').classList.add('hidden');
        window.editingPlayerId = null;
        window.editPlayerPhotoData = null;
    }

    function clearEditPlayerPhoto() {
        window.editPlayerPhotoData = null;
        document.getElementById('edit-player-photo').value = '';
        document.getElementById('edit-player-photo-preview').innerHTML = '<i class="fa-solid fa-user text-gray-500 text-3xl"></i>';
        document.getElementById('edit-player-photo-clear').classList.add('hidden');
    }

    async function viewPlayer(id) {
        const player = await apiCall(`/players/${id}`);
        alert(`Player: ${player.name}\nPosition: ${player.position}\nTeam ID: ${player.team_id}`);
    }

    async function openAddTeamModal() {
        const modal = document.getElementById('add-team-modal');
        modal.classList.remove('hidden');
        
        // Clear form
        document.getElementById('add-team-form').reset();
        document.getElementById('team-form-error').classList.add('hidden');
        
        // Sync color picker with hex input
        const colorPicker = document.getElementById('team-color-primary');
        const hexInput = document.getElementById('team-color-primary-hex');
        
        colorPicker.onchange = () => {
            hexInput.value = colorPicker.value;
        };
        hexInput.onchange = () => {
            colorPicker.value = hexInput.value;
        };
        
        // Handle form submission
        document.getElementById('add-team-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('team-name').value.trim();
            const division = document.getElementById('team-division').value.trim() || 'League';
            const colorPrimary = document.getElementById('team-color-primary').value;
            const errorDiv = document.getElementById('team-form-error');
            
            if (!name) {
                errorDiv.textContent = 'Please enter a team name';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            try {
                errorDiv.classList.add('hidden');
                await apiCall('/teams', 'POST', { 
                    name, 
                    division,
                    color_primary: colorPrimary
                });
                closeAddTeamModal();
                await loadInitialData();
                await renderTeams();
            } catch (e) {
                errorDiv.textContent = e.message || 'Failed to create team';
                errorDiv.classList.remove('hidden');
            }
        };
    }

    function closeAddTeamModal() {
        document.getElementById('add-team-modal').classList.add('hidden');
    }

    async function deleteTeam(id) {
        if (!confirm("Delete team and all associated players?")) return;
        try {
            await apiCall(`/teams/${id}`, 'DELETE');
            await loadInitialData();
            await renderTeams();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    }

    function exportReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("Football Performance Report", 20, 20);
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Team: ${STATE.currentTeam ? STATE.currentTeam.name : 'All'}`, 20, 40);
        
        doc.text("Summary:", 20, 50);
        doc.text("- Training Load Analysis included", 20, 60);
        doc.text("- Injury Risk Assessment included", 20, 70);
        
        doc.save("performance-report.pdf");
    }
});