# Bundled map data

Made with Natural Earth. Its map data is public domain; [terms](https://www.naturalearthdata.com/about/terms-of-use/). No reference-repository map code, files or content was copied.

Sources read from Natural Earth's own vector-data repository:

- [110m land](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson), source blob `04811d72fff2701ec67587e30ad8942675b511e3`.
- [110m populated places](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_populated_places_simple.geojson), source blob `f89d94fbb541264c8ae5593b71a269dd3ca6ddbd`.
- [10m populated places](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson), source blob `4da9c6b27b5cd41d7c930ea9cd0c1f84548b65fb`.

`public/maps/land.json` contains simplified land-ring SVG paths projected onto a 1000 × 500 equirectangular plane: `x=(longitude+180)*1000/360`, `y=(90-latitude)*500/180`. Each source coordinate was rounded to two projected decimal places; no external tiles are fetched at runtime. The Australian view crops that same plane. This is a party-game map, not a navigation product.

`server/games/arcade-places.json` holds selected city/town labels, countries and coordinates from those datasets. World targets use 110m places; Australian targets use 10m places. Longitude/latitude use the source point for the populated place; distance scoring uses great-circle distance with a 6,371 km Earth radius. The server does not include a correct pin in room views until reveal.

To update, retrieve the same public source datasets by reviewed revision, regenerate the projected paths and selected targets, record the new source blobs here, and run the map/rules and production-smoke checks. Never substitute the reference repository's code or packs.
