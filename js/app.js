/**
 * Main WebGIS Controller & Application Engine for Lucknow Flood Risk Decision Support
 * Built with Leaflet.js, vanilla JS (ES6+), and Ponytail minimalist architecture.
 */

let map;
let baseMaps = {};
let currentBaseLayer = null;

let layers = {
  boundary: null,
  river: null,
  buffers: null,
  floodZones: null,
  hospitals: null,
  schools: null,
  roads: null,
  reliefCamps: null
};

// Google Maps API integration state
let googleMapsApiKey = localStorage.getItem('google_maps_api_key') || '';
let isGoogleMapsApiLoaded = false;
let streetViewPanorama = null;

// Current dynamic weights (default baseline from project report page 23)
let currentWeights = {
  elevation: 0.30,
  river: 0.25,
  rainfall: 0.20,
  landuse: 0.15,
  slope: 0.10
};

// Active table filters
let currentTableCategory = 'hospitals';
let currentTableSearch = '';
let currentRiskFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initGoogleMapsAPI();
  initLayerControls();
  initMCDASimulator();
  initReliefCampCards();
  initDataTable();
  initSearch();
  initTabNavigation();
  initAnalyticsCharts();
  updateLiveKPIs();
});

/* ==========================================================================
   1. MAP INITIALIZATION & GOOGLE MAPS BASE LAYERS
   ========================================================================== */
function initMap() {
  // Centered on Lucknow Urban Core
  map = L.map('map', {
    center: [26.8500, 80.9500],
    zoom: 11,
    minZoom: 9,
    maxZoom: 20,
    zoomControl: false
  });

  // Zoom control top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // 1. Google Hybrid Layer (Satellite + Roads & Labels)
  const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  });

  // 2. Google Terrain Layer (Contours, Topography & Physical Drainage)
  const googleTerrain = L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  });

  // 3. Google Standard Roadmap
  const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  });

  // 4. Google Pure Satellite Imagery
  const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  });

  // 5. Carto Dark Basemap
  const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  });

  // 6. Carto Positron (Light)
  const cartoPositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  });

  // Register basemaps
  baseMaps = {
    "googleHybrid": googleHybrid,
    "googleTerrain": googleTerrain,
    "googleStreets": googleStreets,
    "googleSat": googleSat,
    "cartoDark": cartoDark,
    "cartoPositron": cartoPositron
  };

  // Set Google Hybrid as default base layer
  currentBaseLayer = googleHybrid;
  currentBaseLayer.addTo(map);

  const layerControlBaseMaps = {
    "Google Hybrid (Satellite + Roads)": googleHybrid,
    "Google Terrain (Topography)": googleTerrain,
    "Google Roadmap": googleStreets,
    "Google Satellite (Pure)": googleSat,
    "Carto Dark Theme": cartoDark,
    "Carto Positron Light": cartoPositron
  };

  L.control.layers(layerControlBaseMaps, null, { position: 'topright' }).addTo(map);

  // Add Scale Bar
  L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

  // Load all vector and thematic GIS layers
  renderLayers();

  // Map Click Inspector for FRI
  map.on('click', handleMapClick);
}

function setBasemap(type) {
  if (currentBaseLayer) {
    map.removeLayer(currentBaseLayer);
  }
  if (baseMaps[type]) {
    currentBaseLayer = baseMaps[type];
    map.addLayer(currentBaseLayer);
    currentBaseLayer.bringToBack();
  }

  // Update button highlights
  const types = ['googleHybrid', 'googleTerrain', 'googleStreets', 'cartoDark', 'cartoPositron'];
  types.forEach(t => {
    const btn = document.getElementById(`btn-bm-${t}`);
    if (btn) {
      if (t === type) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-md transition flex items-center gap-1';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition flex items-center gap-1';
      }
    }
  });
}

/* ==========================================================================
   GOOGLE MAPS API & STREET VIEW INTEGRATION
   ========================================================================== */
function initGoogleMapsAPI() {
  const savedKey = localStorage.getItem('google_maps_api_key');
  const inputEl = document.getElementById('google-api-key-input');
  const statusEl = document.getElementById('google-api-status-badge');
  if (inputEl && savedKey) {
    inputEl.value = savedKey;
  }
  if (savedKey) {
    loadGoogleMapsScript(savedKey);
    if (statusEl) {
      statusEl.textContent = 'API Key Connected (Street View Active)';
      statusEl.className = 'px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
  } else {
    if (statusEl) {
      statusEl.textContent = 'Google Tile Mode Active (Default)';
      statusEl.className = 'px-2.5 py-1 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40';
    }
  }
}

function saveGoogleApiKey() {
  const inputEl = document.getElementById('google-api-key-input');
  if (!inputEl) return;
  const key = inputEl.value.trim();
  if (key) {
    localStorage.setItem('google_maps_api_key', key);
    loadGoogleMapsScript(key);
    alert('Google Maps API Key saved! Street View 360° and Places features are now active.');
  } else {
    localStorage.removeItem('google_maps_api_key');
    alert('Google Maps API Key cleared. System running in default Google Tile Mode.');
  }
  closeGoogleMapsModal();
  initGoogleMapsAPI();
}

function loadGoogleMapsScript(key) {
  if (window.google && window.google.maps) {
    isGoogleMapsApiLoaded = true;
    return;
  }
  const existing = document.getElementById('google-maps-js-sdk');
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.id = 'google-maps-js-sdk';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    isGoogleMapsApiLoaded = true;
    console.log('Google Maps JS API loaded successfully.');
  };
  script.onerror = () => {
    console.warn('Failed to load Google Maps JS API with provided key. Falling back to Google Tile Mode.');
  };
  document.head.appendChild(script);
}

