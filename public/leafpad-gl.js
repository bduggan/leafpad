const {DeckGL, GeoJsonLayer, WebMercatorViewport, PolygonLayer } = deck;

var lat2lon = { 'lat': 'lon', 'latitude' : 'longitude', 'LAT': 'LON', 'LATITUDE': 'LONGITUDE' }
const is_geo_col = (name) => name.toLowerCase().endsWith('geojson')
const is_lat_col = (name) => name.match(/_?lat(itude)?$/i) ? true : false
const looks_like_geo_data = (d) => typeof(d) == "string" && d.startsWith('{') && d.indexOf('"coordinates"') > 0 && d.indexOf('"type"') > 0
const lon_column = (name) => name.replace(/(_?)(lat(itude)?)$/i, (str,dash,lat,itude) => `${dash}${lat2lon[lat]}` )
const style_prefix = (name) => name.replace(/_?(lat(itude)?)$/i, '')

let all_dataset_props = { }

function try_parse(maybe_json) {
  if (!maybe_json) return null
  let parsed = null
  try {
    parsed = JSON.parse(maybe_json)
  } catch(err) {
    console.log(`could not parse json: ${err.message}`, maybe_json)
  }
  return parsed
}

function make_geojson() {
  let geojson = {
    "type": "FeatureCollection",
    "features": [ ]
  }

  for (let dataset of datasets) {
    if (dataset.queryName == 'gl_defaults') {
      for (let row of dataset.content) {
        for (let col of dataset.columns) {
          defaults[col.name.toLowerCase()] = row[col.name]
          console.log(`setting default ${col.name} to ${row[col.name]}`);
        }
      }
      continue;
    }
    let leafpad_row_number = 0;
    for (let row of dataset.content) {
       // console.log(`adding row ${JSON.stringify(row)}`);
       for (let col_spec of dataset.columns) {
         let col = col_spec.name

         if (!is_geo_col(col) && !is_lat_col(col) && !looks_like_geo_data(row[col])) continue;

         let new_feature = { }

         let ucol = col.toUpperCase()
         let lcol = col.toLowerCase()
         if (is_lat_col(col)) {
           ucol = style_prefix(col).toUpperCase()
           lcol = style_prefix(col).toLowerCase()
           let lon_data = row[lon_column(col)]
           col_data = { "type": "Point", "coordinates": [ Number(lon_data), Number(row[col]) ] }
           new_feature = {
             "type": "Feature",
             "properties": { },
             "geometry": col_data
           }
           // console.log(`adding col data: ${ JSON.stringify(col_data) }`);
         } else {
           let geom = null
           let col_data = row[col]
           try {
             geom = JSON.parse(col_data)
           } catch(e) {
             console.log("error parsing geojson", e, col_data)
             continue
           }
           if (geom.type == "Feature") {
             new_feature = geom
           } else if (geom.type == "FeatureCollection") {
             if (geom.features.length == 1) {
               new_feature = geom.features[0]
             } else {
               new_feature = geom.features[0]
               for (let f of geom.features.slice(1)) {
                 f.properties['row_number'] = leafpad_row_number;
                 f.properties['dataset'] = dataset.queryName
                 geojson.features.push(f)
               }
             }
           } else {
             new_feature = { "type": "Feature", "properties": { }, "geometry": geom }
           }
           // console.log(`adding col data: ${ JSON.stringify(col_data) }`);
         }

         new_feature.properties['row_number'] = leafpad_row_number;

         // find all properties that start with the column name
         let all_props = Object.keys(row).filter(k => k.startsWith( ucol + '_PROPS_'))
         for (let p of all_props) {
           let prop_name = p.replace(ucol + '_PROPS_', '')
           let lc_prop_name = prop_name.toLowerCase()
           new_feature.properties[lc_prop_name] = row[p]
         }

         // filter out geom columns
         // or anything that contains "_PROPS_"
         new_feature.properties['row_data'] = Object.fromEntries(
           Object.entries(row).filter(([k,v]) => !is_geo_col(k) && !is_lat_col(k) && !looks_like_geo_data(v) && !k.includes('_PROPS_'))
         )
         new_feature.properties['row_data_props'] = Object.fromEntries(
           Object.entries(row).filter(([k,v]) => is_geo_col(k) || is_lat_col(k) || looks_like_geo_data(v) || k.includes('_PROPS_'))
         )

         // console.log(`adding feature with properties ${JSON.stringify(new_feature.properties)}`);
         all_dataset_props[dataset.queryName] ||= { }

         all_dataset_props[dataset.queryName][leafpad_row_number] = new_feature.properties
         leafpad_row_number += 1;
         geojson.features.push(new_feature)
       }
    }
  }
  return geojson
}

let defaults = {
  point_type: 'circle+text+icon',
  extruded: true,
  filled: true,

  fill_color: '#8ACE0088', // rgba
  line_color: '#000000',
  line_width: 1,
  point_radius: 5,
  elevation: 100,
  text_size: 20,
  text_background_color: '#ffff14ff',
  text_border_color: '#000000',
  text_border_width: 1,
  icon: 'marker',
  icon_size: 30,
  icon_color: '#3f9b0bff'
}
let error_color = [10, 0, 0, 100]

