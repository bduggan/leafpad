
if (typeof(leafpad_config) == 'undefined') {
  console.log('no configuration found, using defaults')
  let stored = window.localStorage.getItem('leafpad_config')
  if (stored) {
    console.log('found stored config', stored)
    try {
      leafpad_config = JSON.parse(stored)
    } catch {
      console.log('could not parse config')
    }
  }
} else {
  console.log('found configuration', leafpad_config)
}

let default_config = {
  tile_provider: 'CartoDB.Positron',
  initial_zoom: 5,
  max_zoom: 16,
  initial_lat: 37.09,
  initial_lon: -96.70,
  hide_style_columns: true,
  geostyle: {
      "fillColor": "#ccfaa0",
      "fillOpacity" : 0.05,
      "color": "#552255",
      "weight": 1,
      "radius": 3,
      "opacity": 0.9
  },
  hl_style:  {
    "fillColor": "#000000",
    "color": "#ff8c00",
    "weight" : 5,
    "opacity": 0.9,
  }
}

function config(key) {
  if (typeof(leafpad_config) == 'undefined') return default_config[key]
  if (key in leafpad_config) return leafpad_config[key]
  return default_config[key]
}

var all_layers = {}
var map;
var highlighted_layers = [];
var timeline_dataset = null;
var timeline_time_column = null;
var timeline_geojson_column = null;
var pan_ok = true;
var hl_row = false;
var hl_hover = false;
var dt_show = true;

// functions
function generate_link() {
  let el = document.getElementById('current_link');
  let base = `${location.origin}${location.pathname}`
  let latlng = map.getCenter()
  let q = new URLSearchParams(location.search)
  let params = Object.fromEntries(q.entries())
  let link = `${base}?lat=${latlng.lat}&lon=${latlng.lng}&zoom=${map.getZoom()}`
  el.innerHTML = `<a href=${link}>${link}</a>`
}

const is_geo_col = (name) => name.toLowerCase().endsWith('geojson')
const is_style_col = (name) => name.toLowerCase().endsWith('_style') || name.toLowerCase().endsWith('_hlstyle')
const looks_like_geo_data = (d) => typeof(d) == "string" && d.startsWith('{') && d.indexOf('"coordinates"') > 0 && d.indexOf('"type"') > 0

function highlight_layers(layers) {
  if (highlighted_layers) highlighted_layers.map( l => l.resetStyle() )
  highlighted_layers = layers
  layers.map( l => l.setStyle(l.hl_style) )
  layers.map( l => l.bringToFront() )
}

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

function setup_map() {
  let q = new URLSearchParams(location.search)
  let params = Object.fromEntries(q.entries())
  let lat = params.lat || config('initial_lat')
  let lon = params.lon  || config('initial_lon')
  let zoom = params.zoom || config('initial_zoom')
  map = L.map('map').setView([lat,lon], zoom );
  map.doubleClickZoom.disable();
  let provider = config('tile_provider')
  L.tileLayer.provider(provider).addTo(map);
  L.control.scale().addTo(map);

  var geolayer;
  for (let dataset of datasets) {
    all_layers[dataset.queryName] = {}
    let row_number = 0
    for (let row of dataset.content) {
      all_layers[dataset.queryName][row_number] = {}
      for (let col_spec of dataset.columns) {
        let col = col_spec.name
        if (!is_geo_col(col) && !looks_like_geo_data(row[col])) continue;
        let geom = null
        try {
          geom = JSON.parse(row[col])
        } catch(e) {
          console.log("error parsing geojson", e)
          continue
        }
        let layer_style = try_parse( row[`${col}_STYLE`] || row[`${col}_style`] ) || config('geostyle')
        let hl_style = try_parse( row[`${col}_HLSTYLE`] || row[`${col}_hlstyle`] ) || config('hl_style')

        let geolayer = L.geoJSON(geom,
               { style: layer_style, pointToLayer: function (f,latlng) { return L.circleMarker(latlng,layer_style) } })
        geolayer.on('mouseover', function() {
           if (hl_hover) {
             highlight_layers([ this ]);
             document.getElementById('details').innerHTML = make_details(row);
           }
         })
         geolayer.on('mouseout', function() { if (hl_hover) this.resetStyle() })
         geolayer.on('click', function() {
           highlight_layers([ this ])
           let col = this.col_name;
           let query = this.query_name;
           let row_number = this.row_number;
           let id = `cell_${query}_${col}_${row_number}`
           show_tab(`${query}`)
           let cell = document.getElementById(id)
           cell.scrollIntoView({alignToTop: true})
           highlight_csv_cell(cell)
           let ds = datasets.filter( (l) => l.queryName == query )[0]
           let row = ds.content[row_number]
           document.getElementById('details').innerHTML = make_details(row);
         })
         all_layers[dataset.queryName][row_number][col] = geolayer;
         geolayer.row_number = row_number
         geolayer.col_name = col
         geolayer.query_name= dataset.queryName
         geolayer.hl_style = structuredClone( hl_style )
         geolayer.addTo(map);
       }
       row_number += 1
    }
  }
}