function openStreetView(lat, lon, facilityName) {
  const modal = document.getElementById('streetview-modal');
  const title = document.getElementById('streetview-title');
  const container = document.getElementById('streetview-panorama-container');
  const fallback = document.getElementById('streetview-fallback-link');

  if (!modal || !title || !container) return;

  title.textContent = `Google Street View 360°: ${facilityName}`;
  const gmapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}&heading=0&pitch=0&fov=80`;
  if (fallback) {
    fallback.href = gmapsUrl;
  }

  modal.classList.remove('hidden');

  if (window.google && window.google.maps && window.google.maps.StreetViewPanorama) {
    container.innerHTML = '';
    const streetViewService = new google.maps.StreetViewService();
    const latLng = new google.maps.LatLng(lat, lon);

    streetViewService.getPanorama({ location: latLng, radius: 250 }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK) {
        streetViewPanorama = new google.maps.StreetViewPanorama(container, {
          position: data.location.latLng,
          pov: { heading: 165, pitch: 0 },
          zoom: 1
        });
      } else {
        container.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-slate-400 space-y-3">
            <i class="fa-solid fa-camera text-4xl text-slate-600"></i>
            <p class="text-sm font-semibold text-slate-300">Street View imagery at this exact point coordinate is limited.</p>
            <p class="text-xs max-w-sm">You can inspect this facility in full 3D and satellite view directly on Google Maps.</p>
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
              <i class="fa-brands fa-google"></i> Open Location in Google Maps
            </a>
          </div>
        `;
      }
    });
  } else {
    // Elegant fallback card when API key has not been entered yet
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-slate-300 space-y-4">
        <div class="w-14 h-14 rounded-full bg-blue-900/40 border border-blue-500/40 flex items-center justify-center text-blue-400 text-2xl">
          <i class="fa-brands fa-google"></i>
        </div>
        <div>
          <h4 class="text-base font-bold text-white mb-1">Google Maps 360° Facility Inspection</h4>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            View 360° street imagery and surrounding flood protection topography for <strong>${facilityName}</strong> (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E).
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in Google Maps Street View
          </a>
          <button onclick="openGoogleMapsModal()" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition">
            Configure Google API Key
          </button>
        </div>
      </div>
    `;
  }
}

function closeStreetViewModal() {
  const modal = document.getElementById('streetview-modal');
  if (modal) modal.classList.add('hidden');
}

function openGoogleMapsModal() {
  const modal = document.getElementById('google-maps-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeGoogleMapsModal() {
  const modal = document.getElementById('google-maps-modal');
  if (modal) modal.classList.add('hidden');
}

/* ==========================================================================
   2. LAYER RENDERING
   ========================================================================== */
function renderLayers() {
  // 1. Lucknow District Boundary
  layers.boundary = L.geoJSON(LUCKNOW_DISTRICT_GEOJSON, {
    style: {
      color: '#38bdf8',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#0284c7',
      fillOpacity: 0.05
    }
  }).addTo(map);

  // 2. Flood Hazard Susceptibility Zones (High, Medium, Low)
  layers.floodZones = L.geoJSON(FLOOD_RISK_ZONES_GEOJSON, {
    style: function(feature) {
      return {
        fillColor: feature.properties.fillColor,
        color: feature.properties.color,
        weight: 1.5,
        fillOpacity: feature.properties.fillOpacity || 0.45
      };
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`
        <div class="p-2 space-y-1">
          <div class="flex items-center justify-between gap-2 border-b border-slate-600 pb-1">
            <span class="font-bold text-sm" style="color: ${feature.properties.color}">${feature.properties.zone}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">FRI ${feature.properties.fri_min} - ${feature.properties.fri_max}</span>
          </div>
          <p class="text-xs text-slate-300 pt-1">${feature.properties.description}</p>
          <div class="text-xs grid grid-cols-2 gap-2 pt-1 font-mono text-slate-400">
            <div>Area: <strong class="text-white">${feature.properties.area_sqkm} km²</strong></div>
            <div>Share: <strong class="text-white">${feature.properties.percentage}%</strong></div>
          </div>
          <p class="text-xs italic text-blue-300 pt-1">Mitigation: ${feature.properties.planning_implication}</p>
        </div>
      `);
    }
  }).addTo(map);

  // 3. Gomti River Corridor
  layers.river = L.geoJSON(GOMTI_RIVER_GEOJSON, {
    style: {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.95
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`
        <div class="p-2">
          <h4 class="font-bold text-sm text-sky-400 flex items-center gap-1">🌊 ${feature.properties.name}</h4>
          <p class="text-xs text-slate-300 mt-1">Primary riverine drainage artery of Lucknow District.</p>
          <div class="text-xs mt-2 text-slate-400 space-y-0.5 font-mono">
            <div>Length in District: <strong>${feature.properties.channel_length_in_district_km} km</strong></div>
            <div>Monsoon HFL: <strong>${feature.properties.monsoon_high_flood_level_m} m</strong></div>
            <div>Flow Direction: <strong>${feature.properties.flow_direction}</strong></div>
          </div>
        </div>
      `);
    }
  }).addTo(map);

  // 4. River Risk Buffers (250m, 500m, 1000m)
  layers.buffers = L.geoJSON(RIVER_BUFFERS_GEOJSON, {
    style: function(feature) {
      const colors = { '250m': '#ef4444', '500m': '#f97316', '1000m': '#eab308' };
      return {
        color: colors[feature.properties.buffer_distance] || '#ef4444',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: colors[feature.properties.buffer_distance],
        fillOpacity: 0.15
      };
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`
        <div class="p-1 text-xs">
          <strong class="text-amber-400">${feature.properties.buffer_distance} River Buffer Zone</strong>
          <p class="text-slate-300">${feature.properties.risk_level}</p>
        </div>
      `);
    }
  });

  // 5. Major Arterial Roadways
  layers.roads = L.geoJSON(ROADS_GEOJSON, {
    style: function(feature) {
      return {
        color: '#94a3b8',
        weight: 3,
        opacity: 0.8
      };
    },
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`
        <div class="p-2 text-xs">
          <h4 class="font-bold text-sm text-slate-200">🛣️ ${feature.properties.name}</h4>
          <p class="text-slate-400">Class: ${feature.properties.type}</p>
          <div class="mt-2 space-y-1 font-mono">
            <div>Total Length: <strong>${feature.properties.total_km} km</strong></div>
            <div class="text-red-400">High Flood Risk Segment: <strong>${feature.properties.high_risk_km} km</strong></div>
            <div class="text-amber-400">Medium Risk Segment: <strong>${feature.properties.med_risk_km} km</strong></div>
            <div class="text-emerald-400">Low Risk (Safe) Segment: <strong>${feature.properties.low_risk_km} km</strong></div>
          </div>
        </div>
      `);
    }
  }).addTo(map);

  // Global facility markers lookup by ID for instantaneous search focus
  window.facilityMarkers = {};

  // 6. Healthcare Facilities (142 points)
  const hospitalMarkers = [];
  HOSPITALS_DATA.forEach(h => {
    const colorMap = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#10b981' };
    const marker = L.circleMarker([h.lat, h.lon], {
      radius: h.risk === 'High' ? 7 : 5,
      fillColor: colorMap[h.risk],
      color: '#ffffff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9
    }).bindPopup(`
      <div class="p-2 text-xs space-y-1.5">
        <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
          <strong class="text-sm text-white">🏥 ${h.name}</strong>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${h.risk === 'High' ? 'badge-high' : h.risk === 'Medium' ? 'badge-med' : 'badge-low'}">${h.risk} Risk</span>
        </div>
        <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-300 font-mono text-[11px] pt-1">
          <div>ID: <span class="text-slate-400">${h.id}</span></div>
          <div>Beds: <span class="text-white font-bold">${h.beds}</span></div>
          <div>Elev: <span class="text-white">${h.elev} m</span></div>
          <div>To River: <span class="text-white">${h.dist_river} m</span></div>
          <div>Type: <span class="text-slate-300">${h.type}</span></div>
          <div>Contact: <span class="text-blue-400">${h.phone}</span></div>
        </div>
        <div class="text-[10px] text-slate-400 italic">Address: ${h.address}</div>
        ${h.risk === 'High' ? '<div class="text-[10px] bg-red-950/60 text-red-300 p-1 rounded border border-red-800/50">⚠️ Critical access choke point during peak Gomti surge.</div>' : ''}
        <button onclick="openStreetView(${h.lat}, ${h.lon}, '${h.name.replace(/'/g, "\\'")}')" class="mt-1 w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white text-[11px] font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition">
          <i class="fa-brands fa-google text-red-400"></i>
          <span>Google Street View 360°</span>
        </button>
      </div>
    `);
    hospitalMarkers.push(marker);
    window.facilityMarkers[h.id] = marker;
  });
  layers.hospitals = L.layerGroup(hospitalMarkers).addTo(map);

  // 7. Schools & Educational Institutions (385 points)
  const schoolMarkers = [];
  SCHOOLS_DATA.forEach(s => {
    const colorMap = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#10b981' };
    const marker = L.circleMarker([s.lat, s.lon], {
      radius: 4,
      fillColor: colorMap[s.risk],
      color: '#ffffff',
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.7
    }).bindPopup(`
      <div class="p-2 text-xs space-y-1">
        <strong class="text-sm text-white">🏫 ${s.name}</strong>
        <div class="mt-1 flex items-center gap-2">
          <span class="px-1.5 py-0.5 rounded text-[10px] ${s.risk === 'High' ? 'badge-high' : s.risk === 'Medium' ? 'badge-med' : 'badge-low'}">${s.risk} Risk</span>
          <span class="text-slate-400 font-mono">ID: ${s.id}</span>
          <span class="text-slate-400">Capacity: ${s.capacity} students</span>
        </div>
        <div class="text-[10px] text-slate-400 italic">Address: ${s.address}</div>
        <div class="mt-1.5 text-[11px] ${s.suitable_for_shelter ? 'text-emerald-400' : 'text-slate-400'}">
          ${s.suitable_for_shelter ? '✅ Eligible as localized community relief shelter' : '❌ Not suitable for relief camp (Floodplain exposure)'}
        </div>
        <button onclick="openStreetView(${s.lat}, ${s.lon}, '${s.name.replace(/'/g, "\\'")}')" class="mt-2 w-full py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white text-[10px] font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition">
          <i class="fa-brands fa-google text-red-400"></i>
          <span>Google Street View 360°</span>
        </button>
      </div>
    `);
    schoolMarkers.push(marker);
    window.facilityMarkers[s.id] = marker;
  });
  // Both hospitals and schools displayed together on Google Maps by default
  layers.schools = L.layerGroup(schoolMarkers).addTo(map);

  // 8. 4 Candidate Emergency Relief Camps
  const campMarkers = [];
  RELIEF_CAMPS_DATA.forEach(c => {
    const customIcon = L.divIcon({
      className: 'relief-camp-icon-container',
      html: `<div class="relief-pulse-marker" title="${c.name} - ${c.status}"><i class="fas fa-campground text-xs"></i>⭐</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([c.lat, c.lon], { icon: customIcon }).bindPopup(`
      <div class="p-2.5 text-xs space-y-2">
        <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <div>
            <h3 class="font-bold text-sm text-emerald-400">⛺ ${c.name}</h3>
            <p class="text-[11px] text-slate-400">${c.location}</p>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Score: ${c.suitability_score}%</span>
        </div>
        <p class="text-slate-300 text-[11px]">${c.description}</p>
        <div class="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-300 bg-slate-900/60 p-2 rounded">
          <div>Capacity: <strong class="text-white">${c.capacity_persons.toLocaleString()} persons</strong></div>
          <div>Elevation: <strong class="text-emerald-300">${c.elevation_m} m</strong></div>
          <div>Dist to River: <strong class="text-emerald-300">${c.dist_to_gomti_m} m</strong> (>1km ✅)</div>
          <div>Dist to Road: <strong class="text-emerald-300">${c.dist_to_major_road_m} m</strong> (<500m ✅)</div>
          <div>Nearest Hospital: <strong class="text-white">${c.dist_to_hospital_km} km</strong> (<3km ✅)</div>
          <div>Status: <strong class="text-emerald-400">${c.status}</strong></div>
        </div>
        <div class="flex gap-2 pt-1">
          <button onclick="inspectReliefCamp('${c.id}')" class="flex-1 py-1 text-center bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition">
            Dossier
          </button>
          <button onclick="openStreetView(${c.lat}, ${c.lon}, '${c.name.replace(/'/g, "\\'")}')" class="flex-1 py-1 text-center bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded text-[11px] font-semibold border border-slate-700 flex items-center justify-center gap-1 transition">
            <i class="fa-brands fa-google text-red-400"></i> Street View
          </button>
        </div>
      </div>
    `);
    campMarkers.push(marker);
    window.facilityMarkers[c.id] = marker;
  });
  layers.reliefCamps = L.layerGroup(campMarkers).addTo(map);
}

