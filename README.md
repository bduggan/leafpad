## leafpad

A geospatial exploration platform

## Description

Leafpad is a framework for geographical data visualization and exploration.

It uses the excellent [leaflet](https://leafletjs.com/) library.

## How it works

### Viewing data

1. Put files into a directory:

           leafpad-data
                   └── demo                     <-- project
                       └─── cities.csv          <-- dataset

    By default leafpad will look in $HOME/leafpad-data.  This
    can be changed by setting the LEAFPAD_DATA environment
    variable.

2. Open a web browser to

   http://localhost:3000

3. Click `demo` to go to http://localhost:3000/show/csv/demo

4. Click on a column to visit it on the map

<img width="1191" alt="screenshot" src="https://github.com/bduggan/leafpad/assets/58956/d674c91f-7db9-41df-95d7-c081881ed71a">

### Updating data

A button labeled "update cities" will appear on the web page.  This
will be enabled if it finds any of the following executable files:

    1. leafpad-data/demo/cities
    2. leafpad-data/demo/leafpad-update
    3. leafpad-update # (somehere in $PATH)

Clicking "update cities" will execute this file, with one
JSON argument which has the state of the map (bounds and
selected lat/lon), and the project ('demo') and the
dataset ('cities').

### Configuration

If the file leafpad-data/demo/config.js is found, it will be used to configure the
view of this dataset.  See below for options.

## Installation

Install `cpanminus` with `curl -L https://cpanmin.us | bash`

Then download leafpad and install the dependencies:

    $ git clone https://github.com/bduggan/leafpad
    $ cd leafpad
    $ cpanm --installdeps .

Now you're ready!

## Running

The directory `leafpad-data/demo` is a project with a few datasets.
Start the webserver with

     ./leafpad daemon

and go to http://localhost:3000 and click on "demo"

## Documentation

### How dataset columns are rendered

- Columns that look like geojson are rendered as geojson
- Columns ending in _style or _pt_style are styles applied to the corresponding column
- Columns ending in '_icon' are used as text for the icon of a corresponding column
- Columns ending in '_icon_class' are used for the class.  [xkcd color names](https://xkcd.com/color/rgb/) are included with the stylesheet.
- Columns ending in _hlstyle are styles used when that layer is highlighted
- Valid style options are can be found [here](https://leafletjs.com/reference.html#path-option)

### Interacting with the map

- Click on an element on the map to find the corresponding row in the datasets
- Click on a cell in the table to find it on the map
- Click on the box on the right hand side of a geojson cell in the table to see the raw geojson
- Use the slider to animate selecting the rows one at a time
- Unselect "auto pan" to keep the map from moving while selecting
- Select "highlight on hover" to show geojson elements by hovering the mouse instead of clicking
- Select "highlight row" to show all the geojson objects in a row, instead of just the selected column

### Animation

  - Animation can be achieved by setting the _style associated with a column to 0.0, and setting the _hlstyle
     associated with a column to something non-zero.  Then when scrolling through the rows of a dataset, only
     the currently highlighted row will be visible.

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

Valid configuration settings are:

- tile_provider -- default is "CartoDB.Positron" (see this [list](https://leaflet-extras.github.io/leaflet-providers/preview/))
- initial_zoom, initial_lat, initial_lon
- max_zoom -- maximum zoom value
- geostyle -- default style for geojson shapes
- pt_style -- default style for points
- hl_style -- default highlight style
- hide_style_columns -- hide columns named _style and _hlstyle in the rows?
- column_links -- a mapping from column names to functions that generate an href

See [leafpad.js](public/leafpad.js) for examples.

### Compatibility

Leafpad is compatible with _mode analytics_.

To use the javascript in mode analytics, include the following in your HTML:

```
<div id="leafpad"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css" >
<link rel="stylesheet" href="https://bduggan.github.io/leafpad/public/style.css">
<script src="https://unpkg.com/leaflet@1.8.0/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-providers@1.13.0/leaflet-providers.js"></script>
<script src="https://bduggan.github.io/leafpad/public/leafpad.js"></script>
```

