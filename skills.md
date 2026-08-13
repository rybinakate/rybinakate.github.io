# skills.md — stack, coding standards & domain glossary

## Stack
- HTML5 semantic markup; CSS3 (custom properties, Flexbox, Grid, media queries);
  Vanilla JS (ES6+).
- Map libraries: ONLY those already used by the old geoanalytics page (kept as-is).
- Figma MCP for styles/components extraction. Git + GitHub Pages.

## CSS architecture
- Design tokens in :root (colors, font stacks, sizes, spacing, radii) 1:1 from Figma styles.
- BEM-like naming, lowercase-hyphenated (e.g. .hero__stats-item).
- Shared layout classes for header / footer / section containers reused on all pages.

## HTML/JS standards
- One <h1> per page; logical heading order; lang="en".
- Meta description per page; Open Graph tags for the main page.
- JS: no global namespace pollution (IIFE or modules), comments on non-obvious logic.

## Domain glossary — exact brand spelling (do not misspell!)
Esri • ArcGIS Pro • ArcGIS Online • ArcGIS Dashboards • ArcGIS StoryMaps •
QGIS • Global Mapper • JOSM • AutoCAD • Google Earth Engine • GeoServer •
MapLibre GL JS • PostgreSQL • PostGIS • GDAL • Geopandas • Shapely • Fiona •
Rasterio • Matplotlib • Figma • Photoshop • Lightroom • Canva • Premiere Pro •
Git • Docker

## Content style
- Headings and labels in English, wording per Figma / approved copy.
- Numbers formatted as approved: "25+", "60+", "9", "3,000+".