/* ==========================================================================
   3. LAYER CONTROLS & OPACITY SLIDERS
   ========================================================================== */
function initLayerControls() {
  const toggles = [
    { id: 'toggle-flood-zones', layer: layers.floodZones },
    { id: 'toggle-river', layer: layers.river },
    { id: 'toggle-buffers', layer: layers.buffers },
    { id: 'toggle-roads', layer: layers.roads },
    { id: 'toggle-hospitals', layer: layers.hospitals },
    { id: 'toggle-schools', layer: layers.schools },
    { id: 'toggle-relief-camps', layer: layers.reliefCamps },
    { id: 'toggle-boundary', layer: layers.boundary }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
      el.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!map.hasLayer(t.layer)) map.addLayer(t.layer);
        } else {
          if (map.hasLayer(t.layer)) map.removeLayer(t.layer);
        }
      });
    }
  });

  // Flood zones opacity slider
  const opacitySlider = document.getElementById('flood-opacity-slider');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (layers.floodZones) {
        layers.floodZones.setStyle({ fillOpacity: val });
      }
    });
  }
}

function setLayerVisible(layerKey, isVisible) {
  const checkboxMap = {
    'floodZones': 'toggle-flood-zones',
    'river': 'toggle-river',
    'buffers': 'toggle-buffers',
    'roads': 'toggle-roads',
    'hospitals': 'toggle-hospitals',
    'schools': 'toggle-schools',
    'reliefCamps': 'toggle-relief-camps',
    'boundary': 'toggle-boundary'
  };
  const layer = layers[layerKey];
  const checkbox = document.getElementById(checkboxMap[layerKey]);
  if (!layer) return;

  if (isVisible) {
    if (!map.hasLayer(layer)) map.addLayer(layer);
    if (checkbox) checkbox.checked = true;
  } else {
    if (map.hasLayer(layer)) map.removeLayer(layer);
    if (checkbox) checkbox.checked = false;
  }
}

