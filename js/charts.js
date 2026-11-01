/**
 * Chart.js Visualizations for Lucknow Flood Risk GIS Project
 * Accurately renders quantitative results from Page 29 of project report.
 */

let landAreaChartInstance = null;
let infrastructureChartInstance = null;
let factorWeightChartInstance = null;
let reliefCampsChartInstance = null;

function initAnalyticsCharts() {
  // Chart 1: Land Area Susceptibility Donut Chart
  const landCtx = document.getElementById('landAreaChart');
  if (landCtx) {
    if (landAreaChartInstance) landAreaChartInstance.destroy();
    landAreaChartInstance = new Chart(landCtx, {
      type: 'doughnut',
      data: {
        labels: ['Low Flood Risk (58.0%)', 'Medium Flood Risk (27.0%)', 'High Flood Risk (15.0%)'],
        datasets: [{
          data: [1466.24, 682.56, 379.20],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderColor: '#0f172a',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = 2528.0;
                const value = context.parsed;
                const pct = ((value / total) * 100).toFixed(1);
                return ` ${context.label}: ${value.toLocaleString()} km² (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  // Chart 2: Infrastructure Exposure Breakdown (Grouped Bar Chart)
  const infraCtx = document.getElementById('infraExposureChart');
  if (infraCtx) {
    if (infrastructureChartInstance) infrastructureChartInstance.destroy();
    infrastructureChartInstance = new Chart(infraCtx, {
      type: 'bar',
      data: {
        labels: ['Hospitals & Clinics (Count)', 'Schools & Colleges (Count)', 'Major Arterial Roads (km)'],
        datasets: [
          {
            label: 'High Risk Zone (Critical)',
            data: [24, 52, 168],
            backgroundColor: '#ef4444',
            borderRadius: 6
          },
          {
            label: 'Medium Risk Zone',
            data: [41, 108, 314],
            backgroundColor: '#f59e0b',
            borderRadius: 6
          },
          {
            label: 'Low Risk Zone (Safe)',
            data: [77, 225, 638],
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          y: {
            grid: { color: '#1e293b' },
            ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        }
      }
    });
  }

  // Chart 3: MCDA Conditioning Factors Polar/Radar
  const factorCtx = document.getElementById('factorWeightChart');
  if (factorCtx) {
    if (factorWeightChartInstance) factorWeightChartInstance.destroy();
    factorWeightChartInstance = new Chart(factorCtx, {
      type: 'polarArea',
      data: {
        labels: [
          'Elevation / DEM (30%)',
          'River Proximity (25%)',
          'Monsoon Rainfall (20%)',
          'Land Use / LULC (15%)',
          'Terrain Slope (10%)'
        ],
        datasets: [{
          data: [30, 25, 20, 15, 10],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(6, 182, 212, 0.7)',
            'rgba(99, 102, 241, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)'
          ],
          borderColor: '#1e293b',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } }
          }
        },
        scales: {
          r: {
            grid: { color: '#334155' },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // Chart 4: Candidate Relief Camps Capacity & Metrics
  const campCtx = document.getElementById('reliefCampChart');
  if (campCtx) {
    if (reliefCampsChartInstance) reliefCampsChartInstance.destroy();
    reliefCampsChartInstance = new Chart(campCtx, {
      type: 'bar',
      data: {
        labels: ['Site A (North)', 'Site B (East)', 'Site C (South)', 'Site D (Southeast)'],
        datasets: [{
          label: 'Shelter Capacity (Civilians)',
          data: [12500, 15000, 18000, 14000],
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