function make_details(j) {
 if (!dt_show) return ''
  
 let out = '<table>'
 for (let k of Object.keys(j)) {
  if (is_geo_col(k) || looks_like_geo_data(j[k])) {
    continue;
  }
  if (is_style_col(k)) {
    continue;
  }
  out += "<tr><td>" + k +  "</td><td>"
  if (j[k].length > 50) {
     out += j[k].substr(0,50) + '...'
  } else {
     out += j[k]
  }
  out += "</td></tr>"
 }
 out += "</table>"
 return out
}

// events
const mouselistener = (event) => {
  document.getElementById('lat').innerHTML = Math.round(event.latlng.lat * 10000000) / 10000000;
  document.getElementById('lon').innerHTML = Math.round(event.latlng.lng * 10000000) / 10000000;
}
const keylistener = (event) => {
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey)
    return
  const keyName = event.key;
  if (keyName === 'l') generate_link()
  if (keyName === 'b') {
    if (highlighted_layers) highlighted_layers.map( (l) => l.bringToBack() )
  }
}

let last_cell = null
function highlight_csv_cell(cell) {
  if (last_cell)    last_cell.style.backgroundColor = 'white'
  let td = cell.closest("td")
  td.style.backgroundColor = '#ddddff'
  last_cell                = td
}
const csvlistener = (e) => {
  let cell = e.target
  let data = cell.dataset
  let query_name = data.query_name
  if (!query_name) return;
  if (!all_layers[query_name][data.row_number]) return // clicked on a tab
  let layer = all_layers[query_name][data.row_number][data.col_name]
  if (!layer) {
    return
  }
  if (pan_ok) map.flyToBounds(layer, { maxZoom: config('max_zoom') })
  highlight_csv_cell(cell)
  if (hl_row) {
    highlight_layers(Object.values( all_layers[query_name][data.row_number] ))
  } else {
    highlight_layers([ layer ])
  }
  if (layer.query_name != timeline_dataset.queryName) {
    console.log('not in right layer')
    let nxt = datasets.filter( (l) => l.queryName == query_name )[0]
    if (nxt) {
      console.log(`switching to ${query_name}`)
    } else {
      console.log(`cannot find ${query_name}`)
    }
    timeline_dataset = nxt
  }
  set_slider(data.row_number)
  timeline_geojson_column = data.col_name
  console.log(`using ${timeline_geojson_column}`)
}

function set_slider(n) {
  let slider = document.getElementById('timeline')
  update_details( timeline_dataset.content[n] )
  slider.value = n
}