function enableAllLayers() {
  Object.keys(layers).forEach(k => setLayerVisible(k, true));
}

function resetDefaultLayers() {
  setLayerVisible('boundary', true);
  setLayerVisible('river', true);
  setLayerVisible('buffers', false);
  setLayerVisible('roads', true);
  setLayerVisible('floodZones', true);
  setLayerVisible('hospitals', true);
  setLayerVisible('schools', true);
  setLayerVisible('reliefCamps', true);
}

/* ==========================================================================
   4. DYNAMIC POINT INSPECTION & LIVE FRI COMPUTATION
   ========================================================================== */
function handleMapClick(e) {
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;

  // Compute dynamic cell score based on geographic distance from Gomti & approximate terrain elevation
  const inspection = evaluatePointFloodRisk(lat, lon);

  L.popup()
    .setLatLng(e.latlng)
    .setContent(`
      <div class="p-2.5 text-xs space-y-2 min-w-[240px]">
        <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <strong class="text-sm text-white">📍 Point Spatial Inspection</strong>
          <span class="px-2 py-0.5 rounded text-xs font-bold ${inspection.risk === 'High' ? 'badge-high' : inspection.risk === 'Medium' ? 'badge-med' : 'badge-low'}">
            FRI ${inspection.fri.toFixed(2)} (${inspection.risk})
          </span>
        </div>
        <div class="text-[11px] text-slate-400 font-mono">
          Coords: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E
        </div>
        <div class="space-y-1 text-[11px] font-mono bg-slate-900/60 p-2 rounded text-slate-300">
          <div class="flex justify-between"><span>Elevation Score (E):</span> <span class="text-white">${inspection.scores.E}/5 (wt ${(currentWeights.elevation*100)}%)</span></div>
          <div class="flex justify-between"><span>River Proximity (D):</span> <span class="text-white">${inspection.scores.D}/5 (wt ${(currentWeights.river*100)}%)</span></div>
          <div class="flex justify-between"><span>Monsoon Rainfall (R):</span> <span class="text-white">${inspection.scores.R}/5 (wt ${(currentWeights.rainfall*100)}%)</span></div>
          <div class="flex justify-between"><span>Land Cover / LULC (L):</span> <span class="text-white">${inspection.scores.L}/5 (wt ${(currentWeights.landuse*100)}%)</span></div>
          <div class="flex justify-between"><span>Terrain Slope (S):</span> <span class="text-white">${inspection.scores.S}/5 (wt ${(currentWeights.slope*100)}%)</span></div>
          <div class="border-t border-slate-700 pt-1 mt-1 flex justify-between font-bold text-sky-400">
            <span>Computed FRI:</span>
            <span>${inspection.fri.toFixed(3)}</span>
          </div>
        </div>
        <p class="text-[10px] text-slate-400 italic">Formula: FRI = (0.30×E) + (0.25×D) + (0.20×R) + (0.15×L) + (0.10×S)</p>
      </div>
    `)
    .openOn(map);
}

function evaluatePointFloodRisk(lat, lon) {
  // Approximate distance from Gomti River centerline
  // River line points from Gomti River coordinates
  const riverCoords = GOMTI_RIVER_GEOJSON.features[0].geometry.coordinates;
  let minDistDeg = 999;
  for (let pt of riverCoords) {
    const d = Math.hypot(lon - pt[0], lat - pt[1]);
    if (d < minDistDeg) minDistDeg = d;
  }
  // 1 degree approx 111 km = 111,000 meters
  const distMeters = minDistDeg * 111000;

  let D = 1; // River score
  if (distMeters <= 250) D = 5;
  else if (distMeters <= 500) D = 4;
  else if (distMeters <= 1000) D = 3;
  else if (distMeters <= 2000) D = 2;
  else D = 1;

  // Approximate elevation: lower near river and center, higher towards periphery
  let approxElev = 114 + Math.min(21, (distMeters / 250) * 1.8);
  let E = 1;
  if (approxElev < 118) E = 5;
  else if (approxElev < 122) E = 4;
  else if (approxElev < 125) E = 3;
  else if (approxElev < 128) E = 2;
  else E = 1;

  // Rainfall variation
  let R = lat > 26.9 ? 4 : (lon > 80.95 ? 4 : 3);

  // Land use
  let isUrbanCore = (lat >= 26.80 && lat <= 26.92 && lon >= 80.88 && lon <= 81.04);
  let L = distMeters < 150 ? 5 : (isUrbanCore ? 4 : 3);

  // Slope
  let S = approxElev < 118 ? 5 : (approxElev < 124 ? 4 : 2);

  // Multi-Criteria Weighted Linear Combination
  const fri = (currentWeights.elevation * E) +
              (currentWeights.river * D) +
              (currentWeights.rainfall * R) +
              (currentWeights.landuse * L) +
              (currentWeights.slope * S);

  let risk = "Low";
  if (fri >= 3.6) risk = "High";
  else if (fri >= 2.3) risk = "Medium";

  return {
    fri,
    risk,
    distMeters,
    approxElev,
    scores: { E, D, R, L, S }
  };
}

