# rules.md — hard constraints (follow on EVERY task)

## Content
1. Migrate ALL existing text verbatim. No rewriting, no "improvements" without explicit approval.
2. Site language: English only.
3. Approved copy (do not alter): hero line and the four stats
   ("25+ years in geodata", "60+ GIS solutions designed & deployed",
   "9 database patents", "3,000+ maps & analytical products") exactly as in Figma.

## Design
4. All colors / typography / components come from the Figma file via Figma MCP.
   Extract them as CSS custom properties; never hardcode new values.
5. ONE css file for the whole site: css/styles.css.
   No inline styles, no <style> blocks, no per-page css files.
6. Header/menu/footer are shared components — identical markup on every page.

## Code
7. Vanilla HTML/CSS/JS only. No frameworks, no bundlers (GitHub Pages static).
8. Relative paths for ALL links and assets. Lowercase file names.
9. THE GEOANALYTICS MAP IS FROZEN: keep its HTML container, JS initialization,
   library versions, CDN links and data sources exactly as in the old page.
   Only surrounding layout (header/footer/page typography) may change.
10. Never modify anything inside OLD_VERSION/.
11. Semantic HTML5; accessibility: alt on every img, aria on menu, sufficient contrast;
    responsive per Figma breakpoints.
12. Work page by page. After each page: open in browser, verify zero console errors,
    verify every image and link loads.
13. Git: commit after each finished page with a clear message
    (e.g. "migrate publications page to new design").
14. NO placeholder links (href="#") anywhere. Use PROJECT.md §8 Link map
    as the single source of truth for every href.
15. "Contact me" button → contacts.html on every page.
16. External links: full https:// URLs, target="_blank" rel="noopener noreferrer".
17. Email: mailto: scheme.
18. During per-page check (rule 12): click EVERY header and footer link and
    verify it opens the correct page/profile.