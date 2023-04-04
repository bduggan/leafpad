## leafpad

# How it works

1. start a local web server
1. put a csv file into data/my-filename.csv
2. open a browser to http://localhost:3000/show/csv/my-filename
3. Columns whose names end in _geojson will be displayed as geojsons
4. Columns named "lat" or "lon" will be markers

That's it

# Installation and running

1. (optional) install a recent Perl and cpanm (using https://perlbrew.pl/ )

2. install Mojolicious and Text::CSV_XS
    cpanm Mojolicious
    cpanm Text::CSV_XS

3. start the web server
    morbo ./leafpad