function show_tab(query_name) {
  let table_to_show = `table_${query_name}`
  let tab_to_show   = `tab_${query_name}`
  if (timeline_dataset.queryName != query_name) {
    let nxt = datasets.filter( (l) => l.queryName == query_name )[0]
    set_slider_dataset(nxt)
  }
  for (let c of document.querySelector('#csv_tables').children) {
    c.style.display = c.id == table_to_show ? '' : 'none'
  }
  for (let c of document.querySelector('#tabs').children) {
    c.style.backgroundColor = c.id == tab_to_show ? '#00bb00' : 'white'
    c.style.color           = c.id == tab_to_show ? 'white' : 'black'
  }
}
const tablistener = (e) => show_tab(e.target.dataset.query_name)

let running = null;
function handle_autoplay() {
  let btn = document.getElementById('autoplay')
  if (running) {
    window.clearInterval(running);
    btn.innerHTML = '⯈'
    running = null
    return;
  }
  let tl = document.getElementById('timeline')
  btn.innerHTML = '⏹'
  running = window.setInterval( () => {
    tl.stepUp(1);
    if (tl.value >= tl.max - 1) {
      window.clearInterval(running);
      btn.innerHTML = '⯈'
      return;
    }
    slider_changed_to( tl.value )
  }, 1000 );
}

function handle_slider(e) {
  if (!timeline_dataset) return
  slider_changed_to(  e.target.value )
}

function update_details(row) {
  document.getElementById('details').innerHTML = make_details(row);
}

function slider_changed_to(n) {
  if (!timeline_time_column) {
    let col_names = timeline_dataset.columns.map( (c) => c.name )
    let sample_row = timeline_dataset.content[0]
    timeline_time_column = col_names.filter( (c) => `${sample_row[c]}`.match(/^(\d{2,4}-\d{2}-\d{2}|\d{1,2}:\d{2})/))[0]
    timeline_time_column ||= timeline_dataset.columns[0].name // fallback to displaying the first column
    console.log(`timeline column: ${timeline_time_column}`)
  }
  if (!timeline_geojson_column) {
    let col_names = timeline_dataset.columns.map( (c) => c.name )
    let sample_row = timeline_dataset.content[0]
    timeline_geojson_column = col_names.filter( (c) => is_geo_col(c) || looks_like_geo_data(sample_row[c]) )[0]
    if (!timeline_geojson_column) {
      console.log('error finding geojson column: is the first row missing data?')
      return
    }
    console.log(`timeline geojson column: ${timeline_geojson_column}`)
  }
  let v = timeline_dataset.content[n][timeline_time_column]
  document.getElementById('current_time').innerHTML = `${timeline_time_column.toLowerCase()}: ${v}`
  let query = timeline_dataset.queryName
  let col = timeline_geojson_column
  let row_number = n
  let layer = all_layers[timeline_dataset.queryName][n][timeline_geojson_column]
  if (!layer) {
    console.log(`cannot find layer for ${timeline_dataset.queryName}`)
    return
  }
  let id = `cell_${query}_${col}_${row_number}`
  update_details( timeline_dataset.content[n] )
  if (hl_row) {
    highlight_layers(Object.values( all_layers[timeline_dataset.queryName][n] ))
  } else {
    highlight_layers([ layer ])
  }
  let cell = document.getElementById(id)
  cell.scrollIntoView({alignToTop: true})
  highlight_csv_cell(cell)
  if (pan_ok) map.panInsideBounds(layer.getBounds())
  let geodata = timeline_dataset.content[n][timeline_geojson_column]
  if (pan_ok && geodata.indexOf('"Point"') == -1) {
    map.fitBounds(layer.getBounds(), { maxZoom: config('max_zoom') })
  }
}

