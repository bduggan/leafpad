## leafpad

Quickly convert CSV files or SQL result sets into geospatial visualizations.

### What does it do?

You start with this:
```
name,box,box_style
nyc,40.730610,-73.935242,"{""type"":""Feature"",""properties"":{},""geometry"":{""coordinates"":[[[-74.05944756456219,41.027671563014025],[-74.05944756456219,40.535214985745114],[-73.4687494975488,40.535214985745114],[-73.4687494975488,41.027671563014025],[-74.05944756456219,41.027671563014025]]],""type"":""Polygon""}}","{""color"":""cyan""}"
sf,37.773972,-122.431297,"{""type"":""Feature"",""properties"":{},""geometry"":{""coordinates"":[[[-122.53788826361247,37.8117481985156],[-122.53788826361247,37.60331129137758],[-122.32809344202103,37.60331129137758],[-122.32809344202103,37.8117481985156],[-122.53788826361247,37.8117481985156]]],""type"":""Polygon""}}","{""color"":""hsl(147, 50%, 47%)""}"
```

And get this:

<img width="1450" alt="image" src="https://user-images.githubusercontent.com/58956/234868080-582fe1e7-0a19-4280-b74f-a1fcf09b8c2f.png">

### Okay, tell me more

- Columns that look like geojson are rendered as geojson
- Columns ending in _style are styles applied to that layer
- Columns ending in _hlstyle are styles used when that layer is highlighted
- Specifically: the style should be valid JSON with attributes that can be found [here](https://leafletjs.com/reference.html#path-option)
- Click on the map to find the corresponding row in the CSV
- Click on a cell in the table to find it on the map
- Click on the box on the right hand side of a geojson cell to see the raw geojson
- Use the slider to animate selecting the rows one at a time
- Unselect "auto pan" to keep the map from moving while selecting
- Select "highlight on hover" to show geojson elements by hovering the mouse
- Select "highlight row" to show all the geojson objects in a row, instead of just the selected column
- Put several CSV files in the same directory to load them all
- Add a file named "config.js" in that directory to have it included in the page

### Configuration

- If a javacript variable named "leafpad_config" is found, it will be used for configuration.
- Any file named "config.js" in the same directory as a set of CSV files will be included in the javascript.
- In other words, a sample config.js should look like this:
  ```
  leafpad_config = {
    tile_provider: 'CartoDB.Positron',
    initial_zoom: 12,
    max_zoom: 16,
    ...etc
  }
  ```
- Alternatively `leafpad_config` can be set in localStorage, like so:

  ```
  localStorage.setItem('leafpad_config', JSON.stringify({tile_provider: 'USGS.USTopo'}))
  ```

Valid configuration settings are:

- tile_provider -- default is "CartoDB.Positron" (see this [list](https://leaflet-extras.github.io/leaflet-providers/preview/))
- initial_zoom, initial_lat, initial_lon
- max_zoom -- maximum zoom value
- geostyle -- default style for geojson shapes
- hl_style -- default highlight style
- hide_style_columns -- hide columns named _style and _hlstyle in the rows?
- column_links -- a mapping from column names to functions that generate an href

See [leafpad.js](public/leafpad.js) for examples.

###  How do I use it locally?

1. Start a local web server
1. Put a csv file into the `data` directory (demo.csv is there by default)
2. Open a browser to http://localhost:3000 and click on "demo"
5. That's it!

### How do I run it in mode analytics?

To use the javascript in mode analytics, include the following in your HTML:

```
<div id="leafpad"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css" >
<link rel="stylesheet" href="https://bduggan.github.io/leafpad/public/style.css">
<script src="https://unpkg.com/leaflet@1.8.0/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-providers@1.13.0/leaflet-providers.js"></script>
<script src="https://bduggan.github.io/leafpad/public/leafpad.js"></script>
```

### How do I install it?

1. Clone this repo
    ```
    git clone https://github.com/bduggan/leafpad
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

