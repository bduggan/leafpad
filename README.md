## leafpad

# How it works

1. start a local web server
1. put a csv file into the `data` directory
2. open a browser to http://localhost:3000/show/csv/my-filename
3. Columns whose names end in _geojson will be displayed as geojsons
4. Columns named "lat" or "lon" (or latitude or longitude) will be markers

# Installation and running

1. Install a recent Perl and cpanm (see https://perlbrew.pl/ or use a a package manager for your distribution )

2. Install Mojolicious and Text::CSV_XS:
     ```
     cpanm Mojolicious
     cpanm Text::CSV_XS
     ```

3. Start the web server
     ```
     morbo ./leafpad
     ```

4. Open a browser at http://localhost:3000 and click on "demo" to go to http://localhost:3000/show/csv/demo

![image](https://user-images.githubusercontent.com/58956/229796970-f79e5bbc-f180-4e5c-ad1d-0d1ff07822cc.png)