function elt(type, attrs, ...children) {
  let node = document.createElement(type);

  for (let k of Object.keys(attrs)) {
    node.setAttribute(k, attrs[k])
  }

  for (let child of children) {
    if (!child) continue;
    if (typeof child != "string") node.appendChild(child);
    else node.appendChild(document.createTextNode(child));
  }

  return node;
}
function div(attrs) {
  return elt('div', attrs)
}
function txt(attrs, inner) {
  return elt('div', attrs, inner)
}
function setup_panels() {
  let main = document.getElementById('leafpad')
  if (!main) {
    console.log('no element with id="leafpad" was found, please add one')
    return
  }
  let header = main.appendChild( div( { class: 'header' } ) )
  header.appendChild( txt( {}, 'leafpad' ) )
  header.appendChild( txt( { id: 'current_link' }, '' ) )
  let pos = elt( 'div', {class: 'current_pos', title: 'lat,lon', alt: 'lat,lon'},
      elt('span',{id:'lat'}),
      ',',
      elt('span',{id:'lon'})
    )
  let ts = div({class: 'current_time', id: 'current_time'})
  header.appendChild(ts)
  header.appendChild(pos)
  main.appendChild( header )
  let panels = main.appendChild(div({ class: 'panels' }))
  let mapdiv = panels.appendChild(div({ id: 'map' }))
  let controls = panels.appendChild(div({ class: 'controls' }))
  let sliderdiv = controls.appendChild(elt( 'div', { class: 'sliderdiv' } ) )
  let autoplay = sliderdiv.appendChild(elt(
    'button', { class: 'autoplay', id: 'autoplay' }, '⯈'
  ))
  autoplay.addEventListener('click', handle_autoplay )
  let slider = sliderdiv.appendChild(elt(
    'input', {type: "range", min: "0", max:"99", value:"0", class:"slider", id: "timeline"}
  ))
  slider.addEventListener('input',handle_slider)
  mapdiv.appendChild(div({ id: 'details' }))

  let pan = elt('input', {type: "checkbox", name: "auto-pan", checked: true})
  controls.appendChild(pan)
  controls.appendChild(elt('label',{for: 'auto-pan'}, 'auto pan'))
  pan.addEventListener('click',() => { pan_ok = !pan_ok } )

  let hl_row_box = elt('input', {type: "checkbox", name: "hl-row" })
  controls.appendChild(hl_row_box)
  controls.appendChild(elt('label',{for: 'hl-row'}, 'highlight row'))
  hl_row_box.addEventListener('click',() => { hl_row = !hl_row } )

  let hl_hover_box = elt('input', {type: "checkbox", name: "hl-hover" })
  controls.appendChild(hl_hover_box)
  controls.appendChild(elt('label',{for: 'hl-hover'}, 'highlight on hover'))
  hl_hover_box.addEventListener('click',() => { hl_hover = !hl_hover } )

  let show_details_box = elt('input', {type: "checkbox", name: "dt-show", checked: true })
  controls.appendChild(show_details_box)
  controls.appendChild(elt('label',{for: 'hl-hover'}, 'show details'))
  show_details_box.addEventListener('click',() => { dt_show = !dt_show } )

  return panels
}

const is_coord = (x) => x && x.length == 2 && typeof(x[0]) == 'number'

function describe_geodata(geo) {
  if (!geo) return "null"
  let j = null
  try {
    j = JSON.parse(geo)
  } catch {
    return "error parsing geojson"
  }
  if (!j) return "null"
  let geom = j
  if (j.features && j.features.length == 1 && j.features[0].geometry) {
    geom = j.features[0].geometry
  }
  if (j.feature && j.feature.geometry) {
    geom = j.feature.geometry
  }
  if (geom.type && geom.type == "Feature" && geom.geometry){
    geom = geom.geometry
  }
  let desc = `${geom.type}`
  if (geom) {
    let c = geom.coordinates
    if (is_coord(c)) {
      desc += `(${c})`
    } else if (c && is_coord(c[0])) {
      desc += `, ${c.length} coordinates`
    } else if (c && c[0] && is_coord(c[0][0])) {
      desc += `, ${c[0].length} coordinates`
    } else if (c && c[0] && c[0][0] ** is_coord(c[0][0])) { // multipolygon
      desc += `, ${c[0][0].length} coordinates`
    }
  } else {
    desc += `${j.type}`
  }
  return desc
}

