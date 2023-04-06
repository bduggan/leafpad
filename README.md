## leafpad

Leafpad is a simple way of viewing csv files that contain geojson columns.

<img width="1192" alt="image" src="https://user-images.githubusercontent.com/58956/230172170-6b18dbad-3505-4d82-9e12-df7f4a670a0a.png">

# How it works

1. Start a local web server
1. Put a csv file into the `data` directory (demo.csv is there by default)
2. Open a browser to http://localhost:3000/show/csv/demo (where "demo" is the base filename)
3. Columns whose names end in _geojson will be displayed as geojsons
4. Columns named "lat" or "lon" (or latitude or longitude) will be markers
5. That's it!

But wait, there's more!

* click on geojson columns in the csv to fly there on the map
* put multiple csv files into a directory, and view them all at once
* use the mouse to scroll/pan
* type "l" to generate a link with the current zoom and lat/lon
* okay, that's really it

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
     morbo ./leafpad
     ```

4. Open a browser at http://localhost:3000 and click on "demo" to go to http://localhost:3000/show/csv/demo

5. You are now viewing the "demo" file which is in the data/ directory.  It looks like this: https://git.sr.ht/~bduggan/leafpad/tree/master/item/data/demo.csv

6. New files placed along side it will automatically be viewable in the browser.

