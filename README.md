## leafpad

Quickly convert CSV files or SQL result sets into geospatial visualizations.

Start with this:
```
name,box,box_style
nyc,"{""type"":""FeatureCollection"",""features"":[{""type"":""Feature"",""properties"":{},""geometry"":{""coordinates"":[[[-74.05,41.02],[-74.05,40.53],[-73.46,40.53],[-73.46,41.02],[-74.05,41.02]]],""type"":""Polygon""}}]}","{""color"":""cyan""}"
sf,"{""type"":""FeatureCollection"",""features"":[{""type"":""Feature"",""properties"":{},""geometry"":{""coordinates"":[[[-122.53,37.81],[-122.53,37.60],[-122.32,37.60],[-122.32,37.81],[-122.53,37.81]]],""type"":""Polygon""}}]}","{""color"":""hsl(147, 50%, 47%)""}"
```

Get this:

<img width="1450" alt="image" src="https://user-images.githubusercontent.com/58956/234868080-582fe1e7-0a19-4280-b74f-a1fcf09b8c2f.png">

## Tell me more!

- Columns that look like geojson are rendered as geojson
- Columns ending in _style are styles applied to that layer
- Specifically: the style should be valid JSON with attributes that can be found [here](https://leafletjs.com/reference.html#path-option)
- Click on the map to find the corresponding row in the CSV
- Click on a cell in the table to find it on the map
- Click on the box on the right hand side of a geojson cell to see the raw geojson
- Use the slider to animate selecting the rows one at a time
- Select "auto pan" to keep the map from moving while selecting

## Overview of usage:

1. Start a local web server
1. Put a csv file into the `data` directory (demo.csv is there by default)
2. Open a browser to http://localhost:3000 and click on "demo"
5. That's it!

## Running in mode analytics

To use the javascript in mode analytics, include the following in your HTML:

```
<div id="leafpad"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css" >
<link rel="stylesheet" href="https://bduggan.github.io/leafpad/public/style.css">
<script src="https://unpkg.com/leaflet@1.8.0/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-providers@1.13.0/leaflet-providers.js"></script>
<script src="https://bduggan.github.io/leafpad/public/leafpad.js"></script>
```

# Local installation

1. Clone this repo
    ```
    git clone https://git.sr.ht/~bduggan/leafpad
    ```

2. Install a recent Perl and cpanminus (`cpanm`)
   See https://perlbrew.pl/ or use a package manager for your distribution.

3. Install Mojolicious and Text::CSV_XS:
     ```
     cpanm Mojolicious
     cpanm Text::CSV_XS
     ```

4. Start the web server
     ```
     ./leafpad daemon
     ```

5. Enjoy!

