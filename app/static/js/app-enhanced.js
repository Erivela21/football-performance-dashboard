/**
 * Football Performance Dashboard - Enhanced Application Logic
 * Handles Authentication, Routing, API Interactions, and UI Rendering
 */

/**
 * Toggle password visibility - show/hide password text
 * @param {string} inputId - The ID of the password input element
 * @param {Element} button - The button element that was clicked
 */
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Admin coach management functions - attached to window for HTML event handlers
window.openCreateCoachModal = function() {
    document.getElementById('create-coach-modal').classList.remove('hidden');
};

window.closeCreateCoachModal = function() {
    document.getElementById('create-coach-modal').classList.add('hidden');
    document.getElementById('create-coach-form').reset();
    document.getElementById('create-coach-error').classList.add('hidden');
};

window.submitCreateCoach = async function(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('create-coach-error');
    errorDiv.classList.add('hidden');
    
    const username = document.getElementById('new-coach-username').value;
    const email = document.getElementById('new-coach-email').value;
    const password = document.getElementById('new-coach-password').value;
    
    try {
        const response = await fetch('/admin/coaches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username, email, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            let msg = error.detail || 'Failed to create coach';
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            throw new Error(msg);
        }
        
        window.closeCreateCoachModal();
        // Reload admin panel
        const event = new HashChangeEvent('hashchange', { newURL: window.location.href.replace(/#.*/, '#admin') });
        window.location.hash = '#admin';
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    }
};

window.editCoach = function(id, username, email) {
    document.getElementById('edit-coach-id').value = id;
    document.getElementById('edit-coach-username').value = username;
    document.getElementById('edit-coach-email').value = email;
    document.getElementById('edit-coach-password').value = '';
    document.getElementById('edit-coach-error').classList.add('hidden');
    document.getElementById('edit-coach-modal').classList.remove('hidden');
};

window.closeEditCoachModal = function() {
    document.getElementById('edit-coach-modal').classList.add('hidden');
    document.getElementById('edit-coach-form').reset();
    document.getElementById('edit-coach-error').classList.add('hidden');
};

window.submitEditCoach = async function(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('edit-coach-error');
    errorDiv.classList.add('hidden');
    
    const id = document.getElementById('edit-coach-id').value;
    const username = document.getElementById('edit-coach-username').value;
    const email = document.getElementById('edit-coach-email').value;
    const password = document.getElementById('edit-coach-password').value;
    
    try {
        const payload = { username, email };
        if (password) payload.password = password; // Only send if provided
        
        const response = await fetch(`/admin/coaches/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            let msg = error.detail || 'Failed to update coach';
            if (typeof msg === 'object') msg = JSON.stringify(msg);
            throw new Error(msg);
        }
        
        window.closeEditCoachModal();
        // Reload admin panel
        window.location.hash = '#admin';
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    }
};

window.deleteCoach = async function(id, username) {
    if (!confirm(`Are you sure you want to delete coach "${username}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/admin/coaches/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete coach');
        }
        
        // Reload admin panel
        window.location.hash = '#admin';
    } catch (err) {
        alert('Error: ' + err.message);
    }
};

window.refreshCoachesList = async function() {
    console.log('🔄 Refreshing coaches list...');
    // Force re-render of admin panel by calling renderAdmin directly
    await renderAdmin();
};

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
    
    // API Response caching
    const CACHE = {
        data: new Map(),
        ttl: 30000 // 30 seconds
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

        // Registration Modal
        const registerModal = document.getElementById('register-modal');
        const registerLink = document.getElementById('register-link');
        const loginLink = document.getElementById('login-link');
        const closeRegisterBtn = document.getElementById('close-register');
        const registerForm = document.getElementById('register-form');

        console.log(`[DEBUG] Setup: registerLink=${registerLink ? 'found' : 'NOT FOUND'}, registerModal=${registerModal ? 'found' : 'NOT FOUND'}`);

        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[DEBUG] Register link clicked, showing modal');
                if (registerModal) {
                    registerModal.classList.remove('hidden');
                } else {
                    console.error('[DEBUG] registerModal is null!');
                }
            });
        } else {
            console.warn('[DEBUG] registerLink not found in DOM');
        }

        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[DEBUG] Login link clicked, hiding modal');
                if (registerModal) {
                    registerModal.classList.add('hidden');
                }
            });
        }

        if (closeRegisterBtn) {
            closeRegisterBtn.addEventListener('click', () => {
                console.log('[DEBUG] Close register button clicked');
                if (registerModal) {
                    registerModal.classList.add('hidden');
                }
            });
        }

        if (registerModal) {
            registerModal.addEventListener('click', (e) => {
                if (e.target === registerModal) {
                    console.log('[DEBUG] Modal backdrop clicked, hiding');
                    registerModal.classList.add('hidden');
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
        } else {
            console.warn('[DEBUG] registerForm not found in DOM');
        }

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
        updateProfileDisplay();
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
            
            // Get full user info including role
            const userResponse = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });
            
            if (userResponse.ok) {
                const userInfo = await userResponse.json();
                const role = userInfo.role && userInfo.role.trim() !== "" ? userInfo.role : "coach";
                console.log(`[DEBUG] Login successful: ${userInfo.username}, role='${role}'`);
                STATE.user = { 
                    username: userInfo.username,
                    email: userInfo.email,
                    role: role
                };
            } else {
                console.warn(`[DEBUG] /auth/me failed, defaulting role to 'coach'`);
                STATE.user = { username: username, role: 'coach' };
            }
            
            localStorage.setItem('token', STATE.token);
            localStorage.setItem('user', JSON.stringify(STATE.user));

            showApp();
            await loadInitialData();
            // Navigate to admin if admin, home if coach
            const initialPage = STATE.user.role === 'admin' ? 'admin' : 'home';
            console.log(`[DEBUG] Login redirect: navigating to '${initialPage}' (role='${STATE.user.role}')`);
            navigateTo(initialPage);

        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'An error occurred during login';
            errorDiv.classList.remove('hidden');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        console.log('[DEBUG] handleRegister called');
        const registerForm = document.getElementById('register-form');
        const usernameInput = registerForm.querySelector('input#reg-username');
        const emailInput = registerForm.querySelector('input#reg-email');
        const passwordInput = registerForm.querySelector('input#reg-password');
        const btn = registerForm.querySelector('button');
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        const registerModal = document.getElementById('register-modal');

        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        console.log(`[DEBUG] Registering user: ${username}, email: ${email}`);

        const originalText = btn.innerText;
        btn.innerText = 'Creating Account...';
        btn.disabled = true;
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');

        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            console.log(`[DEBUG] Register response status: ${response.status}`);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                let msg = errData.detail || 'Registration failed';
                if (typeof msg === 'object') {
                    msg = JSON.stringify(msg);
                }
                throw new Error(msg);
            }

            successDiv.textContent = 'Account created successfully! Redirecting to login...';
            successDiv.classList.remove('hidden');
            registerForm.reset();

            setTimeout(() => {
                registerModal.classList.add('hidden');
                document.getElementById('username').focus();
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = error.message || 'An error occurred during registration';
            errorDiv.classList.remove('hidden');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    window.logout = function() {
        STATE.token = null;
        STATE.user = null;
        // Clear all caches
        CACHE.data.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showLogin();
    };

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
        // Check cache for GET requests
        if (method === 'GET') {
            const cached = CACHE.data.get(endpoint);
            if (cached && Date.now() - cached.timestamp < CACHE.ttl) {
                return cached.data;
            }
        }
        
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
            // Clear related caches after DELETE/POST/PUT
            clearRelatedCache(endpoint, method);
            return null;
        }
        
        const data = await res.json();
        
        // Cache GET responses
        if (method === 'GET') {
            CACHE.data.set(endpoint, { data, timestamp: Date.now() });
        } else {
            // Clear related caches after mutations (POST, PUT, PATCH)
            clearRelatedCache(endpoint, method);
        }
        
        return data;
    }
    
    function clearRelatedCache(endpoint, method) {
        if (method === 'GET') return;
        
        // Clear caches that might be affected by this mutation
        if (endpoint.includes('/players')) {
            CACHE.data.delete('/players');
            // Also clear team-specific player caches
            STATE.teams.forEach(team => {
                CACHE.data.delete(`/players?team_id=${team.id}&limit=50`);
                CACHE.data.delete(`/players?team_id=${team.id}`);
            });
        }
        if (endpoint.includes('/analytics')) {
            CACHE.data.delete('/analytics/training-load');
            CACHE.data.delete('/analytics/injury-risk');
            CACHE.data.delete('/analytics/insights');
        }
        if (endpoint.includes('/teams')) {
            CACHE.data.delete('/teams');
        }
    }

    // --- Navigation & Routing ---
    async function navigateTo(page) {
        // SAFEGUARD: Prevent coaches from accessing admin page
        if (page === 'admin' && STATE.user.role !== 'admin') {
            console.warn(`[DEBUG] Coach ${STATE.user.username} tried to access admin panel - redirecting to home`);
            page = 'home';
        }
        
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
            console.log(`[DEBUG] Navigating to: ${page} (user role: ${STATE.user.role})`);
            switch(page) {
                case 'home': await renderHome(); break;
                case 'teams': await renderTeams(); break;
                case 'players': await renderPlayers(); break;
                case 'stats': await renderAnalytics(); break;
                case 'training-load': await renderTrainingLoad(); break;
                case 'injury-risk': await renderInjuryRisk(); break;
                case 'ml-predictions': await renderMLPredictions(); break;
                case 'schedule': await renderSchedule(); break;
                case 'admin': await renderAdmin(); break;
                default: STATE.user.role === 'admin' ? await renderAdmin() : await renderHome();
            }
        } catch (e) {
            console.error(`[DEBUG] Error navigating to ${page}:`, e);
            els.pageContent.innerHTML = `<div class="text-red-500 p-4">Error loading page: ${e.message}</div>`;
        }
    }

    // --- Global Seed Demo Data Function ---
    window.seedDemoDataGlobal = async function() {
        try {
            els.pageContent.innerHTML = '<div class="flex flex-col items-center justify-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-pitch-accent mb-4"></i><p class="text-gray-400">Loading demo data...</p></div>';
            const result = await apiCall('/teams/seed-demo-data', 'POST');
            alert(`Demo data loaded! Created team "${result.team_name}" with ${result.players_count} players.`);
            // Refresh teams and select the new team
            const newTeams = await apiCall('/teams');
            if (newTeams.length > 0) {
                selectTeam(newTeams[0]);
            }
            await navigateTo('home');
        } catch (e) {
            alert('Error loading demo data: ' + (e.message || e));
            await navigateTo('home');
        }
    };

    // --- Renderers ---

    async function renderHome() {
        // Fetch summary data
        console.log(`[DEBUG] renderHome: Loading dashboard for team=${STATE.currentTeam ? STATE.currentTeam.id : 'none'}, user role=${STATE.user.role}`);
        
        let insights = null;
        let schedule = [];
        let players = [];
        
        try {
            // Admins don't have access to analytics endpoints, so skip those
            if (STATE.user.role === 'admin') {
                console.log('[DEBUG] Admin user detected - skipping analytics and players (admin-only dashboard)');
                const scheduleResult = await apiCall(`/schedule?limit=1${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`).catch(e => {
                    console.warn('[DEBUG] Failed to load schedule:', e);
                    return [];
                });
                schedule = scheduleResult;
                insights = { recovery_recommendations: [], injury_prevention: [], workload_optimization: [], summary: { players_optimal_load: 0, players_needing_recovery: 0, total_players_analyzed: 0 } };
                players = [];
            } else {
                // Coaches can access analytics and players
                const results = await Promise.all([
                    apiCall(`/analytics/insights?days=7${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`).catch(e => {
                        console.warn('[DEBUG] Failed to load insights:', e);
                        return { recovery_recommendations: [], injury_prevention: [], workload_optimization: [], summary: { players_optimal_load: 0, players_needing_recovery: 0, total_players_analyzed: 0 } };
                    }),
                    apiCall(`/schedule?limit=1${STATE.currentTeam ? `&team_id=${STATE.currentTeam.id}` : ''}`).catch(e => {
                        console.warn('[DEBUG] Failed to load schedule:', e);
                        return [];
                    }),
                    apiCall(`/players${STATE.currentTeam ? `?team_id=${STATE.currentTeam.id}` : ''}`).catch(e => {
                        console.warn('[DEBUG] Failed to load players:', e);
                        return [];
                    })
                ]);
                insights = results[0];
                schedule = results[1];
                players = results[2];
            }
        } catch (e) {
            console.error('[DEBUG] renderHome: Promise.all failed:', e);
            throw e;
        }

        console.log(`[DEBUG] renderHome: Loaded insights=${insights ? 'ok' : 'null'}, schedule=${schedule.length}, players=${players.length}`);

        // Find next match (event with opponent, not just training)
        const nextMatch = schedule && schedule.length > 0 
            ? schedule.find(e => e.opponent) || schedule[0] 
            : null;
        const nextMatchText = nextMatch ? new Date(nextMatch.event_date).toLocaleDateString() : 'No upcoming';
        const nextMatchOpponent = nextMatch && nextMatch.opponent ? nextMatch.opponent : (nextMatch ? 'Training' : '-');
        const totalPlayers = players ? players.length : 0;

        // Show "Get Started" banner if no data
        const noDataBanner = totalPlayers === 0 && STATE.user.role !== 'admin' ? `
            <div class="glass-panel rounded-2xl p-8 mb-6 bg-gradient-to-r from-purple-900/30 to-pitch-accent/10 border border-pitch-accent/30">
                <div class="flex items-center gap-4 mb-4">
                    <div class="p-4 bg-pitch-accent/20 rounded-full">
                        <i class="fa-solid fa-wand-magic-sparkles text-3xl text-pitch-accent"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold text-white mb-1">Welcome to PitchPerfect!</h3>
                        <p class="text-gray-400">Get started by loading demo data or creating your first team.</p>
                    </div>
                </div>
                <div class="flex gap-4">
                    <button onclick="window.seedDemoDataGlobal()" class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                        <i class="fa-solid fa-magic mr-2"></i> Load Demo Data
                    </button>
                    <button onclick="window.navigateTo('teams')" class="bg-pitch-light border border-pitch-accent/30 text-pitch-accent px-6 py-3 rounded-lg hover:bg-pitch-accent hover:text-pitch-dark transition-colors font-medium">
                        <i class="fa-solid fa-plus mr-2"></i> Create Team Manually
                    </button>
                </div>
            </div>
        ` : '';

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

            ${noDataBanner}

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
                            <h3 class="text-3xl font-bold text-white mt-1">${totalPlayers}</h3>
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
                            <h3 class="text-3xl font-bold text-white mt-1">${insights && insights.summary ? insights.summary.players_optimal_load : 0} <span class="text-sm font-normal text-gray-400">Optimal</span></h3>
                        </div>
                        <div class="p-2 bg-pitch-secondary/10 rounded-lg text-pitch-secondary group-hover:bg-pitch-secondary group-hover:text-pitch-dark transition-colors">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-yellow-400">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                        <span>${insights && insights.summary ? insights.summary.players_needing_recovery : 0} need recovery</span>
                    </div>
                </div>

                <div onclick="window.navigateTo('injury-risk')" class="glass-panel p-6 rounded-2xl border-l-4 border-purple-500 hover:translate-y-[-2px] transition-transform cursor-pointer group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Injury Risk</p>
                            <h3 class="text-3xl font-bold text-white mt-1">${insights && insights.injury_prevention && insights.injury_prevention.length > 0 ? 'High' : 'Low'}</h3>
                        </div>
                        <div class="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <i class="fa-solid fa-heart-pulse"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-gray-400">
                        <span>${insights && insights.injury_prevention ? insights.injury_prevention.length : 0} alerts</span>
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
        const players = await apiCall(`/players${STATE.currentTeam ? `?team_id=${STATE.currentTeam.id}&limit=50` : '?limit=50'}`);
        
        // Show message when no players
        const noPlayersMessage = players.length === 0 ? `
            <div class="glass-panel p-8 rounded-2xl text-center border border-dashed border-pitch-accent/30 col-span-full">
                <i class="fa-solid fa-users-slash text-4xl text-gray-500 mb-4"></i>
                <h3 class="text-xl font-bold text-white mb-2">No Players Yet</h3>
                <p class="text-gray-400 mb-4">${STATE.currentTeam ? 'Add players to your team to get started.' : 'Create a team first, or load demo data.'}</p>
                <div class="flex justify-center gap-4">
                    ${!STATE.currentTeam ? `
                        <button onclick="window.seedDemoDataGlobal()" class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                            <i class="fa-solid fa-magic mr-2"></i> Load Demo Data
                        </button>
                    ` : `
                        <button onclick="window.openAddPlayerModal()" class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                            <i class="fa-solid fa-plus mr-2"></i> Add Player
                        </button>
                    `}
                </div>
            </div>
        ` : '';
        
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
                ${noPlayersMessage}
                ${players.map(player => `
                    <div class="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-all group relative">
                        <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onclick="window.editPlayer(${player.id})" class="text-pitch-accent hover:text-pitch-accent/80"><i class="fa-solid fa-edit"></i></button>
                            <button onclick="window.deletePlayer(${player.id})" class="text-red-400 hover:text-red-300"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div class="flex items-center gap-4 mb-4 cursor-pointer" onclick="window.viewPlayer(${player.id})">
                            <div class="w-16 h-16 rounded-full border-2 border-pitch-accent bg-pitch-accent/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                ${player.photo_url ? `<img src="${player.photo_url}" alt="${player.name}" class="w-full h-full object-cover" loading="lazy">` : `<i class="fa-solid fa-user text-pitch-accent text-2xl"></i>`}
                            </div>
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
                                <img src="${player.photo_url || `https://ui-avatars.com/api/?name=${player.name}&background=random`}" alt="${player.name}" class="w-10 h-10 rounded-full object-cover flex-shrink-0" loading="lazy">
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
        
        // Show seed demo data option if no teams
        const noTeamsMessage = teams.length === 0 ? `
            <div class="glass-panel p-8 rounded-2xl text-center mb-6 border border-dashed border-pitch-accent/30">
                <i class="fa-solid fa-database text-4xl text-pitch-accent mb-4"></i>
                <h3 class="text-xl font-bold text-white mb-2">No Teams Yet</h3>
                <p class="text-gray-400 mb-4">Get started quickly by loading demo data with a team, players, and training sessions.</p>
                <button onclick="window.seedDemoData()" class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                    <i class="fa-solid fa-magic mr-2"></i> Load Demo Data
                </button>
            </div>
        ` : '';
        
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

            ${noTeamsMessage}

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
        window.seedDemoData = async () => {
            try {
                const result = await apiCall('/teams/seed-demo-data', 'POST');
                alert(`Demo data loaded! Created team "${result.team_name}" with ${result.players_count} players.`);
                // Refresh teams list and select the new team
                const newTeams = await apiCall('/teams');
                if (newTeams.length > 0) {
                    selectTeam(newTeams[0]);
                }
                await renderTeams();
            } catch (e) {
                alert('Error loading demo data: ' + (e.message || e));
            }
        };
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

    async function renderMLPredictions() {
        const data = await apiCall('/analytics/ml-injury-prediction');
        
        els.pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">🤖 ML Injury Predictions</h2>
                    <p class="text-gray-400">Machine Learning model analyzing synthetic player data</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-xs ${data.team_summary.team_health_status === 'ALERT' ? 'bg-red-500/20 text-red-400' : data.team_summary.team_health_status === 'CAUTION' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}">
                        Team Status: ${data.team_summary.team_health_status}
                    </span>
                </div>
            </div>

            <!-- Model Info -->
            <div class="glass-panel p-4 rounded-xl mb-6 border border-pitch-accent/30">
                <div class="flex items-center gap-3 mb-2">
                    <i class="fa-solid fa-brain text-pitch-accent text-xl"></i>
                    <h3 class="font-bold text-white">${data.model_info.name}</h3>
                </div>
                <p class="text-sm text-gray-400 mb-2">Type: ${data.model_info.type}</p>
                <div class="flex flex-wrap gap-2">
                    ${data.model_info.factors_considered.map(f => `<span class="px-2 py-1 bg-pitch-accent/10 rounded text-xs text-pitch-accent">${f}</span>`).join('')}
                </div>
            </div>

            <!-- Team Summary -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="glass-panel p-4 rounded-xl text-center">
                    <p class="text-3xl font-bold text-white">${data.team_summary.total_players}</p>
                    <p class="text-sm text-gray-400">Total Players</p>
                </div>
                <div class="glass-panel p-4 rounded-xl text-center">
                    <p class="text-3xl font-bold text-pitch-accent">${data.team_summary.average_risk_score}%</p>
                    <p class="text-sm text-gray-400">Avg Risk Score</p>
                </div>
                <div class="glass-panel p-4 rounded-xl text-center border border-red-500/30">
                    <p class="text-3xl font-bold text-red-400">${data.team_summary.players_at_critical_risk}</p>
                    <p class="text-sm text-gray-400">Critical Risk</p>
                </div>
                <div class="glass-panel p-4 rounded-xl text-center border border-yellow-500/30">
                    <p class="text-3xl font-bold text-yellow-400">${data.team_summary.players_at_high_risk}</p>
                    <p class="text-sm text-gray-400">High Risk</p>
                </div>
            </div>

            <!-- Risk Distribution Chart -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="glass-panel p-6 rounded-xl">
                    <h3 class="text-lg font-bold text-white mb-4">Risk Distribution</h3>
                    <canvas id="mlRiskChart"></canvas>
                </div>
                <div class="glass-panel p-6 rounded-xl">
                    <h3 class="text-lg font-bold text-white mb-4">Top Risk Factors</h3>
                    <div class="space-y-3">
                        ${data.team_summary.top_risk_factors.map(f => `
                            <div class="flex items-center justify-between">
                                <span class="text-gray-300">${f.factor}</span>
                                <span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">${f.affected_players} players</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Player Predictions Table -->
            <div class="glass-panel p-6 rounded-xl">
                <h3 class="text-lg font-bold text-white mb-4">Individual Player Predictions</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th class="px-4 py-3">Player</th>
                                <th class="px-4 py-3">Position</th>
                                <th class="px-4 py-3">Age</th>
                                <th class="px-4 py-3">Risk Score</th>
                                <th class="px-4 py-3">Status</th>
                                <th class="px-4 py-3">Risk Factors</th>
                                <th class="px-4 py-3">Recommendation</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800 text-sm">
                            ${data.player_predictions.map(p => `
                                <tr class="hover:bg-white/5 transition-colors ${p.risk_level === 'critical' ? 'bg-red-500/5' : ''}">
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.player_name)}&background=random" class="w-8 h-8 rounded-full">
                                            <span class="font-medium text-white">${p.player_name}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-gray-400">${p.position}</td>
                                    <td class="px-4 py-3 text-gray-400">${p.age}</td>
                                    <td class="px-4 py-3">
                                        <div class="flex items-center gap-2">
                                            <div class="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div class="h-full ${p.risk_score >= 70 ? 'bg-red-500' : p.risk_score >= 50 ? 'bg-yellow-500' : p.risk_score >= 30 ? 'bg-blue-500' : 'bg-green-500'}" style="width: ${p.risk_score}%"></div>
                                            </div>
                                            <span class="text-white font-medium">${p.risk_score}%</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 rounded-full text-xs font-bold ${
                                            p.risk_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            p.risk_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            p.risk_level === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-green-500/20 text-green-400'
                                        }">${p.risk_level.toUpperCase()}</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="flex flex-wrap gap-1 max-w-xs">
                                            ${p.risk_factors.slice(0, 2).map(f => `
                                                <span class="px-1.5 py-0.5 bg-white/5 rounded text-xs text-gray-400" title="${f.description}">${f.factor}</span>
                                            `).join('')}
                                            ${p.risk_factors.length > 2 ? `<span class="text-xs text-gray-500">+${p.risk_factors.length - 2} more</span>` : ''}
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-xs text-gray-300 max-w-[200px]">${p.recommendation}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Render Risk Distribution Chart
        const dist = data.team_summary.risk_distribution;
        new Chart(document.getElementById('mlRiskChart'), {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Moderate', 'Low'],
                datasets: [{
                    data: [dist.critical, dist.high, dist.moderate, dist.low],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#9ca3af' } }
                }
            }
        });
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

    async function renderAdmin() {
        // Load coaches list
        console.log(`[DEBUG] renderAdmin: Fetching coaches for admin user '${STATE.user.username}'`);
        let coaches = [];
        try {
            console.log(`[DEBUG] renderAdmin: Token = ${STATE.token ? STATE.token.substring(0, 20) + '...' : 'NONE'}`);
            const response = await fetch('/admin/coaches', {
                headers: {
                    'Authorization': `Bearer ${STATE.token}`
                }
            });
            console.log(`[DEBUG] renderAdmin: Response status = ${response.status}`);
            if (response.ok) {
                coaches = await response.json();
                console.log(`✓ Loaded ${coaches.length} coaches from API`, coaches);
                if (coaches.length === 0) {
                    console.warn(`⚠️  WARNING: API returned 0 coaches. Check /admin/coaches endpoint`);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`✗ Failed to load coaches. Status: ${response.status}`, errorData);
                throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('✗ Failed to load coaches:', err);
            // Show error in UI
            els.pageContent.innerHTML = `
                <div class="bg-red-500/20 border border-red-500 text-red-200 p-6 rounded-lg">
                    <h3 class="font-bold mb-2">Error Loading Coaches</h3>
                    <p>${err.message}</p>
                    <p class="text-sm mt-2">Check browser console (F12) for details</p>
                </div>
            `;
            return;
        }
        
        console.log(`[DEBUG] renderAdmin: Rendering ${coaches.length} coaches`);
        
        const coachesHTML = coaches.map(coach => `
            <tr class="border-b border-gray-700 hover:bg-white/5 transition">
                <td class="px-6 py-4 text-white font-medium">${coach.username}</td>
                <td class="px-6 py-4 text-gray-400">${coach.email}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-sm font-medium ${coach.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">${coach.is_active ? 'Active' : 'Inactive'}</span></td>
                <td class="px-6 py-4 text-right space-x-2">
                    <button onclick="window.editCoach(${coach.id}, '${coach.username}', '${coach.email}')" class="px-3 py-1 text-sm bg-pitch-accent/20 text-pitch-accent hover:bg-pitch-accent/30 rounded-lg transition">Edit</button>
                    <button onclick="window.deleteCoach(${coach.id}, '${coach.username}')" class="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition">Delete</button>
                </td>
            </tr>
        `).join('');
        
        els.pageContent.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-3xl font-bold text-white mb-1">ADMIN PANEL</h2>
                        <p class="text-gray-400">Manage all coaches and their accounts</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="window.refreshCoachesList()" class="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition" title="Refresh coaches list">
                            <i class="fa-solid fa-arrows-rotate"></i>
                        </button>
                        <button onclick="window.openCreateCoachModal()" class="px-6 py-3 bg-gradient-to-r from-pitch-accent to-emerald-600 text-pitch-dark font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition">
                            <i class="fa-solid fa-plus mr-2"></i>Create Coach
                        </button>
                    </div>
                </div>
                
                <div class="glass-panel p-6 rounded-xl border border-gray-700">
                    <table class="w-full">
                        <thead class="border-b border-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-400">Username</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-400">Email</th>
                                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                                <th class="px-6 py-3 text-right text-sm font-semibold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${coachesHTML || '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-400">No coaches yet</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Create Coach Modal -->
            <div id="create-coach-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="bg-pitch-light border border-gray-700 rounded-2xl p-8 w-full max-w-md mx-4 space-y-6">
                    <h3 class="text-2xl font-bold text-white">Create New Coach</h3>
                    <form id="create-coach-form" class="space-y-4" onsubmit="window.submitCreateCoach(event)">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Username</label>
                            <input type="text" id="new-coach-username" required class="w-full bg-pitch-dark border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input type="email" id="new-coach-email" required class="w-full bg-pitch-dark border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Password</label>
                            <div class="relative">
                                <input type="password" id="new-coach-password" required class="w-full bg-pitch-dark border border-gray-700 rounded-lg py-2 px-4 pr-12 text-white focus:outline-none focus:border-pitch-accent">
                                <button type="button" onclick="togglePasswordVisibility('new-coach-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div id="create-coach-error" class="hidden bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm"></div>
                        <div class="flex gap-3 justify-end pt-4">
                            <button type="button" onclick="window.closeCreateCoachModal()" class="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/5">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-pitch-accent text-pitch-dark font-bold rounded-lg hover:shadow-lg">Create</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Edit Coach Modal -->
            <div id="edit-coach-modal" class="hidden fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                <div class="bg-pitch-light border border-gray-700 rounded-2xl p-8 w-full max-w-md mx-4 space-y-6">
                    <h3 class="text-2xl font-bold text-white">Edit Coach</h3>
                    <form id="edit-coach-form" class="space-y-4" onsubmit="window.submitEditCoach(event)">
                        <input type="hidden" id="edit-coach-id">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Username</label>
                            <input type="text" id="edit-coach-username" required class="w-full bg-pitch-dark border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input type="email" id="edit-coach-email" required class="w-full bg-pitch-dark border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">New Password (leave blank to keep)</label>
                            <div class="relative">
                                <input type="password" id="edit-coach-password" class="w-full bg-pitch-dark border border-gray-700 rounded-lg py-2 px-4 pr-12 text-white focus:outline-none focus:border-pitch-accent">
                                <button type="button" onclick="togglePasswordVisibility('edit-coach-password', this)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>
                        <div id="edit-coach-error" class="hidden bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm"></div>
                        <div class="flex gap-3 justify-end pt-4">
                            <button type="button" onclick="window.closeEditCoachModal()" class="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/5">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-pitch-accent text-pitch-dark font-bold rounded-lg hover:shadow-lg">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Expose renderAdmin globally so refresh button can call it
        window.renderAdmin = renderAdmin;
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
                // Validate file size (max 5MB as base64)
                const maxSize = 5 * 1024 * 1024;  // 5MB
                if (file.size > maxSize) {
                    alert('Photo size must be less than 5MB');
                    e.target.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    window.playerPhotoData = event.target.result;
                    console.log(`[DEBUG] Player photo loaded: ${(window.playerPhotoData.length / 1024).toFixed(2)}KB`);
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
            const surname = document.getElementById('player-surname').value.trim();
            const aka = document.getElementById('player-aka').value.trim();
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
                    surname: surname || null,
                    aka: aka || null,
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
                // Also refresh HOME page stats
                if (window.location.hash === '#home' || window.location.hash === '') {
                    await renderHome();
                }
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
        
        // Store current player ID and EXISTING photo for submission
        window.editingPlayerId = player.id;
        window.editPlayerPhotoData = null;
        window.existingPlayerPhoto = player.photo_url || null;  // Store existing photo to preserve on edit
        console.log(`[DEBUG] Opening edit modal for player ${player.id} with existing photo: ${window.existingPlayerPhoto ? 'YES (' + window.existingPlayerPhoto.substring(0, 50) + '...)' : 'NO'}`);
        
        // Populate form with current player data
        document.getElementById('edit-player-name').value = player.name || '';
        document.getElementById('edit-player-surname').value = player.surname || '';
        document.getElementById('edit-player-aka').value = player.aka || '';
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
                // Validate file size (max 5MB as base64)
                const maxSize = 5 * 1024 * 1024;  // 5MB
                if (file.size > maxSize) {
                    alert('Photo size must be less than 5MB');
                    e.target.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    window.editPlayerPhotoData = event.target.result;
                    console.log(`[DEBUG] Edit player photo loaded: ${(window.editPlayerPhotoData.length / 1024).toFixed(2)}KB`);
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
            const surname = document.getElementById('edit-player-surname').value.trim();
            const aka = document.getElementById('edit-player-aka').value.trim();
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
                    surname: surname || null,
                    aka: aka || null,
                    position,
                    team_id: teamId ? parseInt(teamId) : null,
                    jersey_number: jersey ? parseInt(jersey) : null,
                    birth_date: birthDate || null
                };
                
                // Always include photo_url: use new if uploaded, otherwise preserve existing
                if (window.editPlayerPhotoData) {
                    playerData.photo_url = window.editPlayerPhotoData;
                    console.log(`[DEBUG] Update player ${window.editingPlayerId}: NEW photo (${window.editPlayerPhotoData.length} bytes)`);
                } else if (window.existingPlayerPhoto) {
                    playerData.photo_url = window.existingPlayerPhoto;
                    console.log(`[DEBUG] Update player ${window.editingPlayerId}: PRESERVING existing photo (${window.existingPlayerPhoto.length} bytes)`);
                } else {
                    console.log(`[DEBUG] Update player ${window.editingPlayerId}: NO photo`);
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

    // Settings functions - exposed globally
    window.openSettingsModal = async function() {
        const modal = document.getElementById('settings-modal');
        modal.classList.remove('hidden');
        
        // Load current user data
        document.getElementById('settings-username').value = STATE.user?.username || '';
        document.getElementById('settings-email').value = STATE.user?.email || '';
        document.getElementById('settings-password').value = '';
        document.getElementById('settings-form-error').classList.add('hidden');
        
        // Handle form submission
        document.getElementById('settings-form').onsubmit = async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('settings-username').value.trim();
            const email = document.getElementById('settings-email').value.trim();
            const password = document.getElementById('settings-password').value;
            const errorDiv = document.getElementById('settings-form-error');
            const btn = document.querySelector('#settings-form button');
            const originalText = btn.innerText;
            
            if (!username) {
                errorDiv.textContent = 'Username is required';
                errorDiv.classList.remove('hidden');
                return;
            }
            
            try {
                errorDiv.classList.add('hidden');
                btn.innerText = 'Updating...';
                btn.disabled = true;
                
                // Call backend endpoint to update profile
                const response = await fetch(`${API_BASE}/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${STATE.token}`
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email || null,
                        password: password || null
                    })
                });
                
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.detail || 'Failed to update profile');
                }
                
                const updatedUser = await response.json();
                
                // Update local STATE with new data
                STATE.user.username = updatedUser.username;
                STATE.user.email = updatedUser.email;
                localStorage.setItem('user', JSON.stringify(STATE.user));
                
                // Update profile display
                updateProfileDisplay();
                
                // Show success and close
                alert('Settings updated successfully! Please login again with your new credentials.');
                window.closeSettingsModal();
                
            } catch (e) {
                errorDiv.textContent = e.message || 'Failed to update settings';
                errorDiv.classList.remove('hidden');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        };
    };

    window.closeSettingsModal = function() {
        document.getElementById('settings-modal').classList.add('hidden');
    };

    // Initialize profile display on page load
    function updateProfileDisplay() {
        if (STATE.user?.username) {
            const isAdmin = STATE.user.role === 'admin';
            
            // Set profile display name - just username for admin, "Coach [username]" for coaches
            if (isAdmin) {
                document.getElementById('profile-name').textContent = STATE.user.username;
            } else {
                document.getElementById('profile-name').textContent = `Coach ${STATE.user.username}`;
            }
            
            document.getElementById('profile-avatar').src = `https://ui-avatars.com/api/?name=${STATE.user.username}&background=${isAdmin ? 'ff3366' : '00ff88'}&color=0a0f1c`;
            
            // Show/hide nav links based on role
            const adminLink = document.getElementById('admin-nav-link');
            const teamsLink = document.getElementById('teams-nav-link');
            const playersLink = document.getElementById('players-nav-link');
            const statsLink = document.getElementById('stats-nav-link');
            
            if (isAdmin) {
                // Admin: show admin link, hide teams/players/stats
                adminLink.classList.remove('hidden');
                adminLink.classList.add('flex');
                teamsLink.classList.add('hidden');
                playersLink.classList.add('hidden');
                statsLink.classList.add('hidden');
            } else {
                // Coach: hide admin link, show teams/players/stats
                adminLink.classList.add('hidden');
                adminLink.classList.remove('flex');
                teamsLink.classList.remove('hidden');
                playersLink.classList.remove('hidden');
                statsLink.classList.remove('hidden');
            }
        }
    }
});