function set_slider_dataset(d) {
  document.getElementById('timeline').max = d.count - 1
  timeline_dataset = d
}

function setup_data(panels) {
  let csv_data = panels.appendChild(elt('div',{id: 'csv_data'}))
  let tabs = csv_data.appendChild(div({id:'tabs'}))
  console.log(`loading datasets: ${datasets.length}`)
  for (let d of datasets) {
    tabs.appendChild( txt({id: `tab_${d.queryName}`, "data-query_name" : `${d.queryName}`}, `${d.queryName}`) )
  }
  let tables = csv_data.appendChild( div( {id: 'csv_tables'} ) )
  let added_slider = false
  for (let d of datasets) {
    if (d.oversized) {
      console.log(`skipping oversized dataset ${d.queryName}`)
      tables.appendChild( elt('div', { class: 'error' }, `sorry, "${d.queryName}" was too large to load` ) )
      continue;
    }
    if (!added_slider && d.content && d.content[0]) {
      set_slider_dataset(d)
      added_slider = true
    }
    let row_number = 0;
    let table = elt('table', { class: 'csv_data', id: `table_${d.queryName}` })
    tables.appendChild(table)
    table.appendChild(elt('caption', {},
      `${d.queryName} (${d.count} row${d.count == 1 ? '' : 's'})`,
      elt('a', { href: d.csv, target: '_blank', class: 'download' }, 'download csv')
    ))
    if (config('hide_style_columns')) {
      table.appendChild( elt('tr', {}, ...d.columns
        .filter( c => !is_style_col(c.name) )
        .map( c => elt('th', { alt: c.name, title: c.name }, c.name) ) ) )
    } else {
      table.appendChild( elt('tr', {}, ...d.columns.map( c => elt('th', { alt: c.name, title: c.name }, c.name) ) ) )
    }
    console.log(`rows in dataset ${d.queryName} : ${d.count}`)
    for ( let row of d.content ) {
      let tr = elt('tr',{})
      for (let col of d.columns) {
        let data_attrs = { "data-query_name" : d.queryName, "data-col_name" : col.name, "data-row_number" : row_number }
        let cell = div({class: 'csv_cell', ...data_attrs } )
        if (is_geo_col(col.name) || looks_like_geo_data(row[col.name])) {
          cell.appendChild(
            elt( 'div', { class: 'geo_cell', ...data_attrs },
                describe_geodata(row[col.name]),
                elt( 'button', { class: 'geocopy', onclick: `{window.open().document.write(${ JSON.stringify(row[col.name]) });}`  }, '📋'),
               )
          )
        } else if (is_style_col(col.name)) {
          if (config('hide_style_columns')) continue;
          cell.appendChild(
            elt( 'div', { class: 'geo_cell', ...data_attrs },
                elt( 'i', {}, 'style' ),
                elt( 'button', { onclick: `{window.open().document.write(${ JSON.stringify(row[col.name]) });}`  }, '📋'),
               )
          )
        } else { 
          cell.appendChild( document.createTextNode( row[col.name] ) )
        }
        let new_id = `cell_${d.queryName}_${col.name}_${row_number}`
        tr.appendChild( elt('td', { class: 'csv_td', id: new_id } , cell ) )
      }
      table.appendChild(tr)
      row_number += 1;
    }
  }
}

console.log('leafpad loading.');

var loaded = false;

function main() {
  if (loaded) {
    console.log('data already loaded');
    return;
  }
  loaded = true;
  let panels = setup_panels()
  setup_map()
  setup_data(panels)
  document.addEventListener('keydown', keylistener)
  document.getElementById('csv_data').addEventListener('click', csvlistener)
  document.getElementById('tabs').addEventListener('click', tablistener)
  map.addEventListener('mousemove', mouselistener)
}

main()
console.log('leafpad loaded.');
