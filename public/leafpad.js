
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
        if (!col.toLowerCase().endsWith('geojson')) continue;
        let geom = JSON.parse(row[col])
        let geolayer = L.geoJSON(geom,
               { style: geostyle, pointToLayer: function (f,latlng) { return L.circleMarker(latlng,geostyle) } })
        geolayer.on('mouseover', function() {
           highlighted = this; this.setStyle(highlight);
           document.getElementById('details').innerHTML = make_details(row);
         })
         geolayer.on('mouseout', function() { this.resetStyle() })
         geolayer.on('click', function() { this.resetStyle(); this.bringToBack(); })
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
  if (k.match(/geojson$/)) {
    continue;
  }
  out += "<tr><td>" + k +  "</td><td>"
  if (j[k].length > 50) {
     out += j[k].substr(0,50) + '...'
     console.log(`${k} is`,j[k])
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
const csvlistener = (e) => {
  let cell = e.target
  let data = cell.dataset
  let query_name = data.query_name
  if (!query_name) {
    return
  }
  let layer = all_layers[query_name][data.row_number][data.col_name]
  if (!layer) {
    console.log(`row ${data.row_number}, col ${data.col_name} not found`)
    return
  }

  map.flyToBounds(layer, { maxZoom: 17 })

  if (last_cell)    last_cell.style.backgroundColor = 'white'
  if (highlighted)  highlighted.resetStyle()
  cell.style.backgroundColor = '#ddddff'
  last_cell                  = cell
  highlighted                = layer
  layer.setStyle(highlight)
}
const tablistener = (e) => {
  let table_to_show = `table_${e.target.id}`
  let tab_to_show   = e.target.id
  console.log(`hi: ${table_to_show}, ${tab_to_show}`);
  for (let c of document.querySelector('#csv_tables').children) {
    c.style.display = c.id == table_to_show ? 'block' : 'none'
  }
  for (let c of document.querySelector('#tabs').children) {
    c.style.backgroundColor = c.id == tab_to_show ? '#00bb00' : 'white'
    c.style.color           = c.id == tab_to_show ? 'white' : 'black'
  }
}

function elt(type, attrs, ...children) {
  let node = document.createElement(type);

  for (let k of Object.keys(attrs)) {
    node.setAttribute(k, attrs[k])
  }

  for (let child of children) {
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
    alert('no element with id="leafpad" was found, please add one')
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

function setup_data(panels) {
  let csv_data = panels.appendChild(elt('div',{id: 'csv_data'}))
  let tabs = csv_data.appendChild(div({id:'tabs'}))
  for (let d of datasets) {
    tabs.appendChild( txt({id: d.queryName}, `${d.queryName}`) )
  }
  let tables = csv_data.appendChild( div( {id: 'csv_tables'} ) )
  for (let d of datasets) {
    let row_number = 0;
    let table = elt('table', { class: 'csv_data', id: `table_${d.queryName}` })
    tables.appendChild(table)
    table.appendChild(elt('caption', {},`${d.queryName}`))
    table.appendChild( elt('tr', {}, ...d.columns.map( c => elt('th', {}, c.name) ) ) )
    for ( let row of d.content ) {
      let tr = elt('tr',{})
      for (let col of d.columns) {
        let cell = div({class: 'csv_cell', "data-query_name" : d.queryName, "data-col_name" : col.name, "data-row_number" : row_number})
        cell.appendChild( document.createTextNode( row[col.name] ) )
        tr.appendChild( elt('td', {} , cell ) )
      }
      table.appendChild(tr)
      row_number += 1;
    }
  }
}

console.log('leafpad loading');

// main()
window.onload = () => {
  console.log('setting up');
  let panels = setup_panels()
  setup_map()
  setup_data(panels)
  document.addEventListener('keydown', keylistener)
  document.getElementById('csv_data').addEventListener('click', csvlistener);
  document.getElementById('tabs').addEventListener('click', tablistener);
  map.addEventListener('mousemove', mouselistener)
}