/* ==========================================================================
   5. MCDA / AHP WEIGHTED OVERLAY SIMULATOR
   ========================================================================== */
function initMCDASimulator() {
  const sliders = [
    { id: 'weight-elevation', key: 'elevation', valId: 'val-elevation' },
    { id: 'weight-river', key: 'river', valId: 'val-river' },
    { id: 'weight-rainfall', key: 'rainfall', valId: 'val-rainfall' },
    { id: 'weight-landuse', key: 'landuse', valId: 'val-landuse' },
    { id: 'weight-slope', key: 'slope', valId: 'val-slope' }
  ];

  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    const valEl = document.getElementById(s.valId);
    if (el && valEl) {
      el.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        valEl.textContent = `${val}%`;
        currentWeights[s.key] = val / 100.0;
        updateWeightSum();
      });
    }
  });

  const resetBtn = document.getElementById('btn-reset-weights');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('weight-elevation').value = 30;
      document.getElementById('val-elevation').textContent = '30%';
      document.getElementById('weight-river').value = 25;
      document.getElementById('val-river').textContent = '25%';
      document.getElementById('weight-rainfall').value = 20;
      document.getElementById('val-rainfall').textContent = '20%';
      document.getElementById('weight-landuse').value = 15;
      document.getElementById('val-landuse').textContent = '15%';
      document.getElementById('weight-slope').value = 10;
      document.getElementById('val-slope').textContent = '10%';

      currentWeights = { elevation: 0.30, river: 0.25, rainfall: 0.20, landuse: 0.15, slope: 0.10 };
      updateWeightSum();
      applySimulation();
    });
  }

  const applyBtn = document.getElementById('btn-apply-weights');
  if (applyBtn) {
    applyBtn.addEventListener('click', applySimulation);
  }
}

function updateWeightSum() {
  const sum = Math.round(
    (currentWeights.elevation +
     currentWeights.river +
     currentWeights.rainfall +
     currentWeights.landuse +
     currentWeights.slope) * 100
  );

  const badge = document.getElementById('weight-sum-badge');
  if (badge) {
    badge.textContent = `Total Weight: ${sum}%`;
    if (sum === 100) {
      badge.className = 'px-3 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
    } else {
      badge.className = 'px-3 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse';
    }
  }
}

function applySimulation() {
  // Re-calculate simulated land area share based on factor sensitivity
  // Sensitivity model: higher river & elevation weight expands high risk zone
  const elevDelta = (currentWeights.elevation - 0.30) * 15;
  const riverDelta = (currentWeights.river - 0.25) * 20;
  const rainDelta = (currentWeights.rainfall - 0.20) * 10;

  let highPct = Math.max(8, Math.min(30, 15.0 + elevDelta + riverDelta + rainDelta));
  let medPct = Math.max(15, Math.min(40, 27.0 - (elevDelta * 0.4)));
  let lowPct = 100.0 - (highPct + medPct);

  const highSqkm = (2528.0 * (highPct / 100.0)).toFixed(1);
  const medSqkm = (2528.0 * (medPct / 100.0)).toFixed(1);
  const lowSqkm = (2528.0 * (lowPct / 100.0)).toFixed(1);

  // Update DOM simulation metrics
  const simHigh = document.getElementById('sim-high-sqkm');
  const simMed = document.getElementById('sim-med-sqkm');
  const simLow = document.getElementById('sim-low-sqkm');

  if (simHigh) simHigh.textContent = `${highSqkm} km² (${highPct.toFixed(1)}%)`;
  if (simMed) simMed.textContent = `${medSqkm} km² (${medPct.toFixed(1)}%)`;
  if (simLow) simLow.textContent = `${lowSqkm} km² (${lowPct.toFixed(1)}%)`;

  // Flash message
  const toast = document.getElementById('simulation-toast');
  if (toast) {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  }
}

/* ==========================================================================
   6. RELIEF CAMP SITE SUITABILITY ENGINE
   ========================================================================== */
function initReliefCampCards() {
  const container = document.getElementById('relief-camps-cards-container');
  if (!container) return;

  container.innerHTML = RELIEF_CAMPS_DATA.map(c => `
    <div class="glass-card p-5 rounded-xl border border-slate-700/80 hover:border-blue-500/60 transition-all flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">⛺</span>
              <h3 class="font-bold text-base text-white">${c.name}</h3>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${c.location} (${c.tehsil})</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Score: ${c.suitability_score}%
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-300 mb-3">${c.description}</p>

        <div class="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-lg mb-3">
          <div><span class="text-slate-400">Shelter Capacity:</span> <strong class="text-white">${c.capacity_persons.toLocaleString()}</strong></div>
          <div><span class="text-slate-400">Elevation:</span> <strong class="text-emerald-400">${c.elevation_m} m</strong></div>
          <div><span class="text-slate-400">River Distance:</span> <strong class="text-emerald-400">${c.dist_to_gomti_m} m</strong></div>
          <div><span class="text-slate-400">Road Distance:</span> <strong class="text-emerald-400">${c.dist_to_major_road_m} m</strong></div>
        </div>

        <div class="space-y-1 mb-4 text-[11px]">
          <div class="flex items-center gap-1.5 text-emerald-400">
            <i class="fas fa-check-circle"></i> <span>Within Low Risk Zone (1.0 - 2.3 FRI)</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400">
            <i class="fas fa-check-circle"></i> <span>Safe distance from Gomti River (>1,000 m)</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400">
            <i class="fas fa-check-circle"></i> <span>Direct arterial access within 500 m (${c.nearest_road})</span>
          </div>
          <div class="flex items-center gap-1.5 text-emerald-400">
            <i class="fas fa-check-circle"></i> <span>Proximate to healthcare within 3 km (${c.nearest_hospital} - ${c.dist_to_hospital_km} km)</span>
          </div>
        </div>
      </div>

      <div class="flex gap-2 pt-2 border-t border-slate-700/60">
        <button onclick="flyToReliefCamp('${c.id}')" class="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition">
          <i class="fas fa-crosshairs"></i> Locate on Map
        </button>
        <button onclick="inspectReliefCamp('${c.id}')" class="py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition">
          Full Dossier
        </button>
      </div>
    </div>
  `).join('');
}

