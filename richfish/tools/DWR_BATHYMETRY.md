# RICHFISH DWR bathymetry import

The uploaded California DWR CKAN package metadata supplies the **direct ZIP download URL** for `dem_bay_delta_10m_20250312.zip`. The dataset metadata states **no restrictions on public use**.

## Build process

Run GitHub Actions → **RICHFISH DWR Bathymetry Build** → **Run workflow**. It downloads the official GeoTIFF, crops the Richmond waterfront, produces NAVD88-elevation color relief, and publishes a temporary **workflow artifact**, not to the website.

Inspect the output tiles, extent, nodata transparency, vertical datum, file count and visual alignment before connecting to FRmap. The artifact expires after seven days; output is not committed automatically. Do not mix NAVD88 elevations with ENC charted depths referenced to another vertical datum. No pointwise fishing prediction should be derived solely from the map colors.

DWR is the data provider, and elevations west of Carquinez Strait are primarily inherited from earlier USGS-derived data, despite the v4.3 package date. More recent local hydrographic surveys should take precedence if available.

Source: https://publish.data.ca.gov/dataset/san-francisco-bay-and-sacramento-san-joaquin-delta-dem-for-modeling-version-4-3

This is a *build candidate*, not a statement that the tiles have successfully rendered.
