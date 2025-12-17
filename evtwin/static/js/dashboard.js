// dashboard.js
// Handles real-time updates for the dashboard using Socket.IO and Chart.js

// --- Configuration ---
const CONFIG = {
    socketUrl: location.protocol + '//' + document.domain + ':' + location.port,
    chartColors: {
        power: '#1a73e8', // Google Blue
        temp: '#d93025',  // Google Red
        grid: '#f1f3f4',
        text: '#5f6368'
    },
    maxDataPoints: 50
};

// --- State ---
let socket;
let trendsChart;
let efficiencyChart;
let healthChart;
let currentRole = 'worker'; // Default
let machineDataHistory = {
    labels: [],
    m1Power: [],
    m2Power: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initSocket();
    initCharts();
    setupEventListeners();
    
    // Initialize role from selector if present
    const roleSelect = document.getElementById('role-select');
    if (roleSelect) {
        currentRole = roleSelect.value;
    }
});

function initSocket() {
    socket = io.connect(CONFIG.socketUrl);

    socket.on('connect', () => {
        console.log('Connected to server');
        showToast('Connected to Digital Twin Server', 'success');
    });

    socket.on('machine_data', (data) => {
        updateDashboard(data);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showToast('Disconnected from server', 'error');
    });
}

function initCharts() {
    // Trends Chart
    const ctxTrends = document.getElementById('trendsChart');
    if (ctxTrends) {
        trendsChart = new Chart(ctxTrends, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'M1 Power (W)',
                        borderColor: CONFIG.chartColors.power,
                        backgroundColor: 'rgba(26, 115, 232, 0.05)',
                        data: [],
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    },
                    {
                        label: 'M2 Power (W)',
                        borderColor: '#9334e6', // Purple
                        backgroundColor: 'rgba(147, 52, 230, 0.05)',
                        data: [],
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: CONFIG.chartColors.text, usePointStyle: true } }
                },
                scales: {
                    x: { 
                        grid: { display: false },
                        ticks: { color: CONFIG.chartColors.text, maxTicksLimit: 8 }
                    },
                    y: { 
                        grid: { color: CONFIG.chartColors.grid, borderDash: [5, 5] },
                        ticks: { color: CONFIG.chartColors.text }
                    }
                },
                animation: false // Disable animation for real-time performance
            }
        });
    }

    // Efficiency Ring
    efficiencyChart = initRingChart('efficiencyRing', '#1e8e3e', 85); // Green
    
    // Health Ring
    healthChart = initRingChart('healthRing', '#1a73e8', 92); // Blue
}

function initRingChart(canvasId, color, initialValue) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Value', 'Remaining'],
            datasets: [{
                data: [initialValue, 100 - initialValue],
                backgroundColor: [color, '#f1f3f4'],
                borderWidth: 0,
                cutout: '80%'
            }]
        },
        options: {
            responsive: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });
}

function setupEventListeners() {
    // Role selector
    const roleSelect = document.getElementById('role-select');
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            currentRole = e.target.value;
            // In a real app, this might redirect or change view permissions
            console.log(`Role switched to ${currentRole}`);
        });
    }
}

// --- Update Logic ---
function updateDashboard(data) {
    updateMachines(data.machines);
    updateCharts(data.machines);
    updateRecommendations(data.recommendations);
    updateAnomalies(data.anomalies);
    updateRings(data.machines);
}

