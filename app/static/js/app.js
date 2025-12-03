// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authOverlay = document.getElementById('auth-overlay');
    const appLayout = document.getElementById('app-layout');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerModal = document.getElementById('register-modal');
    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');
    const closeRegisterBtn = document.getElementById('close-register');
    const navItems = document.querySelectorAll('.nav-item');
    const pageContent = document.getElementById('page-content');

    // Current page state
    let currentPage = 'home';

    // --- Registration Modal Handling ---
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('hidden');
    });

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.add('hidden');
    });

    closeRegisterBtn.addEventListener('click', () => {
        registerModal.classList.add('hidden');
    });

    registerModal.addEventListener('click', (e) => {
        if (e.target === registerModal) {
            registerModal.classList.add('hidden');
        }
    });

    // --- Registration Form Handling ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = registerForm.querySelector('button');
        const errorDiv = document.getElementById('register-error');
        const successDiv = document.getElementById('register-success');
        const originalText = btn.innerText;

        btn.innerText = 'Creating Account...';
        btn.disabled = true;
        errorDiv.classList.add('hidden');
        successDiv.classList.add('hidden');

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            const data = await response.json();
            
            successDiv.textContent = 'Account created successfully! Redirecting to login...';
            successDiv.classList.remove('hidden');

            // Clear form
            registerForm.reset();

            // Redirect to login after 2 seconds
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
    });

    // --- Authentication Handling ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button');
        const errorDiv = document.getElementById('login-error');
        const originalText = btn.innerText;

        btn.innerText = 'Authenticating...';
        btn.disabled = true;
        errorDiv.classList.add('hidden');

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();
            
            // Store token
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_type', data.token_type);
            
            // Success animation
            authOverlay.classList.add('opacity-0', 'pointer-events-none', 'transition-opacity', 'duration-500');
            appLayout.classList.remove('hidden');

            // Initialize charts after layout is visible
            renderPage('home');
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'An error occurred during login';
            errorDiv.classList.remove('hidden');
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // --- Navigation Handling ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('href').substring(1);
            renderPage(page);

            // Update active state
            navItems.forEach(nav => {
                nav.classList.remove('bg-pitch-accent/10', 'text-pitch-accent', 'border', 'border-pitch-accent/20');
                nav.classList.add('text-gray-400', 'hover:bg-white/5', 'hover:text-white');
            });

            item.classList.remove('text-gray-400', 'hover:bg-white/5', 'hover:text-white');
            item.classList.add('bg-pitch-accent/10', 'text-pitch-accent', 'border', 'border-pitch-accent/20');
        });
    });

    // --- Page Rendering ---
    function renderPage(page) {
        currentPage = page;

        switch(page) {
            case 'home':
                renderHome();
                break;
            case 'teams':
                renderTeams();
                break;
            case 'players':
                renderPlayers();
                break;
            case 'stats':
                renderStats();
                break;
            default:
                renderHome();
        }
    }

    function renderHome() {
        pageContent.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Dashboard</h2>
                    <p class="text-gray-400">Welcome back, Coach. Here's today's overview.</p>
                </div>
                <button class="bg-pitch-light border border-pitch-accent/30 text-pitch-accent px-4 py-2 rounded-lg hover:bg-pitch-accent hover:text-pitch-dark transition-colors text-sm font-medium">
                    <i class="fa-solid fa-download mr-2"></i> Export Report
                </button>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="glass-panel p-6 rounded-2xl border-l-4 border-pitch-accent hover:translate-y-[-2px] transition-transform">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Active Players</p>
                            <h3 class="text-3xl font-bold text-white mt-1">24</h3>
                        </div>
                        <div class="p-2 bg-pitch-accent/10 rounded-lg text-pitch-accent">
                            <i class="fa-solid fa-user-group"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-green-400">
                        <i class="fa-solid fa-arrow-up mr-1"></i>
                        <span>2 from last week</span>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-2xl border-l-4 border-pitch-secondary hover:translate-y-[-2px] transition-transform">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Training Load</p>
                            <h3 class="text-3xl font-bold text-white mt-1">87%</h3>
                        </div>
                        <div class="p-2 bg-pitch-secondary/10 rounded-lg text-pitch-secondary">
                            <i class="fa-solid fa-bolt"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-yellow-400">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>
                        <span>High intensity warning</span>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-2xl border-l-4 border-purple-500 hover:translate-y-[-2px] transition-transform">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Injury Risk</p>
                            <h3 class="text-3xl font-bold text-white mt-1">Low</h3>
                        </div>
                        <div class="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <i class="fa-solid fa-heart-pulse"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-gray-400">
                        <span>3 players monitoring</span>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-2xl border-l-4 border-orange-500 hover:translate-y-[-2px] transition-transform">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-sm font-medium">Next Match</p>
                            <h3 class="text-3xl font-bold text-white mt-1">2 Days</h3>
                        </div>
                        <div class="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                            <i class="fa-solid fa-calendar"></i>
                        </div>
                    </div>
                    <div class="flex items-center text-xs text-gray-400">
                        <span>vs. Rivals FC</span>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
                    <h3 class="text-lg font-bold text-white mb-6">Team Workload Trends</h3>
                    <canvas id="workloadChart" height="250"></canvas>
                </div>
                <div class="glass-panel p-6 rounded-2xl">
                    <h3 class="text-lg font-bold text-white mb-6">Readiness Score</h3>
                    <canvas id="readinessChart" height="250"></canvas>
                </div>
            </div>
            
            <!-- Player List Preview -->
            <div class="glass-panel rounded-2xl overflow-hidden">
                <div class="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-white">Top Performers</h3>
                    <button class="text-sm text-pitch-accent hover:underline">View All</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th class="px-6 py-4">Player</th>
                                <th class="px-6 py-4">Position</th>
                                <th class="px-6 py-4">Sprint Distance</th>
                                <th class="px-6 py-4">Top Speed</th>
                                <th class="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800 text-sm">
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 flex items-center gap-3">
                                    <img src="https://ui-avatars.com/api/?name=Alex+R&background=random" class="w-8 h-8 rounded-full">
                                    <span class="font-medium text-white">Alex Rivera</span>
                                </td>
                                <td class="px-6 py-4 text-gray-400">Midfielder</td>
                                <td class="px-6 py-4 text-white">8.4 km</td>
                                <td class="px-6 py-4 text-white">32.1 km/h</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Optimal</span></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 flex items-center gap-3">
                                    <img src="https://ui-avatars.com/api/?name=Marcus+J&background=random" class="w-8 h-8 rounded-full">
                                    <span class="font-medium text-white">Marcus Jones</span>
                                </td>
                                <td class="px-6 py-4 text-gray-400">Forward</td>
                                <td class="px-6 py-4 text-white">7.2 km</td>
                                <td class="px-6 py-4 text-white">34.5 km/h</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">Fatigue</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        initCharts();
    }

    function renderTeams() {
        pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Teams</h2>
                    <p class="text-gray-400">Manage and monitor all your teams.</p>
                </div>
                <button class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                    <i class="fa-solid fa-plus mr-2"></i> Add Team
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="glass-panel p-6 rounded-2xl border-t-2 border-pitch-accent hover:translate-y-[-4px] transition-transform cursor-pointer">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">Senior Team</h3>
                            <p class="text-gray-400 text-sm mt-1">Premier Division</p>
                        </div>
                        <div class="p-2 bg-pitch-accent/10 rounded-lg text-pitch-accent text-lg">
                            <i class="fa-solid fa-shield-halved"></i>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <p class="text-gray-400 text-xs uppercase">Players</p>
                            <p class="text-2xl font-bold text-white">24</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-xs uppercase">Avg. Age</p>
                            <p class="text-2xl font-bold text-white">26</p>
                        </div>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-2xl border-t-2 border-pitch-secondary hover:translate-y-[-4px] transition-transform cursor-pointer">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">U-21 Academy</h3>
                            <p class="text-gray-400 text-sm mt-1">Development</p>
                        </div>
                        <div class="p-2 bg-pitch-secondary/10 rounded-lg text-pitch-secondary text-lg">
                            <i class="fa-solid fa-star"></i>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <p class="text-gray-400 text-xs uppercase">Players</p>
                            <p class="text-2xl font-bold text-white">18</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-xs uppercase">Avg. Age</p>
                            <p class="text-2xl font-bold text-white">19</p>
                        </div>
                    </div>
                </div>

                <div class="glass-panel p-6 rounded-2xl border-t-2 border-purple-500 hover:translate-y-[-4px] transition-transform cursor-pointer">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-white">Reserve Team</h3>
                            <p class="text-gray-400 text-sm mt-1">Secondary</p>
                        </div>
                        <div class="p-2 bg-purple-500/10 rounded-lg text-purple-400 text-lg">
                            <i class="fa-solid fa-users"></i>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-6">
                        <div>
                            <p class="text-gray-400 text-xs uppercase">Players</p>
                            <p class="text-2xl font-bold text-white">15</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-xs uppercase">Avg. Age</p>
                            <p class="text-2xl font-bold text-white">23</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPlayers() {
        pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Players</h2>
                    <p class="text-gray-400">View and manage player profiles.</p>
                </div>
                <button class="bg-pitch-accent text-pitch-dark px-6 py-3 rounded-lg hover:bg-pitch-accent/90 transition-colors font-medium">
                    <i class="fa-solid fa-plus mr-2"></i> Add Player
                </button>
            </div>

            <div class="glass-panel rounded-2xl overflow-hidden">
                <div class="p-6 border-b border-gray-800">
                    <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div class="relative flex-1 md:max-w-sm">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-gray-500"></i>
                            <input type="text" placeholder="Search players..." class="w-full bg-pitch-light border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-pitch-accent">
                        </div>
                        <select class="bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                            <option>All Positions</option>
                            <option>Forward</option>
                            <option>Midfielder</option>
                            <option>Defender</option>
                            <option>Goalkeeper</option>
                        </select>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th class="px-6 py-4">Name</th>
                                <th class="px-6 py-4">Number</th>
                                <th class="px-6 py-4">Position</th>
                                <th class="px-6 py-4">Age</th>
                                <th class="px-6 py-4">Appearances</th>
                                <th class="px-6 py-4">Goals</th>
                                <th class="px-6 py-4">Status</th>
                                <th class="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800 text-sm">
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 flex items-center gap-3">
                                    <img src="https://ui-avatars.com/api/?name=Alex+R&background=random" class="w-8 h-8 rounded-full">
                                    <span class="font-medium text-white">Alex Rivera</span>
                                </td>
                                <td class="px-6 py-4 text-gray-400">#7</td>
                                <td class="px-6 py-4 text-white">Midfielder</td>
                                <td class="px-6 py-4 text-white">26</td>
                                <td class="px-6 py-4 text-white">42</td>
                                <td class="px-6 py-4 text-white">8</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Fit</span></td>
                                <td class="px-6 py-4"><button class="text-pitch-accent hover:underline text-xs">View</button></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 flex items-center gap-3">
                                    <img src="https://ui-avatars.com/api/?name=Marcus+J&background=random" class="w-8 h-8 rounded-full">
                                    <span class="font-medium text-white">Marcus Jones</span>
                                </td>
                                <td class="px-6 py-4 text-gray-400">#9</td>
                                <td class="px-6 py-4 text-white">Forward</td>
                                <td class="px-6 py-4 text-white">28</td>
                                <td class="px-6 py-4 text-white">50</td>
                                <td class="px-6 py-4 text-white">15</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">Monitoring</span></td>
                                <td class="px-6 py-4"><button class="text-pitch-accent hover:underline text-xs">View</button></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 flex items-center gap-3">
                                    <img src="https://ui-avatars.com/api/?name=James+K&background=random" class="w-8 h-8 rounded-full">
                                    <span class="font-medium text-white">James King</span>
                                </td>
                                <td class="px-6 py-4 text-gray-400">#3</td>
                                <td class="px-6 py-4 text-white">Defender</td>
                                <td class="px-6 py-4 text-white">24</td>
                                <td class="px-6 py-4 text-white">35</td>
                                <td class="px-6 py-4 text-white">2</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Fit</span></td>
                                <td class="px-6 py-4"><button class="text-pitch-accent hover:underline text-xs">View</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderStats() {
        pageContent.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-bold text-white mb-1">Analytics</h2>
                    <p class="text-gray-400">Detailed performance statistics and insights.</p>
                </div>
                <select class="bg-pitch-light border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-pitch-accent">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                    <option>This Season</option>
                </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="glass-panel p-6 rounded-2xl">
                    <h3 class="text-lg font-bold text-white mb-6">Performance Metrics</h3>
                    <canvas id="performanceChart" height="200"></canvas>
                </div>
                <div class="glass-panel p-6 rounded-2xl">
                    <h3 class="text-lg font-bold text-white mb-6">Position Distribution</h3>
                    <canvas id="positionChart" height="200"></canvas>
                </div>
            </div>

            <div class="glass-panel rounded-2xl overflow-hidden">
                <div class="p-6 border-b border-gray-800">
                    <h3 class="text-lg font-bold text-white">Top Statistics</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th class="px-6 py-4">Statistic</th>
                                <th class="px-6 py-4">Player</th>
                                <th class="px-6 py-4">Value</th>
                                <th class="px-6 py-4">Trend</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-800 text-sm">
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 text-white font-medium">Distance Covered</td>
                                <td class="px-6 py-4 text-gray-400">Alex Rivera</td>
                                <td class="px-6 py-4 text-white">12.4 km</td>
                                <td class="px-6 py-4"><span class="text-green-400 text-xs">↑ +2.1%</span></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 text-white font-medium">Top Speed</td>
                                <td class="px-6 py-4 text-gray-400">Marcus Jones</td>
                                <td class="px-6 py-4 text-white">34.5 km/h</td>
                                <td class="px-6 py-4"><span class="text-yellow-400 text-xs">→ -0.5%</span></td>
                            </tr>
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="px-6 py-4 text-white font-medium">Sprints</td>
                                <td class="px-6 py-4 text-gray-400">James King</td>
                                <td class="px-6 py-4 text-white">28</td>
                                <td class="px-6 py-4"><span class="text-green-400 text-xs">↑ +5.2%</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        initChartsStats();
    }

    // --- Chart.js Initialization ---
    function initCharts() {
        // Workload Chart
        const ctxWorkload = document.getElementById('workloadChart');
        if (ctxWorkload) {
            new Chart(ctxWorkload.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Team Avg Load',
                        data: [65, 78, 90, 85, 70, 95, 60],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#0a0f1c',
                        pointBorderColor: '#00ff88',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(26, 35, 50, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#ccc',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#6b7280' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#6b7280' }
                        }
                    }
                }
            });
        }

        // Readiness Chart
        const ctxReadiness = document.getElementById('readinessChart');
        if (ctxReadiness) {
            new Chart(ctxReadiness.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Optimal', 'Fatigued', 'Risk'],
                    datasets: [{
                        data: [18, 5, 1],
                        backgroundColor: ['#00ff88', '#fbbf24', '#ef4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9ca3af', usePointStyle: true, padding: 20 }
                        }
                    }
                }
            });
        }
    }

    function initChartsStats() {
        // Performance Chart
        const ctxPerformance = document.getElementById('performanceChart');
        if (ctxPerformance) {
            new Chart(ctxPerformance.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Speed', 'Endurance', 'Strength', 'Agility', 'Recovery'],
                    datasets: [{
                        label: 'Team Average',
                        data: [85, 72, 78, 88, 65],
                        backgroundColor: [
                            '#00ff88',
                            '#00ccff',
                            '#fbbf24',
                            '#f472b6',
                            '#a78bfa'
                        ],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#6b7280' }
                        },
                        y: {
                            ticks: { color: '#9ca3af' }
                        }
                    }
                }
            });
        }

        // Position Distribution Chart
        const ctxPosition = document.getElementById('positionChart');
        if (ctxPosition) {
            new Chart(ctxPosition.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['Forwards', 'Midfielders', 'Defenders', 'Goalkeepers'],
                    datasets: [{
                        data: [6, 8, 8, 2],
                        backgroundColor: [
                            '#ef4444',
                            '#00ff88',
                            '#3b82f6',
                            '#fbbf24'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#9ca3af', usePointStyle: true, padding: 20 }
                        }
                    }
                }
            });
        }
    }
});