const parse_color = (hex) => {
  if (!hex) return null
  let rgb = hex.match(/^#(..)(..)(..)$/)
  let rgba = hex.match(/^#(..)(..)(..)(..)$/)
  let val = null
  if (rgb) val = [ ...rgb.slice(1).map(x => parseInt(x, 16)), 100 ]
  if (rgba) val = rgba.slice(1).map(x => parseInt(x, 16))
  return val
}

function snake(getter) {
  let snake_case = getter.replace(/([A-Z])/g, (g) => `_${g.toLowerCase()}`)
  snake_case = snake_case.replace(/^get_/, '')
  return snake_case
}

function get_color_prop(attr) {
  let snake_case = snake(attr)
  return f => {
    const hex = f.properties[snake_case] || defaults[snake_case];
    return parse_color(hex) || error_color;
  }
}

function get_numeric_prop(attr) {
  let snake_case = snake(attr)
  return f => {
    let val = f.properties[snake_case]
    if (val) {
      return Number(val)
    }
    if (f.properties.row_number !== undefined && f.properties.dataset !== undefined) {
      let props = all_dataset_props[f.properties.dataset][f.properties.row_number]
      if (props[snake_case]) {
        return Number(props[snake_case])
      }
    }
    return defaults[snake_case]
  }
}

function get_string_prop(attr) {
  let snake_case = snake(attr)
  return f => {
    let val = f.properties[snake_case]
    if (val) return val
    return defaults[snake_case]
  }
}

function to_bool(val) {
  try {
    if (val && val.toLowerCase() == 'true') return true
    if (val && val.toLowerCase() == 'false') return false
  } catch {
    return val
  }
  return val
}

function make_layer(geojson) {
  const layer = new GeoJsonLayer({
    id: 'GeoJsonLayer',

    data: geojson,

    stroked: true,
    filled: to_bool(defaults.filled),
    pointType: defaults.point_type,
    pickable: true,
    wireframe: false,
    extruded: true, // to_bool(defaults.extruded), // nb: required for elevation but prevents line width from working
    textCharacterSet: 'auto',
    textSizeUnits: 'meters',
    textBackgroundPadding: [2, 2, 2, 2],
    textFontSettings: { sdf: true },
    textBackground: true,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.json',

    getFillColor: get_color_prop('getFillColor'),
    getLineColor: get_color_prop('getLineColor'),

    getElevation: get_numeric_prop('getElevation'),
    // getElevation: (p) => { return 1000000 },
    getLineWidth: get_numeric_prop('getLineWidth'),
    getPointRadius: get_numeric_prop('getPointRadius'),
    getTextSize: get_numeric_prop('getTextSize'),

    getText: get_string_prop('getText'),
    getTextBackgroundColor: get_color_prop('getTextBackgroundColor'),
    getTextBorderColor: get_color_prop('getTextBorderColor'),
    getTextBorderWidth: get_numeric_prop('getTextBorderWidth'),
    getIcon: get_string_prop('getIcon'),
    getIconSize: get_numeric_prop('getIconSize'),
    getIconColor: get_color_prop('getIconColor'),

    onClick: (info, event) => {
      console.log('Clicked:', info.object.properties.row_data );
      document.getElementById('row_info').innerText = JSON.stringify(info.object.properties.row_data, null, 2)
      document.getElementById('row_info_props').innerText = JSON.stringify(info.object.properties.row_data_props, null, 2)
    }
  });
  return layer
}

function initial_view_state(geojson) {
  // option 1 check incoming params
  {
    let q = new URLSearchParams(location.search)
    let params = Object.fromEntries(q.entries())

    let latitude = null
    let longitude = null
    let zoom = null

    if (params.lon) longitude = Number(params.lon)
    if (params.lat) latitude = Number(params.lat)
    if (params.zoom) {
      zoom = Number(params.zoom)
      if (zoom > 20) zoom = 20
    }
    if (longitude && latitude && zoom) {
      return {
        longitude: longitude,
        latitude: latitude,
        zoom: zoom
      }
    }
  }

  // option 2 calculate bounds
  {
    let minLng,minLat,maxLng,maxLat = null;
    try { [ minLng,minLat,maxLng,maxLat ] = turf.bbox(geojson) } catch(err) {
      console.log(`could not calculate bbox: ${err.message}`, geojson)
      alert('error parsing geojson (check the console)')
      return
    }
    const bounds = [[minLng, minLat], [maxLng, maxLat]];
    const viewportOptions = {
        width: window.innerWidth,   // Width of the viewport
        height: window.innerHeight, // Height of the viewport
        bounds,
        padding: 20
    };

    let {longitude, latitude, zoom} = new WebMercatorViewport(viewportOptions).fitBounds(bounds, viewportOptions);
    console.log(`initial view state: ${JSON.stringify({longitude, latitude, zoom})}`);
    return {
      longitude: longitude,
      latitude: latitude,
      zoom: zoom
    }
  }
}

function load_deck(layer, geojson) {
  new DeckGL({
    // options:
    // https://deck.gl/docs/api-reference/carto/basemap
    mapStyle: // 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
              'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
              // 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
              // 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    initialViewState: initial_view_state(geojson),
    container: document.getElementById('deckwrapper'),
    controller: true,
    layers: [ layer ]
  });
}

async function main() {
  let geojson = make_geojson()
  let layer = make_layer(geojson)
  load_deck(layer, geojson)
}

main().then(() => { console.log('leafpad loaded.'); })