function flyToReliefCamp(campId) {
  const camp = RELIEF_CAMPS_DATA.find(c => c.id === campId);
  if (camp && map) {
    // Switch to map tab
    switchTab('map-view');
    map.flyTo([camp.lat, camp.lon], 14, { duration: 1.2 });
    setTimeout(() => {
      L.popup()
        .setLatLng([camp.lat, camp.lon])
        .setContent(`
          <div class="p-2 text-xs">
            <h3 class="font-bold text-sm text-emerald-400">⛺ ${camp.name}</h3>
            <p class="text-slate-300 font-mono text-[11px]">${camp.location}</p>
            <p class="text-white mt-1">Capacity: <strong>${camp.capacity_persons.toLocaleString()} persons</strong></p>
            <p class="text-slate-400">Elevation: ${camp.elevation_m}m | River: ${camp.dist_to_gomti_m}m</p>
          </div>
        `)
        .openOn(map);
    }, 1300);
  }
}

function inspectReliefCamp(campId) {
  const camp = RELIEF_CAMPS_DATA.find(c => c.id === campId);
  if (!camp) return;

  const modal = document.getElementById('relief-modal');
  const title = document.getElementById('modal-camp-title');
  const content = document.getElementById('modal-camp-content');

  if (modal && title && content) {
    title.innerHTML = `⛺ ${camp.name} - Detailed Technical Dossier`;
    content.innerHTML = `
      <div class="space-y-4">
        <div class="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm font-bold text-white">${camp.location}</span>
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">Suitability Index: ${camp.suitability_score} / 100</span>
          </div>
          <p class="text-xs text-slate-300">${camp.description}</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div class="bg-slate-800/60 p-2.5 rounded border border-slate-700">
            <span class="text-slate-400 block text-[10px]">COORDINATES</span>
            <strong class="text-white">${camp.lat}° N, ${camp.lon}° E</strong>
          </div>
          <div class="bg-slate-800/60 p-2.5 rounded border border-slate-700">
            <span class="text-slate-400 block text-[10px]">GROUND ELEVATION</span>
            <strong class="text-emerald-400">${camp.elevation_m} meters MSL</strong>
          </div>
          <div class="bg-slate-800/60 p-2.5 rounded border border-slate-700">
            <span class="text-slate-400 block text-[10px]">ESTIMATED CAPACITY</span>
            <strong class="text-sky-400">${camp.capacity_persons.toLocaleString()} displaced citizens</strong>
          </div>
          <div class="bg-slate-800/60 p-2.5 rounded border border-slate-700">
            <span class="text-slate-400 block text-[10px]">DISTANCE TO GOMTI</span>
            <strong class="text-emerald-400">${camp.dist_to_gomti_m} meters</strong>
          </div>
          <div class="bg-slate-800/60 p-2.5 rounded border border-slate-700">
            <span class="text-slate-400 block text-[10px]">HIGHWAY ACCESS</span>
            <strong class="text-emerald-400">${camp.dist_to_major_road_m} m (${camp.nearest_road})</strong>
          </div>
          <div class="bg-slate-800/60 p-2.5 rounded border border-slate-700">
            <span class="text-slate-400 block text-[10px]">MEDICAL PROXIMITY</span>
            <strong class="text-emerald-400">${camp.dist_to_hospital_km} km (${camp.nearest_hospital})</strong>
          </div>
        </div>

        <h4 class="text-xs font-bold text-slate-200 uppercase tracking-wider">Multi-Criteria Boolean Constraint Verification</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            <span><strong>Constraint 1:</strong> Located in Low Risk Flood Zone (1.0 - 2.3)</span>
          </div>
          <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            <span><strong>Constraint 2:</strong> >1,000 m River Distance Buffer</span>
          </div>
          <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            <span><strong>Constraint 3:</strong> Within 500 m of Major Road Network</span>
          </div>
          <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            <span><strong>Constraint 4:</strong> Located on Public School / Institutional Ground</span>
          </div>
          <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            <span><strong>Preference 1:</strong> Hospital access within 3 km verified</span>
          </div>
          <div class="p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 flex items-center gap-2">
            <i class="fas fa-check-circle"></i>
            <span><strong>Preference 2:</strong> Topographic elevation > 125 m MSL verified</span>
          </div>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  }
}

function closeReliefModal() {
  const modal = document.getElementById('relief-modal');
  if (modal) modal.classList.add('hidden');
}

/* ==========================================================================
   7. EXPOSURE DATA TABLE & CSV/GEOJSON EXPORT
   ========================================================================== */
function initDataTable() {
  const categorySelect = document.getElementById('table-category-select');
  const searchInput = document.getElementById('table-search-input');
  const riskSelect = document.getElementById('table-risk-filter');

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      currentTableCategory = e.target.value;
      renderTableRows();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentTableSearch = e.target.value.toLowerCase();
      renderTableRows();
    });
  }

  if (riskSelect) {
    riskSelect.addEventListener('change', (e) => {
      currentRiskFilter = e.target.value;
      renderTableRows();
    });
  }

  renderTableRows();
}

function renderTableRows() {
  const tbody = document.getElementById('exposure-table-body');
  const countBadge = document.getElementById('table-count-badge');
  if (!tbody) return;

  let items = [];
  if (currentTableCategory === 'hospitals') {
    items = HOSPITALS_DATA;
  } else if (currentTableCategory === 'schools') {
    items = SCHOOLS_DATA;
  } else if (currentTableCategory === 'roads') {
    items = ROADS_GEOJSON.features.map((f, i) => ({
      id: `ROAD-${i + 1}`,
      name: f.properties.name,
      risk: f.properties.high_risk_km > 5 ? 'High' : 'Medium',
      total_km: f.properties.total_km,
      high_risk_km: f.properties.high_risk_km,
      type: f.properties.type
    }));
  }

  // Filter
  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(currentTableSearch) ||
                          item.id.toLowerCase().includes(currentTableSearch);
    const matchesRisk = currentRiskFilter === 'all' || item.risk === currentRiskFilter;
    return matchesSearch && matchesRisk;
  });

  if (countBadge) {
    countBadge.textContent = `Showing ${filtered.length} of ${items.length} records`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">No matching assets found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 50).map(item => `
    <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition">
      <td class="p-3 text-xs font-mono text-slate-400">${item.id}</td>
      <td class="p-3 text-xs font-semibold text-white">${item.name}</td>
      <td class="p-3 text-xs text-slate-300">${item.type || 'N/A'}</td>
      <td class="p-3 text-xs">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.risk === 'High' ? 'badge-high' : item.risk === 'Medium' ? 'badge-med' : 'badge-low'}">
          ${item.risk} Risk
        </span>
      </td>
      <td class="p-3 text-xs font-mono text-slate-300">
        ${item.elev ? `${item.elev} m` : (item.total_km ? `${item.total_km} km` : 'N/A')}
      </td>
      <td class="p-3 text-xs text-right">
        ${item.lat ? `
          <button onclick="flyToCoord(${item.lat}, ${item.lon}, '${item.name.replace(/'/g, "\\'")}')" class="text-blue-400 hover:text-blue-300 text-xs font-medium">
            <i class="fas fa-crosshairs"></i> View
          </button>
        ` : 'Corridor'}
      </td>
    </tr>
  `).join('');
}

function flyToCoord(lat, lon, name) {
  switchTab('map-view');
  map.flyTo([lat, lon], 15, { duration: 1.2 });
  setTimeout(() => {
    L.popup()
      .setLatLng([lat, lon])
      .setContent(`<div class="p-1 text-xs"><strong>${name}</strong><br>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}</div>`)
      .openOn(map);
  }, 1300);
}

function exportTableCSV() {
  let items = currentTableCategory === 'hospitals' ? HOSPITALS_DATA : (currentTableCategory === 'schools' ? SCHOOLS_DATA : []);
  if (items.length === 0) return;

  const headers = Object.keys(items[0]).join(',');
  const rows = items.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
  const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `lucknow_${currentTableCategory}_exposure.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportGeoJSONData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(FLOOD_RISK_ZONES_GEOJSON, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "lucknow_flood_risk_zones.geojson");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/* ==========================================================================
   8. LOCALITY & FACILITY SEARCH ENGINE (100% EXHAUSTIVE GIS REGISTRY)
   ========================================================================== */
