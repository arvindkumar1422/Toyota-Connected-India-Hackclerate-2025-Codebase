// charts.js
// Chart.js setup for real-time data
let machineChart;
let tempChart;
let efficiencyGauge, healthGauge, trendChart;
let anomalyPoints = [];
function initCharts() {
    // Efficiency Gauge
    const effCtx = document.getElementById('efficiency-gauge').getContext('2d');
    efficiencyGauge = new Chart(effCtx, {
        type: 'doughnut',
        data: { labels: ['Efficiency', ''], datasets: [{ data: [43, 57], backgroundColor: ['#7ecbff', '#23272b'], borderWidth: 0, borderRadius: 18 }] },
        options: { cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { animateRotate: true, duration: 1200 } }
    });
    // Health Gauge
    const healthCtx = document.getElementById('health-gauge').getContext('2d');
    healthGauge = new Chart(healthCtx, {
        type: 'doughnut',
        data: { labels: ['Health', ''], datasets: [{ data: [78, 22], backgroundColor: ['#7ecbff', '#23272b'], borderWidth: 0, borderRadius: 18 }] },
        options: { cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { animateRotate: true, duration: 1200 } }
    });
    // Trend Graph
    const trendCtx = document.getElementById('trend-graph').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'M1 Temp', data: [], borderColor: '#7ecbff', backgroundColor: 'rgba(126,203,255,0.08)', pointRadius: 2, borderWidth: 3, tension: 0.4, fill: true },
            { label: 'M2 Temp', data: [], borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.04)', pointRadius: 2, borderWidth: 3, tension: 0.4, fill: true },
            { label: 'Anomaly', data: [], borderColor: '#ff3b6a', backgroundColor: '#ff3b6a', pointRadius: 5, borderWidth: 0, type: 'scatter', showLine: false, label: 'Anomaly', hidden: false }
        ] },
        options: { responsive: true, plugins: { legend: { labels: { color: '#e0e6ed', font: { family: 'Inter', size: 13 } } }, tooltip: { enabled: true, mode: 'nearest', intersect: false } }, scales: { x: { ticks: { color: '#e0e6ed' }, grid: { color: '#31363b' } }, y: { ticks: { color: '#e0e6ed' }, grid: { color: '#31363b' } } }, animation: { duration: 900 }, backgroundColor: '#23272b' }
    });
    // Load historical data
    fetch('/api/historical').then(r => r.json()).then(hist => {
        const m1 = hist.data.map(d => d[0].temperature);
        const m2 = hist.data.map(d => d[1].temperature);
        const labels = hist.data.map(d => new Date(d[0].timestamp*1000).toLocaleTimeString());
        trendChart.data.labels = labels;
        trendChart.data.datasets[0].data = m1;
        trendChart.data.datasets[1].data = m2;
        // Mark anomalies
        anomalyPoints = hist.anomalies.map(a => ({ x: new Date(a.timestamp*1000).toLocaleTimeString(), y: a.value }));
        trendChart.data.datasets[2].data = anomalyPoints;
        trendChart.update();
    });
}
function updateCharts(data) {
    // Update gauges
    if (efficiencyGauge && data.machines) {
        const eff = Math.round((100 - data.machines[0].vibration * 50) * 0.7 + (100 - data.machines[1].vibration * 50) * 0.3);
        efficiencyGauge.data.datasets[0].data[0] = eff;
        efficiencyGauge.data.datasets[0].data[1] = 100 - eff;
        efficiencyGauge.update();
    }
    if (healthGauge && data.machines) {
        const health = Math.round((100 - data.machines[0].temperature * 0.7) * 0.5 + (100 - data.machines[1].temperature * 0.7) * 0.5);
        healthGauge.data.datasets[0].data[0] = health;
        healthGauge.data.datasets[0].data[1] = 100 - health;
        healthGauge.update();
    }
    // Update trend graph
    if (trendChart && data.machines) {
        const now = new Date().toLocaleTimeString();
        trendChart.data.labels.push(now);
        trendChart.data.datasets[0].data.push(data.machines[0].temperature);
        trendChart.data.datasets[1].data.push(data.machines[1].temperature);
        // Mark anomalies in real time
        if (data.anomalies && data.anomalies.length > 0) {
            data.anomalies.forEach(a => {
                trendChart.data.datasets[2].data.push({ x: now, y: a.value });
            });
        }
        if (trendChart.data.labels.length > 30) {
            trendChart.data.labels.shift();
            trendChart.data.datasets[0].data.shift();
            trendChart.data.datasets[1].data.shift();
            // Remove old anomaly points
            trendChart.data.datasets[2].data = trendChart.data.datasets[2].data.slice(-30);
        }
        trendChart.update();
    }
}
function renderTrendsBarChart(labels, m1Data, m2Data, anomalyData) {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    if (window.trendsChartInstance) {
        window.trendsChartInstance.destroy();
    }
    window.trendsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'M1 Temp',
                    data: m1Data,
                    backgroundColor: '#5bc0ff',
                    barPercentage: 0.8,
                    categoryPercentage: 0.5
                },
                {
                    label: 'M2 Temp',
                    data: m2Data,
                    backgroundColor: '#e0e0e0',
                    barPercentage: 0.8,
                    categoryPercentage: 0.5
                },
                {
                    label: 'Anomaly',
                    data: anomalyData,
                    backgroundColor: '#ff5c5c',
                    barPercentage: 0.8,
                    categoryPercentage: 0.5
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: { display: false },
                    ticks: { color: '#bfc9da' }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#23272f' },
                    ticks: { color: '#bfc9da' }
                }
            }
        }
    });
}
// Example usage (replace with real data):
// renderTrendsBarChart(labels, m1Data, m2Data, anomalyData); 