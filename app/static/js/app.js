// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authOverlay = document.getElementById('auth-overlay');
    const appLayout = document.getElementById('app-layout');
    const loginForm = document.getElementById('login-form');
    const navItems = document.querySelectorAll('.nav-item');

    // --- Authentication Handling ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Simulate API call
        const btn = loginForm.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Authenticating...';
        btn.disabled = true;

        setTimeout(() => {
            // Success animation
            authOverlay.classList.add('opacity-0', 'pointer-events-none', 'transition-opacity', 'duration-500');
            appLayout.classList.remove('hidden');

            // Initialize charts after layout is visible
            initCharts();
        }, 1500);
    });

    // --- Navigation Handling ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Update active state
            navItems.forEach(nav => {
                nav.classList.remove('bg-pitch-accent/10', 'text-pitch-accent', 'border', 'border-pitch-accent/20');
                nav.classList.add('text-gray-400', 'hover:bg-white/5', 'hover:text-white');
            });

            e.currentTarget.classList.remove('text-gray-400', 'hover:bg-white/5', 'hover:text-white');
            e.currentTarget.classList.add('bg-pitch-accent/10', 'text-pitch-accent', 'border', 'border-pitch-accent/20');
        });
    });

    // --- Chart.js Initialization ---
    function initCharts() {
        // Workload Chart
        const ctxWorkload = document.getElementById('workloadChart').getContext('2d');
        new Chart(ctxWorkload, {
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

        // Readiness Chart
        const ctxReadiness = document.getElementById('readinessChart').getContext('2d');
        new Chart(ctxReadiness, {
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
});