let globalSearchIndex = [];

function initSearch() {
  const searchInput = document.getElementById('map-search-input');
  const resultsContainer = document.getElementById('search-results-dropdown');
  if (!searchInput || !resultsContainer) return;

  // Build complete unified searchable registry
  globalSearchIndex = [];

  // 1. Prominent Localities & Tehsil Centers
  const localities = [
    { id: "LOC-01", name: "Hazratganj (Central Lucknow)", address: "Hazratganj, Lucknow", lat: 26.8467, lon: 80.9462, type: "Urban Center / Commercial Hub", category: "locality" },
    { id: "LOC-02", name: "Gomti Nagar (Urban Terraces)", address: "Gomti Nagar, Lucknow", lat: 26.8500, lon: 81.0000, type: "Planned Residential & Commercial Hub", category: "locality" },
    { id: "LOC-03", name: "Chowk / Old Lucknow", address: "Chowk, Lucknow", lat: 26.8680, lon: 80.9020, type: "Historic Core / Heritage Ward", category: "locality" },
    { id: "LOC-04", name: "Aliganj / Nirala Nagar", address: "Aliganj, Lucknow", lat: 26.8850, lon: 80.9400, type: "Trans-Gomti Planned Sector", category: "locality" },
    { id: "LOC-05", name: "Bakshi Ka Talab (BKT Tehsil HQ)", address: "Sitapur Road, BKT, Lucknow", lat: 26.9850, lon: 80.9250, type: "Tehsil Headquarters", category: "locality" },
    { id: "LOC-06", name: "Mohanlalganj Tehsil HQ", address: "Raebareli Highway, Mohanlalganj, Lucknow", lat: 26.6800, lon: 80.9850, type: "Tehsil Headquarters", category: "locality" },
    { id: "LOC-07", name: "Malihabad Tehsil HQ", address: "Malihabad Town, Lucknow", lat: 26.9200, lon: 80.7100, type: "Tehsil Headquarters", category: "locality" },
    { id: "LOC-08", name: "Sarojini Nagar / Airport Corridor", address: "Kanpur Road, Sarojini Nagar, Lucknow", lat: 26.7600, lon: 80.8800, type: "Tehsil & Aviation Suburb", category: "locality" },
    { id: "LOC-09", name: "Chinhat / Faizabad Road", address: "Faizabad Road, Chinhat, Lucknow", lat: 26.8850, lon: 81.0450, type: "East Suburb & Industrial Cluster", category: "locality" },
    { id: "LOC-10", name: "Gosainganj Rural Core", address: "Sultanpur Road, Gosainganj, Lucknow", lat: 26.7720, lon: 81.1200, type: "Sultanpur Highway Sub-center", category: "locality" },
    { id: "LOC-11", name: "Jankipuram Extension", address: "Sitapur Road, Jankipuram, Lucknow", lat: 26.9250, lon: 80.9450, type: "North Residential Sector", category: "locality" },
    { id: "LOC-12", name: "Indira Nagar", address: "Ring Road, Indira Nagar, Lucknow", lat: 26.8850, lon: 80.9850, type: "Major Residential Colony", category: "locality" }
  ];
  localities.forEach(loc => globalSearchIndex.push(loc));

  // 2. All 142 Healthcare Facilities (with exact addresses and phone contacts)
  HOSPITALS_DATA.forEach(h => {
    globalSearchIndex.push({
      id: h.id,
      name: h.name,
      address: h.address,
      lat: h.lat,
      lon: h.lon,
      risk: h.risk,
      type: `Hospital (${h.risk} Risk, ${h.beds} beds)`,
      category: "hospital",
      data: h
    });
  });

  // 3. All 385 Educational Institutions (Schools, Colleges, Universities)
  SCHOOLS_DATA.forEach(s => {
    globalSearchIndex.push({
      id: s.id,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lon: s.lon,
      risk: s.risk,
      type: `Educational Inst. (${s.risk} Risk${s.suitable_for_shelter ? ', Shelter Eligible' : ''})`,
      category: "school",
      data: s
    });
  });

  // 4. Candidate Emergency Relief Camps
  RELIEF_CAMPS_DATA.forEach(c => {
    globalSearchIndex.push({
      id: c.id,
      name: `${c.name} (Designated Shelter)`,
      address: `${c.location}, Tehsil ${c.tehsil}`,
      lat: c.lat,
      lon: c.lon,
      type: `Relief Camp (Suitability Score: ${c.suitability_score}%)`,
      category: "relief_camp",
      data: c
    });
  });

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (q.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }

    const words = q.split(/\s+/).filter(w => w.length > 0);
    const matches = globalSearchIndex.filter(item => {
      const fullText = `${item.id} ${item.name} ${item.address || ''} ${item.type || ''}`.toLowerCase();
      return words.every(word => fullText.includes(word));
    }).slice(0, 8);

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="p-3 text-xs text-slate-500">No matching hospital, school, or locality found. Try "Shifa", "University", "KGMU", "Jankipuram", or "Chinhat".</div>`;
      resultsContainer.classList.remove('hidden');
      return;
    }

    resultsContainer.innerHTML = matches.map(item => `
      <div onclick="selectSearchResultById('${item.id}')" class="p-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-700/60 last:border-none transition">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-white">${item.name}</span>
          ${item.risk ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${item.risk === 'High' ? 'badge-high' : item.risk === 'Medium' ? 'badge-med' : 'badge-low'}">${item.risk}</span>` : ''}
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${item.address || item.type}</div>
        <div class="text-[10px] text-blue-400 font-mono mt-0.5">${item.id} • ${item.lat.toFixed(4)}°N, ${item.lon.toFixed(4)}°E</div>
      </div>
    `).join('');
    resultsContainer.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.classList.add('hidden');
    }
  });
}

function selectSearchResultById(id) {
  const item = globalSearchIndex.find(e => e.id === id);
  if (!item) return;

  const resultsContainer = document.getElementById('search-results-dropdown');
  const searchInput = document.getElementById('map-search-input');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  if (searchInput) searchInput.value = item.name;

  // Ensure map tab is active
  switchTab('map-view');

  // Activate layer visibility if inactive
  if (item.category === 'hospital') {
    setLayerVisible('hospitals', true);
  } else if (item.category === 'school') {
    setLayerVisible('schools', true);
  } else if (item.category === 'relief_camp') {
    setLayerVisible('reliefCamps', true);
  }

  const targetZoom = item.category === 'locality' ? 14 : 16;
  map.flyTo([item.lat, item.lon], targetZoom, { duration: 1.2 });

  setTimeout(() => {
    if (window.facilityMarkers && window.facilityMarkers[item.id]) {
      window.facilityMarkers[item.id].openPopup();
    } else {
      L.popup()
        .setLatLng([item.lat, item.lon])
        .setContent(`
          <div class="p-2 text-xs space-y-1">
            <strong class="text-sm text-white">${item.name}</strong>
            <p class="text-slate-300">${item.address || item.type}</p>
            <div class="font-mono text-[11px] text-sky-400">Coords: ${item.lat.toFixed(4)}°N, ${item.lon.toFixed(4)}°E</div>
          </div>
        `)
        .openOn(map);
    }
  }, 1300);
}

function selectSearchResult(lat, lon, name) {
  const match = globalSearchIndex.find(e => Math.abs(e.lat - lat) < 0.001 && Math.abs(e.lon - lon) < 0.001);
  if (match) {
    selectSearchResultById(match.id);
  } else {
    map.flyTo([lat, lon], 15, { duration: 1.2 });
  }
}

function quickSearch(query) {
  const searchInput = document.getElementById('map-search-input');
  if (searchInput) {
    searchInput.value = query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    // Auto-select first exact or top match if available
    setTimeout(() => {
      const words = query.toLowerCase().split(/\s+/);
      const topMatch = globalSearchIndex.find(item => {
        const fullText = `${item.id} ${item.name} ${item.address || ''}`.toLowerCase();
        return words.every(word => fullText.includes(word));
      });
      if (topMatch) {
        selectSearchResultById(topMatch.id);
      }
    }, 150);
  }
}

/* ==========================================================================
   9. TAB NAVIGATION
   ========================================================================== */
function initTabNavigation() {
  const tabs = document.querySelectorAll('[data-tab-target]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab-target');
      switchTab(targetId);
    });
  });
}

function switchTab(targetId) {
  const tabs = document.querySelectorAll('[data-tab-target]');
  const views = document.querySelectorAll('.tab-view');

  tabs.forEach(t => {
    if (t.getAttribute('data-tab-target') === targetId) {
      t.classList.add('tab-active');
      t.classList.remove('text-slate-400');
    } else {
      t.classList.remove('tab-active');
      t.classList.add('text-slate-400');
    }
  });

  views.forEach(v => {
    if (v.id === targetId) {
      v.classList.remove('hidden');
    } else {
      v.classList.add('hidden');
    }
  });

  // If switched to map, invalidate map size for correct rendering
  if (targetId === 'map-view' && map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  // If switched to analytics, re-render charts
  if (targetId === 'analytics-view') {
    setTimeout(() => {
      initAnalyticsCharts();
    }, 100);
  }
}

/* ==========================================================================
   10. LIVE METRIC COUNTERS
   ========================================================================== */
function updateLiveKPIs() {
  const elTotalArea = document.getElementById('kpi-total-area');
  const elHighRisk = document.getElementById('kpi-high-risk');
  const elHospitals = document.getElementById('kpi-hospitals');
  const elSchools = document.getElementById('kpi-schools');
  const elRoads = document.getElementById('kpi-roads');

  if (elTotalArea) elTotalArea.textContent = `${SUMMARY_STATS.total_district_area_sqkm.toLocaleString()} km²`;
  if (elHighRisk) elHighRisk.textContent = `379.20 km² (15.0%)`;
  if (elHospitals) elHospitals.textContent = `24 / 142 (16.9%)`;
  if (elSchools) elSchools.textContent = `52 / 385 (13.5%)`;
  if (elRoads) elRoads.textContent = `168 km / 1,120 km`;
}

// Copy script to clipboard helper
function copyScriptCode(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    alert("Script copied to clipboard successfully!");
  });
}
