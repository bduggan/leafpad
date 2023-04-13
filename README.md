## leafpad

Leafpad is a simple way of viewing csv files that contain geojson columns.

<img width="1192" alt="image" src="https://user-images.githubusercontent.com/58956/230172170-6b18dbad-3505-4d82-9e12-df7f4a670a0a.png">

# How it works

1. Start a local web server
1. Put a csv file into the `data` directory (demo.csv is there by default)
2. Open a browser to http://localhost:3000/show/csv/demo (where "demo" is the base filename)
3. Columns whose names end in `geojson` will be displayed as geojsons
5. That's it!

But wait, there's more!

* click on geojson columns in the csv to fly there on the map
* put multiple csv files into a directory, and view them all at once
* use the mouse to scroll/pan
* okay, that's really it

# Running in mode analytics

To use just the javascript in mode analytics, include the following in the HTML

```
<div id="leafpad"></div>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css" >
<link rel="stylesheet" href="https://bduggan.github.io/leafpad/public/style.css">
<script src="https://unpkg.com/leaflet@1.8.0/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-providers@1.13.0/leaflet-providers.js"></script>
<script src="https://bduggan.github.io/leafpad/public/leafpad.js"></script>
```

Then any column in the resultset ending in `geojson` will be placed on the map.

# Installation and running

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

5. Open a browser at http://localhost:3000 and click on "demo" to go to http://localhost:3000/show/csv/demo

6. Enjoy!