function updateMachines(machines) {
    machines.forEach(m => {
        // Update text values
        updateElementText(`${m.id.toLowerCase()}-power`, `${m.power} W`);
        updateElementText(`${m.id.toLowerCase()}-voltage`, `${m.voltage} V`);
        updateElementText(`${m.id.toLowerCase()}-temp`, `${m.temperature} °C`);
        
        // Update status dot
        const dot = document.getElementById(`${m.id.toLowerCase()}-status-dot`);
        if (dot) {
            dot.className = `status-dot ${m.status}`;
        }
        
        // Update actions based on role and status
        const actionsDiv = document.getElementById(`${m.id.toLowerCase()}-actions`);
        if (actionsDiv) {
            let actionsHtml = '';
            if (currentRole === 'head' || currentRole === 'lead') {
                actionsHtml += `<button class="action-small-btn" onclick="openControlModal('${m.id}')">Control</button>`;
            }
            actionsDiv.innerHTML = actionsHtml;
        }
    });
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

function updateCharts(machines) {
    if (!trendsChart) return;

    const now = new Date().toLocaleTimeString();
    const m1 = machines.find(m => m.id === 'M1');
    const m2 = machines.find(m => m.id === 'M2');

    if (trendsChart.data.labels.length > CONFIG.maxDataPoints) {
        trendsChart.data.labels.shift();
        trendsChart.data.datasets[0].data.shift();
        trendsChart.data.datasets[1].data.shift();
    }

    trendsChart.data.labels.push(now);
    if (m1) trendsChart.data.datasets[0].data.push(m1.power);
    if (m2) trendsChart.data.datasets[1].data.push(m2.power);

    trendsChart.update();
}

function updateRings(machines) {
    // Calculate average efficiency/health for demo purposes
    // In a real app, these would come from the backend
    const avgPower = machines.reduce((acc, m) => acc + m.power, 0) / machines.length;
    const efficiency = Math.max(0, Math.min(100, 100 - (avgPower / 1000 * 20))); // Mock calc
    const health = machines.every(m => m.status === 'operational') ? 98 : 75;

    if (efficiencyChart) {
        efficiencyChart.data.datasets[0].data = [efficiency, 100 - efficiency];
        efficiencyChart.update();
    }
    if (healthChart) {
        healthChart.data.datasets[0].data = [health, 100 - health];
        healthChart.update();
    }
}

function updateRecommendations(recs) {
    const list = document.getElementById('recommendations-list');
    if (!list) return;

    if (!recs || recs.length === 0) {
        list.innerHTML = '<div class="recommendation-item low">All systems optimized.</div>';
        return;
    }

    list.innerHTML = recs.map(r => `
        <div class="recommendation-item ${r.severity}">
            <span>${r.msg}</span>
            ${currentRole !== 'worker' ? '<button class="action-small-btn" onclick="resolveRec(this)">Resolve</button>' : ''}
        </div>
    `).join('');
}

function updateAnomalies(anomalies) {
    // Could show a toast or highlight the machine card
    if (anomalies && anomalies.length > 0) {
        anomalies.forEach(a => {
            // Simple debounce or check if already shown could be added here
            console.warn(`Anomaly detected on ${a.id}: ${a.type}`);
        });
    }
}

// --- User Actions ---
function openControlModal(machineId) {
    const modal = document.getElementById('controlModal');
    const title = document.getElementById('control-modal-title');
    if (modal && title) {
        title.innerText = `Control ${machineId}`;
        modal.style.display = 'flex';
        // Store current machine ID in a data attribute or variable
        modal.dataset.machineId = machineId;
    }
}

function closeControlModal() {
    const modal = document.getElementById('controlModal');
    if (modal) modal.style.display = 'none';
}

function openModelPopup(machineId) {
    // Create popup element dynamically
    const popup = document.createElement('div');
    popup.className = 'model-popup';
    popup.innerHTML = `
        <div class="model-popup-content">
            <span class="model-popup-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <model-viewer 
                src="/static/models/${machineId}.glb" 
                alt="3D Model of ${machineId}" 
                camera-controls 
                auto-rotate
                style="width: 100%; height: 100%; background-color: #f8f9fa;"
            ></model-viewer>
        </div>
    `;
    document.body.appendChild(popup);
}

function sendControlAction(action) {
    const modal = document.getElementById('controlModal');
    const machineId = modal.dataset.machineId;
    
    fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: machineId, action: action })
    })
    .then(res => res.json())
    .then(data => {
        showToast(data.message, data.success ? 'success' : 'error');
        closeControlModal();
    })
    .catch(err => showToast('Failed to send command', 'error'));
}

function handleTextCommand() {
    const input = document.getElementById('text-command');
    const cmd = input.value.trim();
    if (!cmd) return;
    
    // Simple command parsing
    if (cmd.toLowerCase().includes('shutdown m1')) {
        // Simulate API call
        showToast('Command sent: Shutdown M1', 'info');
    } else {
        // Use Gemma API
        fetch('/api/gemma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: cmd })
        })
        .then(res => res.json())
        .then(data => {
            if (data.answer) showToast(data.answer, 'info');
            else showToast('Error processing command', 'error');
        });
    }
    input.value = '';
}

function logout() {
    window.location.href = '/';
}

function exportDashboardPDF() {
    const element = document.body;
    const opt = {
        margin: 0,
        filename: `EVTwin_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    
    // Check if html2pdf is loaded
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
    } else {
        showToast('PDF export library not loaded', 'error');
    }
}

// --- Utilities ---
function showToast(message, type = 'info') {
    // Create a simple toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        font-family: 'Inter', sans-serif;
        animation: slideIn 0.3s ease-out;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add keyframes for toast
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('controlModal');
    if (event.target == modal) {
        closeControlModal();
    }
}
