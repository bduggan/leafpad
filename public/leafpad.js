
// globals
var highlight = {
    "fillColor": "#000000",
    "color": "#ff8c00",
    "weight" : 5,
    "opacity": 0.9
};

var geostyle = {
    "fillColor": "#ccfaa0",
    "fillOpacity" : 0.05,
    "color": "#552255",
    "weight": 1,
    "radius": 3,
    "opacity": 0.9
};

var markerstyle = {
  radius: 5,
  weight: 1,
  fillOpacity: 0.8,
  fillColor: "#aacc00",
  color: "#000000"
};
var all_layers = {}
var map;
var highlighted = null;

// functions
function generate_link() {
  let el = document.getElementById('current_link');
  let base = `${location.origin}${location.pathname}`
  let latlng = map.getCenter()
  let link = `${base}?lat=${latlng.lat}&lon=${latlng.lng}&zoom=${map.getZoom()}`
  el.innerHTML = `<a href=${link}>${link}</a>`
}

const is_geo_col = (name) => name.toLowerCase().endsWith('geojson')

function highlight_layer(l) {
  if (highlighted)  highlighted.resetStyle()
  highlighted = l
  l.setStyle(highlight)
}

function setup_map() {
  let q = new URLSearchParams(location.search)
  let params = Object.fromEntries(q.entries())
  let lat = params.lat || 37.09
  let lon = params.lon  || -96.70
  let zoom = params.zoom || 5
  map = L.map('map').setView([lat,lon], zoom );
  map.doubleClickZoom.disable();
  L.tileLayer.provider('CartoDB.Positron').addTo(map);
  L.control.scale().addTo(map);

  var geolayer;
  for (let dataset of datasets) {
    all_layers[dataset.queryName] = {}
    let row_number = 0
    for (let row of dataset.content) {
      all_layers[dataset.queryName][row_number] = {}
      for (let col_spec of dataset.columns) {
        let col = col_spec.name
        if (!is_geo_col(col)) continue;
        let geom = JSON.parse(row[col])
        let geolayer = L.geoJSON(geom,
               { style: geostyle, pointToLayer: function (f,latlng) { return L.circleMarker(latlng,geostyle) } })
        geolayer.on('mouseover', function() {
           highlight_layer(this);
           document.getElementById('details').innerHTML = make_details(row);
         })
         geolayer.on('mouseout', function() { this.resetStyle() })
         geolayer.on('click', function() {
           highlight_layer(this)
           let col = this.col_name;
           let query = this.query_name;
           let row_number = this.row_number;
           let id = `cell_${query}_${col}_${row_number}`
           show_tab(`${query}`)
           let cell = document.getElementById(id)
           cell.scrollIntoView({alignToTop: true})
           highlight_csv_cell(cell)
         })
         all_layers[dataset.queryName][row_number][col] = geolayer;
         geolayer.row_number = row_number
         geolayer.col_name = col
         geolayer.query_name= dataset.queryName
         geolayer.addTo(map);
       }
       row_number += 1
    }
  }
}

function make_details(j) {
 let out = '<table>'
 for (let k of Object.keys(j)) {
  if (is_geo_col(k)) {
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
  if (keyName === 'l')
    generate_link()
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
  map.flyToBounds(layer, { maxZoom: 17 })
  highlight_csv_cell(cell)
  highlight_layer(layer)
}

function show_tab(query_name) {
  let table_to_show = `table_${query_name}`
  let tab_to_show   = `tab_${query_name}`
  for (let c of document.querySelector('#csv_tables').children) {
    c.style.display = c.id == table_to_show ? '' : 'none'
  }
  for (let c of document.querySelector('#tabs').children) {
    c.style.backgroundColor = c.id == tab_to_show ? '#00bb00' : 'white'
    c.style.color           = c.id == tab_to_show ? 'white' : 'black'
  }
}

const tablistener = (e) => show_tab(e.target.dataset.query_name)

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
  main.appendChild(div({ id: 'details' }))
  let controls = main.appendChild( div( { class: 'controls' } ) )
  controls.appendChild( txt( {}, 'leafpad' ) )
  let pos = elt( 'div', {class: 'current_pos', title: 'lat,lon', alt: 'lat,lon'},
      elt('span',{id:'lat'}),
      ',',
      elt('span',{id:'lon'})
    )
  controls.appendChild(pos)
  main.appendChild( controls )
  let panels = main.appendChild(div({ class: 'panels' }))
  panels.appendChild(div({ id: 'map' }))
  return panels
}

const is_coord = (x) => x && x.length == 2 && typeof(x[0]) == 'number'

function describe_geodata(geo) {
  if (!geo) return "null"
  let j = JSON.parse(geo)
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

function setup_data(panels) {
  let csv_data = panels.appendChild(elt('div',{id: 'csv_data'}))
  let tabs = csv_data.appendChild(div({id:'tabs'}))
  console.log(`loading datasets: ${datasets.length}`)
  for (let d of datasets) {
    tabs.appendChild( txt({id: `tab_${d.queryName}`, "data-query_name" : `${d.queryName}`}, `${d.queryName}`) )
  }
  let tables = csv_data.appendChild( div( {id: 'csv_tables'} ) )
  for (let d of datasets) {
    if (d.oversized) {
      console.log(`skipping oversized dataset ${d.queryName}`)
      tables.appendChild( elt('div', { class: 'error' }, `sorry, "${d.queryName}" was too large to load` ) )
      continue;
    }
    let row_number = 0;
    let table = elt('table', { class: 'csv_data', id: `table_${d.queryName}` })
    tables.appendChild(table)
    table.appendChild(elt('caption', {},
      `${d.queryName} (${d.count} row${d.count == 1 ? '' : 's'})`,
      elt('a', { href: d.csv, target: '_blank', class: 'download' }, 'download csv')
    ))
    table.appendChild( elt('tr', {}, ...d.columns.map( c => elt('th', {}, c.name) ) ) )
    console.log(`rows in dataset ${d.queryName} : ${d.count}`)
    for ( let row of d.content ) {
      let tr = elt('tr',{})
      for (let col of d.columns) {
        let data_attrs = { "data-query_name" : d.queryName, "data-col_name" : col.name, "data-row_number" : row_number }
        let cell = div({class: 'csv_cell', ...data_attrs } )
        if (is_geo_col(col.name)) {
          cell.appendChild(
            elt( 'div', { class: 'geo_cell', ...data_attrs },
                describe_geodata(row[col.name]),
                elt( 'button', { class: 'geocopy', onclick: `{window.open().document.write(${ JSON.stringify(row[col.name]) });}`  }, '📋'),
               )
          )
        } else { 
          cell.appendChild( document.createTextNode( row[col.name] ) )
        }
        let new_id = `cell_${d.queryName}_${col.name}_${row_number}`
        console.log(`adding id ${new_id}`)
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
  console.log('setting up');
  let panels = setup_panels()
  setup_map()
  setup_data(panels)
  document.addEventListener('keydown', keylistener)
  document.getElementById('csv_data').addEventListener('click', csvlistener);
  document.getElementById('tabs').addEventListener('click', tablistener);
  map.addEventListener('mousemove', mouselistener)
}

main()
console.log('leafpad loaded.');
