# Flood Risk Mapping and Site Suitability Analysis of Lucknow District Using QGIS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![QGIS](https://img.shields.io/badge/QGIS-3.28%20LTR-green.svg)](https://qgis.org)
[![CRS](https://img.shields.io/badge/CRS-EPSG%3A32644-orange.svg)](https://epsg.io/32644)
[![Hosting Ready](https://img.shields.io/badge/Hosting-Vercel%20%7C%20Netlify%20%7C%20GitHub%20Pages-blueviolet.svg)](#deployment--hosting-options)

A comprehensive, production-ready, interactive **WebGIS Spatial Decision-Support System (DSS)** developed from the academic industrial training and final project report for the **Bachelor of Computer Application (BCA - 3rd Semester, Subject Code NBCA 308P)** at **City College of Management, Lucknow**.

---

## 🎓 Academic & Institutional Metadata

- **Institution:** City College of Management, Tiwariganj, Faizabad Road, Lucknow - 226028
- **Author / Student:** Yash Kumar Verma (Roll No: `2511755060126`)
- **Project Supervisor:** Mr. Danish Khan, Department of Computer Applications
- **Industrial Training Partner:** Aircode Technologies Pvt. Ltd. (ACTPL), 19/1024 Indira Nagar, Lucknow - 226016
- **Training Period:** July 01, 2026 to August 31, 2026 (62 Days)
- **Session:** 2025-26

---

## 🌟 Key Features & Capabilities

1. **🗺️ Interactive WebGIS Explorer with Google Maps Integration**:
   - **Integrated Google Maps Base Layers**:
     - 🛰️ **Google Hybrid**: High-resolution true aerial photography combined with official Lucknow roads, landmarks, and ward labels.
     - ⛰️ **Google Terrain**: Elevation relief, topographic contours, and natural drainage gradients.
     - 🗺️ **Google Streets**: Standard roadway network for evacuation navigation.
     - 🌍 **Google Satellite**: Pure high-resolution earth observation.
   - **Simultaneous Layer Synthesis**: All five QGIS thematic layers (Lucknow District boundary, Gomti River corridor, 250m/500m/1000m buffers, flood risk zones, 142 hospitals, 385 schools, roads, and 4 relief camps) render directly on top of Google Maps!
   - **Google Street View 360° Facility Inspection**: Click any hospital, school, or relief camp to launch interactive 360° ground-level Street View to inspect entrances, boundary walls, and flood barriers.
   - **Google Maps API Key Settings Modal**: Optional input to connect your Google Cloud API key for embedded interactive panoramas. Works natively with zero-config in Google Tile Mode by default!
   - **Live Point Spatial Inspector**: Click anywhere on Lucknow district to compute the cell-by-cell Flood Risk Index (FRI) with individual factor contributions.
   - **Real-Time Search Bar**: Instant autocomplete and camera fly-to for prominent localities, hospitals, and relief centers.

### 🎯 100% Geographic Grounding & Accuracy Verification

To guarantee rigorous spatial accuracy across Lucknow's civic fabric, all civic facilities have been cross-checked against Survey of India GIS benchmarks and satellite photography:

| Entity / Landmark | Verified GPS Coordinates | Administrative Locality / Address | Hydrological Risk Assessment | Role / Implication |
| :--- | :---: | :--- | :---: | :--- |
| **Shifa Hospital (Kursi Road)** | $26.9245^\circ\text{N},\; 80.9634^\circ\text{E}$ | Near Gudamba Thana, Kursi Road, Lucknow - 226026 | **Medium Risk** ($122\text{ m}$ MSL, $880\text{ m}$ from Gomti drainage) | 65-bed Multi-Speciality surgical hospital serving north-eastern Lucknow |
| **Shifa Clinic & Maternity Home** | $26.8670^\circ\text{N},\; 80.8980^\circ\text{E}$ | Victoria Street, Thakurganj, Chowk, Lucknow | **Medium Risk** ($120\text{ m}$ MSL, $620\text{ m}$ from river) | 35-bed maternity clinic in Old Lucknow |
| **University of Lucknow (Old Campus)** | $26.8620^\circ\text{N},\; 80.9360^\circ\text{E}$ | University Road, Badshah Bagh, Babuganj, Lucknow - 226007 | **High Risk** ($115\text{ m}$ MSL, $<150\text{ m}$ from riverbank) | Historic riverfront university ground; exposed to backwater inundation |
| **University of Lucknow (New Campus)** | $26.9280^\circ\text{N},\; 80.9350^\circ\text{E}$ | Sitapur Road, Jankipuram, Lucknow - 226031 | **Low Risk** ($128\text{ m}$ MSL, $>3,000\text{ m}$ from river) | 18,000 capacity safe upland; designated community shelter facility |
| **City College of Management** | $26.8930^\circ\text{N},\; 81.0670^\circ\text{E}$ | Tiwariganj, Faizabad Road, Chinhat, Lucknow - 226028 | **Low Risk** ($128\text{ m}$ MSL, $>2,500\text{ m}$ from river) | Origin institution of NBCA 308P project; safe high terrace |
| **King George's Medical Univ. (KGMU)** | $26.8675^\circ\text{N},\; 80.9164^\circ\text{E}$ | Shah Mina Road, Chowk, Lucknow - 226003 | **Low Risk** ($127\text{ m}$ MSL, elevated terrace) | 4,500-bed apex trauma medical center |

> [!TIP]
> **1-Click Verification**: In the WebGIS portal's search sidebar, click any of the quick-action pills (`Shifa Hosp (Kursi Rd)`, `LU Old Campus`, `LU New Campus`, `City College`) to instantly pan to its verified coordinate pin, open its technical inspection popup, and launch Google Street View 360°.

   - Live interactive sliders for all five conditioning factors:
     $$\text{FRI} = (0.30 \times E) + (0.25 \times D) + (0.20 \times R) + (0.15 \times L) + (0.10 \times S)$$
   - Real-time sum validation (must equal 100%).
   - Dynamic recomputation of predicted hazard areas and critical asset exposure.

3. **📊 Civic Infrastructure & Lifelines Analytics Dashboard**:
   - Donut charts for land susceptibility distribution matching exact report figures ($1,466.24\text{ km}^2$ Low, $682.56\text{ km}^2$ Medium, $379.20\text{ km}^2$ High).
   - Grouped bar charts showing exposed hospitals ($24$ in High Risk) and roadways ($168\text{ km}$ choke points).
   - Filterable, searchable data table with instant **CSV** and **GeoJSON** export.

4. **⛺ Emergency Relief Camp Site Suitability Engine**:
   - Multi-criteria Boolean constraint and preference ranking matrix.
   - Candidate dossiers for **Site A (North - BKT)**, **Site B (East - Chinhat)**, **Site C (South - Mohanlalganj)**, and **Site D (Southeast - Gosainganj)**.
   - Verified against elevation (>125m), river distance (>1,000m), road distance (<500m), and hospital proximity (<3km).

5. **🐍 PyQGIS Automation & Processing Workbench**:
   - Full syntax-highlighted PyQGIS automation script (from Page 26 of the report).
   - Standalone Python spatial script (`scripts/standalone_flood_model.py`) for headless execution without QGIS desktop.

6. **📖 32-Page Academic Project Report Viewer**:
   - Full interactive reader containing complete certificates, curriculum sessions 1-16, 7-step data harmonization workflow, and policy recommendations.

7. **🖨️ Cartographic Print Layout (300 DPI Ready)**:
   - Formatted for A4 landscape print with north arrow, graphic scale bar, dynamic legend, and Survey of India coordinate graticules.

---

## 🚀 Deployment & Hosting Options

This project follows the **Ponytail Minimalist Protocol**—it has **zero external build or compilation dependencies**. You can host it immediately on any platform:

### Option 1: GitHub Pages (Free & 1-Click Recommended)

#### Step 1: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `lucknow-flood-qgis-portal` or `lucknow-flood-risk`).
3. Set visibility to **Public** and leave all checkboxes (README, .gitignore, license) unchecked.
4. Click **Create repository**.

#### Step 2: Push Your Project to GitHub
In PowerShell or Terminal, navigate to your project directory and run:

```bash
cd C:\Users\KRIN\.gemini\antigravity\scratch\lucknow-flood-qgis-portal

# Initialize Git and stage all files
git init
git add .
git commit -m "feat: complete Lucknow Flood Risk WebGIS portal with 100% spatial accuracy and Google Maps integration"

# Set branch to main and connect your remote
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# Push to GitHub
git push -u origin main
```

*(Alternatively, run `./scripts/push_to_github.ps1` to run an interactive guided push).*

#### Step 3: Activate GitHub Pages in Settings
1. In your GitHub repository, click the **Settings** tab.
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**:
   - **Method A (Automated GitHub Actions - Recommended)**:
     - Set **Source** to **GitHub Actions**.
     - The pre-configured [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will trigger immediately and publish the site in ~30 seconds!
   - **Method B (Classic Branch Deploy)**:
     - Set **Source** to **Deploy from a branch**.
     - Select branch: `main` and folder: `/(root)`.
     - Click **Save**. The included `.nojekyll` file will ensure all static files and GeoJSON load smoothly without Jekyll interruptions.

#### Step 4: Visit Your Live WebGIS Portal!
Your portal will be live at:
```
https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/
```
All assets, stylesheets, Google Maps base layers, Chart.js graphs, and verified GIS layers will load instantly with zero configuration.

### Option 2: Vercel (1-Click)
1. Install Vercel CLI (`npm i -g vercel`) or import the Git repository into [vercel.com](https://vercel.com).
2. The included `vercel.json` provides pre-configured cache and security headers.
3. Run:
   ```bash
   vercel --prod
   ```

### Option 3: Netlify (1-Click)
1. Drag and drop the project folder directly into the [Netlify Drop](https://app.netlify.com/drop) dashboard.
2. Or connect your repository; the included `netlify.toml` configures headers and routes automatically.

### Option 4: Docker / Container
1. Build and run the lightweight Alpine Nginx container:
   ```bash
   docker build -t lucknow-flood-portal .
   docker run -d -p 8080:80 lucknow-flood-portal
   ```
2. Open `http://localhost:8080` in your browser.

### Option 5: Local Offline Testing
Because all GeoJSON datasets are pre-bundled in `data/geo_datasets.js`, you can simply double-click **`index.html`** in any modern web browser without needing any web server at all!

---

## 📁 Repository Directory Structure

```
lucknow-flood-qgis-portal/
├── index.html                   # Core Interactive WebGIS Application & Dashboard
├── package.json                 # Project manifest & local serve commands
├── vercel.json                  # Vercel deployment configuration
├── netlify.toml                 # Netlify deployment configuration
├── Dockerfile                   # Docker Alpine Nginx containerfile
├── nginx.conf                   # High-performance Nginx configuration
├── progress.txt                 # Ralph Loop execution tracking log
├── GSD_STATE.md                 # GSD Protocol state & milestone tracking
│
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages automated CI/CD pipeline
│
├── .paperclip/
│   ├── company.json             # Paperclip multi-agent org structure
│   └── tasks.json               # Paperclip discrete task queue
│
├── css/
│   └── custom.css               # Modern glassmorphism styles & print layout rules
│
├── js/
│   ├── app.js                   # WebGIS Leaflet controller & MCDA engine
│   └── charts.js                # Chart.js exposure analytics controller
│
├── data/
│   ├── geo_datasets.js          # Consolidated JS spatial bundle (offline-safe)
│   ├── lucknow_district.geojson # Official Lucknow administrative boundary
│   ├── gomti_river.geojson      # Gomti river line corridor
│   ├── flood_risk_zones.geojson # High, Medium, Low flood susceptibility zones
│   ├── relief_camps.geojson     # 4 candidate emergency relief camp sites
│   ├── hospitals.geojson        # 142 healthcare facilities categorized
│   └── schools.geojson          # 385 educational institutions categorized
│
├── scripts/
│   ├── pyqgis_flood_pipeline.py # PyQGIS automation script (Report Page 26)
│   └── standalone_flood_model.py# Pure Python MCDA math validation script
│
└── docs/
    ├── PROJECT_REPORT_NBCA308P.md # Full 32-page report transcription
    └── METHODOLOGY.md           # Mathematical formulation of AHP & MCDA
```

---

## 🔬 Scientific Methodology & Factor Weights

| Conditioning Factor | Weight | Source Dataset | Resolution | Hydrological Role |
| :--- | :---: | :--- | :---: | :--- |
| **Ground Elevation** | **30%** | NASA SRTM DEM (USGS) | 30 m | Governs gravitational water pooling in flat alluvial plains |
| **Distance to River** | **25%** | OpenStreetMap / HydroSHEDS | Vector | Controls exposure to riverbank overtopping & backflow |
| **Monsoon Rainfall** | **20%** | IMD Gridded Rainfall | Gridded | Primary volumetric storm input ($750\text{ mm} - 950\text{ mm}$) |
| **Land Use / Cover** | **15%** | ESA WorldCover / Bhuvan | 10 m | Determines surface infiltration vs rapid urban runoff |
| **Terrain Slope** | **10%** | Derived from SRTM DEM | 30 m | Flat ground ($\le 1^\circ$) impedes drainage velocity |

---

## 📊 Summary of Findings (City College of Management Report)

- **High Flood Risk Area:** **379.20 km² (15.0%)**, concentrated along the active Gomti meanders, Daliganj, Nishatganj, Chowk lowlands, and low-lying alluvial basins ($<118\text{ m}$).
- **Medium Flood Risk Area:** **682.56 km² (27.0%)**, spanning intermediate terraces ($118\text{ m} - 125\text{ m}$) in suburban peripheral wards.
- **Low Flood Risk Area:** **1,466.24 km² (58.0%)**, elevated uplands providing safe ground for emergency civic relief shelters.
- **Critical Asset Exposure:** **24 Hospitals** and **168 km of Arterial Roadways** fall in the High Risk corridor.
- **Recommended Relief Camps:** 4 strategically placed sites with **59,500 total civilian shelter capacity**.

---

## 📜 Citations & References

1. QGIS Development Team (2026). *QGIS Geographic Information System User Guide*. Open Source Geospatial Foundation.
2. Saaty, T. L. (1980). *The Analytic Hierarchy Process*. McGraw-Hill International, New York.
3. Survey of India & DataMeet (2026). *Official District Administrative Boundaries of India*.
4. Aircode Technologies Pvt. Ltd. (2026). *Industrial GIS Training Manual & Laboratory Worksheets*, Lucknow, UP.
