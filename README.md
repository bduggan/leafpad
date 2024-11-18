## leafpad

Quickly visualize and explore geographical data.

## Description

Put your tabular data on a map, and instantly see it in leafpad
or deck.gl.  Add styles, and update your data locally with your
programming language of choice, or use it is remotely with datasets
in gists, or mode analytics.

## How it works

1. Put your CSV files into a directory
2. Each CSV file will be a layer on the map
3. Geojson columns are rendered as well as lat/lon columns
4. Each column can have corresponding columns which define styles
5. Styles are used by leafpad or deck.gl.

### Details

1. Sample directory structure:

           leafpad-data
                   └── demo                     <-- "project"
                       └─── cities.csv          <-- layer

    By default leafpad will look in $HOME/leafpad-data.  This
    can be changed by setting the LEAFPAD_DATA environment
    variable.

2. Open a web browser to

   http://localhost:3000

3. Click `demo` to go to http://localhost:3000/show/csv/demo -- this corresponds to the directory `leafpad-data/demo`.

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

### How dataset columns are rendered in leaflet

- Columns that look like geojson are rendered as geojson
- Columns ending in _style or _pt_style are styles applied to the corresponding column
- Columns ending in '_icon' are used as text for the icon of a corresponding column
- Columns ending in '_icon_class' are used for the class.  [xkcd color names](https://xkcd.com/color/rgb/) are included with the stylesheet.
- Columns ending in _hlstyle are styles used when that layer is highlighted
- Valid style options are can be found [here](https://leafletjs.com/reference.html#path-option)

### How dataset columns are rendered in deck.gl

- Columns that look like geojson are rendered as geojson
- Columns that start with `props_` are used as properties for the deck.gl layer
- examples: `props_color`, `props_text_size`, `props_elevation`
- Prefix a style column with the name of the geojson column to apply it to that column
- examples: `building_props_color` will affect the color of a geojson column named `building`
- A CSV file named `gl_defaults` will set the defaults

### Interacting with the map

- Click on an element on the map to find the corresponding row in the datasets
- Click on a cell in the table to find it on the map
- Click on the box on the right hand side of a geojson cell in the table to see the raw geojson
- Use the slider to animate selecting the rows one at a time
- Unselect "auto pan" to keep the map from moving while selecting
- Select "highlight on hover" to show geojson elements by hovering the mouse instead of clicking
- Select "highlight row" to show all the geojson objects in a row, instead of just the selected column

### Animation

  - Animation in leafpad can be achieved by setting the _style associated with a column to 0.0, and setting the _hlstyle
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

Valid configuration settings for leafpad are:

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

#### Mode Analytics

Leafpad is compatible with [mode](https://mode.com/).

To use the javascript from within mode, include the following in your HTML:

```
<div id="leafpad"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css" >
<link rel="stylesheet" href="https://bduggan.github.io/leafpad/public/style.css">
<script src="https://unpkg.com/leaflet@1.8.0/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-providers@1.13.0/leaflet-providers.js"></script>
<script src="https://bduggan.github.io/leafpad/public/leafpad.js"></script>
```

#### Gists

Leafpad can run serverlessly by pulling content from a gist, and rendering it using static HTML, such as github pages.

Here is an example of a gist with data:

  https://gist.github.com/bduggan/f12bc788849cf465b9fe3ea63640ed37

This can be rendered by placing the url here:

  https://bduggan.github.io/leafpad/public/gist.html

like [this](https://bduggan.github.io/leafpad/public/gist.html?gist=https%3A%2F%2Fgist.github.com%2Fbduggan%2Ff12bc788849cf465b9fe3ea63640ed37).

