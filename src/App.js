import React, { Component } from 'react';
import { Map, GeoJSON } from 'react-leaflet'
import geojsonBounds from 'geojson-bounds'

import geo from './data/cesko'
import districts from './data/okrskyMapping.json'
import rawResults from './data/vysledky'

import Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css';

Leaflet.Icon.Default.imagePath =
  '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.2.0/images/'

const transformResults = (rawResults) => {
  return rawResults.data.map((row) => {
    const obj = {}
    rawResults.fields.forEach((value, index) => {
      obj[value] = row[index]
    })
    return obj
  })
}

const candidates = {
  HLASY_01: 'Mirek Topolánek',
  HLASY_02: 'Michal Horáček',
  HLASY_03: 'Pavel Fischer',
  HLASY_04: 'Jiří Hynek',
  HLASY_05: 'Petr Hannig',
  HLASY_06: 'Vratislav Kulhánek',
  HLASY_07: 'Miloš Zeman',
  HLASY_08: 'Marek Hilšer',
  HLASY_09: 'Jiří Drahoš'
}

const byDistrictNumnuts = (transformed) => {
  const aggregated = {}
  transformed.forEach((row) => {
    const existing = aggregated[row.OKRES]
    if (!existing) {
      aggregated[row.OKRES] = {}
      Object.keys(candidates).forEach((votesColumn) => {
        aggregated[row.OKRES][votesColumn] = 0
      })
    }
    Object.keys(candidates).forEach((votesColumn) => {
      aggregated[row.OKRES][votesColumn] += row[votesColumn]
    })
  })
  return aggregated
}

const byNumnutsToByNuts = (aggregated, districts) => {
  const districtsHash = {}
  const byNuts = {}
  districts.forEach((d) => { districtsHash[d.NUMNUTS] = d })
  Object.keys(aggregated).forEach((numnuts) => {
    const result = aggregated[numnuts]
    const district = districtsHash[numnuts]
    byNuts[district.NUTS] = {
      ...result,
      ...district
    }
  })
  return byNuts
}

const results = byNumnutsToByNuts(
  byDistrictNumnuts(
    transformResults(rawResults)
  ),
  districts
)

const center = [49.88, 15.54]

const bounds = geojsonBounds.extent(geo)
const leafletBounds = Leaflet.bounds(
  Leaflet.Point(bounds.xMin, bounds.yMax),
  Leaflet.Point(bounds.xMax, bounds.yMin)
)
console.log('bounds', bounds, leafletBounds)

const ElectionsMap = ({ preferred }) => {
    const grayStyle = {
      color: "#666666",
      weight: 2,
      opacity: 0.9
    }

    const styleFunc = (feature, layer) => {
      if (!preferred[0]) {
        return grayStyle
      }
      const result = results[feature.properties.LAU1_KOD]
      let ok = 0
      let ko = 0
      if (result) {
        Object.keys(candidates).forEach((c) => {
          if (preferred.includes(c)) {
            ok += result[c]
          } else {
            ko += result[c]
          }
        })
      } else {
        return grayStyle
      }
      const ratio = ok / ko
      let color = '#666666'
      if (ratio < 1/4) {
        color = '#a00000'
      } else if (ratio < 4/5) {
        color = '#a03500'
      } else if (ratio < 99/100) {
        color = '#a06a00'
      } else if (ratio < 100/99) {
        color = '#a09f00'
      } else if (ratio < 5/4) {
        color = '#6aa000'
      } else if (ratio < 4) {
        color = '#35a000'
      } else {
        color = '#00a000'
      }
      return {
        color,
        weight: 2,
        opacity: 1
      }
    }
    return (
      <div>
        <Map center={center} zoom={7} bounds={leafletBounds}>
          <GeoJSON data={geo} style={styleFunc}/>
        </Map>
      </div>
    )
}

class App extends Component {
  constructor() {
    super()
    this.state = {}
  }

  check(e) {
    this.setState({
      [e.target.value]: e.target.checked
    })
  }

  checkMulti(list) {
    const newState = this.allFalse()
    list.forEach((votesColumn) => {
      newState[votesColumn] = true
    })
    this.setState(newState)
  }

  allFalse() {
    const newState = {}
    Object.keys(candidates).forEach(votesColumn => {
      newState[votesColumn] = false
    })
    return newState    
  }

  uncheckAll() {
    this.setState(this.allFalse())
  }

  renderCandidates() {
    return (
      <div>
        {
          Object.keys(candidates).sort().map(votesColumn => (
            <span className={"candidate checked-" + (this.state[votesColumn] || false)} key={votesColumn}>
              <input type="checkbox" checked={this.state[votesColumn]} value={votesColumn} id={votesColumn} onChange={this.check.bind(this)} />
              <label htmlFor={votesColumn}>{candidates[votesColumn]}</label>
            </span>
          ))
        }
      </div>
    )
  }

  render() {
    const preferred = Object.keys(candidates).filter(votesColumn => this.state[votesColumn])
    return (
      <div>
        <h1><strike>Pořád ještě není tak zle</strike> Výsledky prvního kola</h1>
        <div><b>Kdo vám přijde přijatelný?</b></div>
        {this.renderCandidates(candidates)}
        <div>
          Kombinace:
          <button onClick={() => this.checkMulti(['HLASY_02', 'HLASY_03', 'HLASY_08', 'HLASY_09'])}>Horáček, Fischer, Hilšer nebo Drahoš</button> 
          <button onClick={() => this.checkMulti(['HLASY_01', 'HLASY_05', 'HLASY_07'])}>Topolánek, Hannig nebo Zeman</button>
        </div>
        <div>
          <button onClick={this.uncheckAll.bind(this)}>Zrušit výběr</button>
        </div>
        <ElectionsMap preferred={preferred} />
      </div>
    )
  }
}

export default App;
