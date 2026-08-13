# PROJECT.md — Portfolio Site Rebuild (Kate Rybina)

## 1. Purpose
Rebuild the personal portfolio site with the NEW design taken from the Figma file,
while migrating 100% of existing content from the old pages unchanged.
Static site, no build step, deployed to GitHub Pages.

Owner context (tone reference):
- PhD, Senior GIS Engineer, Remote Sensing & GIS Specialist, Land & Water Monitoring
- Key stats: 25+ years in geodata; 60+ GIS solutions designed & deployed;
  9 database patents; 3,000+ maps & analytical products

## 2. Sources of truth
- DESIGN: Figma file (via Figma MCP). Color styles, text styles and components
  must be used exactly. Do not invent colors, fonts or components.
- CONTENT: existing HTML pages (inventory below). Migrate text verbatim, English only.
- MAP: the map implementation inside Geoanalytics.html is FROZEN (see rules.md #9).
- If Figma and old pages conflict on TEXT → old content wins on migrated pages.
  Figma wins on the main page.

## 3. Current inventory (old site, workspace root)
- OLD_VERSION/               → archive, DO NOT TOUCH
- main_page/Images/          → new design assets: Screen2_bg.jpg, Screen5_image.jpg,
                               Screen6_image.jpg, Screen7_image.jpg
- Research/research.html
- Research/images/           → dem.jpg, Geography.jpg, Geology.jpg, Groundwater.jpg,
                               my-photo.jpg, ndvi1986.jpg … ndvi2025.jpg,
                               precipitation.jpg, scenario_a.jpg, scenario_b.jpg,
                               scenario_c.jpg, scenario_c_big.jpg, Screen2_bg.jpg,
                               sun_radiation.jpg, temp_max.jpg, temp_min.jpg,
                               Watervaporpressure.jpg, wind_speed.jpg
- contacts.html
- Geoanalytics.html          → contains the FROZEN map
- publications.html

## 4. Target structure (GitHub Pages-ready)
repo-root/
├── index.html               # new main page from Figma
├── geoanalytics.html        # lowercase file names everywhere!
├── publications.html
├── contacts.html
├── research.html
├── css/styles.css           # the ONLY css file for the whole site
├── js/main.js               # shared UI behavior (menu, footer)
├── js/geoanalytics-map.js   # map code moved AS-IS from the old page
├── assets/img/main/         # main page images (keep original file names)
├── assets/img/research/     # research images (keep original file names)
├── PROJECT.md, rules.md, skills.md, .clinerules
└── OLD_VERSION/             # archive, untouched

Note: two files named Screen2_bg.jpg exist (main & research) — keep them in
separate subfolders to avoid collision.

## 5. Migration map
old                          → new              → notes
Figma design                 → index.html       → build from Figma components/styles
Geoanalytics.html            → geoanalytics.html→ restyle header/footer ONLY; map as-is
publications.html            → publications.html→ content verbatim, new styles
contacts.html                → contacts.html    → content verbatim, new styles
Research/research.html       → research.html    → content verbatim, fix image paths

## 6. Build order
1) Extract design tokens (colors, type, radii, spacing) from Figma → css/styles.css (:root).
2) Build shared header/menu/footer components (from Figma) once, reuse on all pages.
3) index.html. 4) geoanalytics.html (map frozen). 5) publications.html.
6) research.html. 7) contacts.html. 8) Final check & deploy notes.

## 7. Deployment
GitHub Pages (static). Relative paths only (site must work at / and at /repo-name/).
Lowercase file names (GH Pages serves on case-sensitive Linux).

## 8. Link map — single source of truth for ALL hrefs

Internal links (relative paths, lowercase):
- Logo / Home      → index.html
- About me         → index.html
- Geoanalytics     → geoanalytics.html
- Research         → research.html
- Publications     → publications.html
- Contacts         → contacts.html
- "Contact me" button (hero) → contacts.html

External links (footer; fill real URLs):
- Email        → mailto:kateroubin@gmail.com
- LinkedIn     → https://www.linkedin.com/in/katerybina/
- GitHub       → https://github.com/rybinakate
- Behance      → https://www.behance.net/kateroubin


Notes:
- Anchors (#about, #projects) require matching id="about" / id="projects"
  on index.html sections.
