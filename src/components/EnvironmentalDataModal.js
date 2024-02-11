import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from 'react-leaflet';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Typography, Box, Modal, Button, Select, MenuItem } from '@mui/material';
import LocationOn from '@mui/icons-material/LocationOn';
import { renderToStaticMarkup } from 'react-dom/server';
import {setAstroData, setAlmanacData, setHistoricalData} from '../redux/gardenSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import LZString from 'lz-string';
import { Zoom } from '@visx/zoom';
import { localPoint } from '@visx/event';
import { LegendThreshold } from '@visx/legend';
import { scaleThreshold } from '@visx/scale';
import mapboxgl from 'mapbox-gl';
import Map, {Source, Layer} from 'react-map-gl';
import {
  AnimatedAxis,
  AnimatedGrid,
  AreaSeries,
  AnimatedLineSeries,
  XYChart,
  Tooltip,
  Grid,
  Brush,
  TooltipProvider,
  AreaStack,
  GlyphSeries,
   LineSeries
} from "@visx/xychart";

let mapAccessToken = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? 'pk.eyJ1Ijoiam9uZG8zIiwiYSI6ImNscTI1c3p5ZjAwcmYycW56bXdvcm5wcnkifQ.bAzhy4X_Fvbb53LuvgGJ5w' : 'pk.eyJ1Ijoiam9uZG8zIiwiYSI6ImNscTI1cWVicTAwcXgyam80MGl4bm1ldXIifQ.qRpd5YlDJx7cpilf_AvXEg';
function LocationMarker({ onClick }) {
    useMapEvents({
      click(e) {
        onClick(e.latlng);
      },
    });
    return null;
  }
  const CanadaBounds = [
    [41.6765556, -141.00275], // South-west coordinates
    [83.3362128, -52.3231981] // North-east coordinates
  ];
  
  const MapWithBounds = () => {
    const map = useMap();

    // map.setMaxBounds(CanadaBounds);
  
    React.useEffect(() => {
      map.flyToBounds(CanadaBounds);
    }, [map]);
  
    return null;
  };

function MapModal({ open, onClose, onLocationSelect, coords, location }) {
    const handleMapClick = (latlng) => {
        onLocationSelect(latlng);
        onClose();  
    };

    const IconMarker = ({ position }) => {
      const map = useMap();
    
      const iconMarkup = renderToStaticMarkup(<LocationOn style={{ color: 'red', fontSize: '2rem' }} />);
      const customMarkerIcon = new L.divIcon({
        html: iconMarkup,
      });
    
      return <Marker position={position} icon={customMarkerIcon} />;
    };

    let hasLoc = (coords?.lat || location?.lat) && (coords?.lon || location?.lon);
    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ width: '80vw', height: '80vh', margin: '10vh auto', backgroundColor: 'white' }}>
                <MapContainer center={[coords?.lat || location?.lat || 0, coords?.lon || location?.lon ||  0]} style={{ width: '100%', height: '100%' }}
                  zoom={4} 
                  scrollWheelZoom={true}
                  // maxBounds={CanadaBounds}
                  maxBoundsViscosity={1.0}
                  minZoom={4} 
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker onClick={handleMapClick} />
                  <MapWithBounds />
                  {hasLoc  && <IconMarker position={[coords?.lat || location?.lat || 0, coords?.lon || location?.lon || 0]}/>}
                </MapContainer>
            </div>
        </Modal>
    );
}

function aggregateObservations(observations) {
  const dayAggregates = {};
  
  observations.forEach(observation => {
    const date = new Date(observation.valid_time_gmt * 1000).toISOString().split('T')[0];
    
    if (!dayAggregates[date]) {
      dayAggregates[date] = {
        valid_time_gmt: observation.valid_time_gmt,
        dewPtList: [],
        tempList: [],
        tempMax: -Infinity,
        tempMin: Infinity,
        tempSum: 0,
        rHumList: [],
        rHumMax: -Infinity,
        rHumMin: Infinity,
        rHumSum: 0,
        pressureList: [],
        windList: [],
        precip_total: observation.precip_total || 0,
        snow_total: 0,
        wspd: 0,
      };
    }

    const dayData = dayAggregates[date];

    // if(!null)
    //   console.log(observation.precip_hrly);
    dayData.precip_total += observation.precip_hrly;
    dayData.snow_total += observation.snow_hrly;
    dayData.wspd += observation.wspd;
    if(dayData.precip_total !== null)
      dayData.precip_total = parseFloat(dayData.precip_total.toFixed(2))

    dayData.date = date;
    dayData.dewPtList.push(observation.dewPt);
    dayData.tempList.push({ temp: observation.temp, time: observation.valid_time_gmt });
    dayData.tempMax = Math.max(dayData.tempMax, observation.temp);
    dayData.tempMin = Math.min(dayData.tempMin, observation.temp);
    dayData.tempSum += observation.temp;

    dayData.rHumList.push({ hum: observation.rh, time: observation.valid_time_gmt });
    dayData.rHumMax = Math.max(dayData.rHumMax, observation.rh);
    dayData.rHumMin = Math.min(dayData.rHumMin, observation.rh);
    dayData.rHumSum += observation.rh;

    dayData.pressureList.push({ pressure: observation.pressure, time: observation.valid_time_gmt });
    dayData.windList.push({ wdir: observation.wdir, wdir_cardinal: observation.wdir_cardinal, wspd: observation.wspd, time: observation.valid_time_gmt });
  });

  Object.values(dayAggregates).forEach(dayData => {
    dayData.tempAvr = dayData.tempList.length ? parseFloat((dayData.tempSum / dayData.tempList.length).toFixed(3) ): null;
    dayData.rHumAvr = dayData.rHumList.length ? parseFloat((dayData.rHumSum / dayData.rHumList.length).toFixed(3)): null;
    delete dayData.tempSum;
    delete dayData.rHumSum;
  });

  let dayList = [];
  let keys = Object.keys(dayAggregates);
  for(let x = 0; x < keys.length; x++){
    dayList.push({
      ...dayAggregates[keys[x]]
    });
  }
  return dayList;
}

export async function fetchHistoricalWeatherData(apiKey, latitude, longitude, startDate, endDate, id, dispatch) {

  const cacheCheck = localStorage.getItem(`GardenPlanStorage-${id}-${latitude}-${longitude}`);
  if(cacheCheck){
    let returnData = JSON.parse(LZString.decompress(cacheCheck));
    console.log("HISTORICAL DATA", returnData)
    
    dispatch(setAstroData(returnData.astroData))
    dispatch(setAlmanacData(returnData.almanacData))
    // let months = Object.keys(returnData.historicalData);
    // for(let x = 0; x < months.length; x++){
    //   returnData.historicalData[months[x]] = aggregateObservations(returnData.historicalData[months[x]].observation);
    // }
    dispatch(setHistoricalData(returnData.historicalData))
    return {almanacData: returnData.almanacData, historicalData: returnData.historicalData, astroData: returnData.astroData };
  }

  const weatherStationRequest = await axios.get(`https://api.weather.com/v3/location/near?geocode=${latitude},${longitude}&product=airport&format=json&apiKey=${apiKey}`);
  if(weatherStationRequest.status !== 200)
    return
  

  var config = {
    method: 'get',
    url: 'https://ytwwg98ey8.execute-api.ca-central-1.amazonaws.com/prod/v1/climate/location',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { latitude, longitude, startDate, endDate, id: `GardenPlanStorage-${id}-${latitude}-${longitude}` }
  };
  
  let locationData = await axios(config) 
  // console.log("locationData url", locationData); // .data.body, plantData.status)
  if(locationData.status === 202 || locationData.status === 200){
    config = {
      method: 'get',
      url: locationData.data.data,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    try {
      const response = await axios(config);
      // console.log("locationData", response); 

      dispatch(setAstroData(response.data.astroData))
      dispatch(setAlmanacData(response.data.almanacData))
      let months = Object.keys(response.data.historicalData);
      for(let x = 0; x < months.length; x++){
        response.data.historicalData[months[x]] = aggregateObservations(response.data.historicalData[months[x]].observation);
      }
      dispatch(setHistoricalData(response.data.historicalData))
      let jsonStr = JSON.stringify(response.data);
      // console.log("HISTORICAL DATA", response.data)
      const compressed = LZString.compress(jsonStr);
      localStorage.setItem(`GardenPlanStorage-${id}-${latitude}-${longitude}`, compressed);
      return {almanacData: response.data.almanacData, historicalData: response.data.historicalData, astroData: response.data.astroData};

      // return data;
    } catch (error) {
      console.error('Error downloading the data:', error);
    }
  }
}


export function EnvironmentalDataModal({session, setLocation}) {
    const dispatch = useDispatch();
    const [MapModalOpen, setMapModalOpen] = useState(false);
    const [location, recordLocation] = useState(null);
    const [open, setOpen] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [openHeightMap, setOpenHeightMap] = useState(false);
    const apiKey = 'e1f10a1e78da46f5b10a1e78da96f525';
    const startDate = new Date().getFullYear() - 1;  
    const endDate = new Date().getFullYear(); 
    const [locationData, setLocationData] = useState(null);
    const { width, height } = useViewportSize();
  


    useEffect(()=> {
      const cacheCheck = localStorage.getItem(`GardenPlanStorage-${session.id}-${startDate}-${endDate}`);
      if(cacheCheck){
        let returnData = JSON.parse(LZString.decompress(cacheCheck));
        console.log("HISTORICAL DATA", returnData)
        setLocationData(returnData)
      }
    }, [])

    const handleLocationSelect = (latlng) => {
      // console.log(latlng); 
      recordLocation({lat: latlng.lat, lon: latlng.lng});
      setLocation({lat: latlng.lat, lon: latlng.lng});
    };
  
    const modalStyle = {
      
      position: 'absolute',
      top: '50%',
      left: '50%',
      height: '90%',
      transform: 'translate(-50%, -50%)',
      width: "75vw",
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,  
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'scroll',
    };
    return (
      <Box>
        <Button disabled={!session.id}variant="contained" color="primary" onClick={() => setOpen(true)}>
          Location Data{!session.id && ` (create save to enable)`}
        </Button>
        <Modal open={open} onClose={() => {setOpen(false)}}>
          <Box sx={modalStyle}>
            {session?.data?.coords &&
            <Typography style={{paddingTop: 250,}} variant="h6" component="h2"> 
              {`Lat: ${((session?.data?.coords?.lat)).toFixed(7)}, Lon: ${((session?.data?.coords?.lon)).toFixed(7)}`} 
              </Typography>}
              
              
            <Button variant="contained" color="primary" onClick={() => setMapModalOpen(true)}>
              Select Location
            </Button>
            {/* <Button onClick={() => setOpenHeightMap(!openHeightMap)}>{ openHeightMap? "Close" : "Open"} HeightMap</Button> */}
            {(location || session?.data?.coords) && <Button disabled={fetching} variant="contained" color="primary" onClick={async() => {
              setFetching(true);
              let data = await fetchHistoricalWeatherData(apiKey,  location?.lat || session?.data?.coords.lat, location?.lon || session?.data?.coords.lon, startDate, endDate, session.id, dispatch).catch(err => { setFetching(false)})
              setLocationData(data);
              setFetching(false);
              }}>
              Get Location Data
            </Button>}
            <Box 
          style={{
            position: 'absolute',
            top: '50%',
            height: '50vh',
            transform: 'translate(0, 0)',
            width: "50vw",
            overflowY: 'scroll'}}>
              {openHeightMap && 
              <Map
                mapboxAccessToken={mapAccessToken}
                mapLib={import('mapbox-gl')}
                initialViewState={{
                  longitude: session?.data?.coords?.lon,
                  latitude: session?.data?.coords?.lat,
                  zoom: 14
                }}
                mapStyle="mapbox://styles/mapbox/outdoors-v11"
              >
                <Source
                  id="mapbox-dem"
                  type="raster-dem"
                  url="mapbox://mapbox.mapbox-terrain-dem-v1"
                  tileSize={512}
                  maxzoom={16}
                />
              </Map>}
            </Box>
            {MapModalOpen && <MapModal open={MapModalOpen} coords={session?.data?.coords} location={location}onClose={() => setMapModalOpen(false)} onLocationSelect={handleLocationSelect} />}
            {session?.data?.coords && <LineChart/>}

          </Box>
        </Modal>
      </Box>
    );
  }







const chartConfigs = [
  {
    label: "Temperature",
    value: {
      keys: ["tempAvr", "tempMax", "tempMin"],
      title: "Temp",
      unit: "°C",
      isAlmanac: false,
      range: {
        "tempMax": 'red',
        "tempMin": 'blue',
        "tempAvr": 'orange',
      }, 
    }
  },
  {
    label: "Humidity",
    value: {
      keys: ["rHumAvr", "rHumMax", "rHumMin"],
      title: "Humidity",
      unit: "%",
      isAlmanac: false,
      range: {
        "rHumMax": 'red',
        "rHumMin": 'blue',
        "rHumAvr": 'orange',
      }, 
    }
  },
  {
    label: "Percipitation",
    value: {
      keys: ["precip_total"],
      title: "Percipitation",
      unit: "",
      isAlmanac: false,
      range: {
        "precip_total": 'blue',
      }, 
    }
  },
  {
    label: "Snow",
    value: {
      keys: ["snow_total"],
      title: "Snow",
      unit: "",
      isAlmanac: false,
      range: {
        "snow_total": 'blue',
      }, 
    }
  },
  {
    label: "WindSpeed",
    value: {
      keys: ["wspd"],
      title: "Humidity",
      unit: "",
      isAlmanac: false,
      range: {
        "wspd": 'orange',
      }, 
    }
  },
  {
    label: "Almanac Temperature",
    value: {
      keys: ["temperatureMean", "temperatureAverageMax", "temperatureAverageMin"],
      title: "Temp",
      unit: "°C",
      isAlmanac: true,
      range: {
        "temperatureAverageMax": 'red',
        "temperatureAverageMin": 'blue',
        "temperatureMean": 'orange',
      }, 
    }
  },
  {
    label: "Almanac Percipitation",
    value: {
      keys: ["precipitationAverage"],
      title: "Percipitation",
      unit: "",
      isAlmanac: true,
      range: {
        "precipitationAverage": 'blue',
      }, 
    }
  },
  {
    label: "Almanac Snow",
    value: {
      keys: ["snowAccumulationAverage"],
      title: "Snow",
      unit: "",
      isAlmanac: true,
      range: {
        "snowAccumulationAverage": 'blue',
      }, 
    }
  },
]

 

function useViewportSize(scale = 0.50) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function updateSize() {
      setSize({
        width: window.innerWidth * scale,
        height: window.innerHeight * scale
      });
    }

    window.addEventListener('resize', updateSize);
    updateSize(); // initialize size

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
}

const LineChart = () => {
  const svgRef = useRef(null);
  const { historicalData, almanacData } = useSelector(state => state.garden);
  const [accessors, setAccessors] = useState({
    xAccessor: (d) => {
      // if(!selectedOption.isAlmanac)
        return new Date(`${d?.date}T00:00:00`)
      // else
      // return new Date(`${new Date().getFullYear}-${monthArrDate[d?.date]} T00:00:00`)
    },
    yAccessor: (d) => d?.y,
  });
  const [mousePos, setMousePos] = useState({x: 0, y: 0});
  const [chartData, setChartData] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [toolTipData, setToolTipData] = useState(null);
  const { width, height } = useViewportSize(0.60);
  const monthArr = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept" ,"Oct", "Nov", "Dec"];
  const monthArrDate = ["01-01", "02-01", "03-01", "04-01", "05-01", "06-01", "07-01", "08-01", "09-01" ,"10-01", "11-01", "12-01"];
  

  const handleMouseMove = (event) => {
    const rect = event.target.getBoundingClientRect();
    const relX = event.clientX - rect.left; // X position within the element
    const relY = event.clientY - rect.top;
    console.log(`${relX}, ${relY}`)
    // Assuming you have a ref to your SVG element
    const point = localPoint(svgRef.current, event);
    if (point) {
      let x = point.x;
      const y = point.y;
      setMousePos({x, y});
      // console.log({x,y})
      let w = Math.floor(width* 0.91);
      let deadZone = w - Math.floor(0.93 * w)
      if(x < deadZone)
        return
      x -= deadZone;
      if(chartData){
        // console.log(chartData)
        let keys = Object.keys(chartData);
        let index = Math.min(Math.floor((x / Math.floor(0.95 * w)) * chartData[keys[0]].length), chartData[keys[0]].length-1);
        // console.log(index)
        // console.log(index, chartData[keys[0]].length)
        let tipData = {
          date:  chartData[keys[0]][index].date
        };
        for(let x = 0; x < keys.length; x++){
          tipData[keys[x]] = chartData[keys[x]][index];
        }
        setToolTipData(tipData);
      }
    }
  };


  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value); 
    let selected = event.target.value; 
    if(selected === null){
      setChartData(selected)
      return;
    }
    // console.log(selected);
    let cData = {}
    for(let x = 0; x < selected.keys.length; x++){
      cData[selected.keys[x]] = [];
    }
    if(!selected.isAlmanac){
      // console.log(Object.keys(historicalData));
      if(historicalData && Object.keys(historicalData).length >  0){
        let months = Object.keys(historicalData);
        for(let i = 0; i < months.length; i++){
          let monthData = historicalData[months[i]];
          for(let y = 0; y < monthData.length; y++){
            let day = monthData[y];
  
            for(let x = 0; x < selected.keys.length; x++){
              cData[selected.keys[x]].push({
                date: day.date,
                y: day[selected.keys[x]],
              })
            }
            
          }
        }
        // console.log(cData)
      console.log("cData", cData);
        setChartData(cData)
      }
    }else {
      // console.log(selected.keys, almanacData)
      if(almanacData && almanacData.length > 0){
        for(let i = 0; i < almanacData.length; i++){
          let monthData = almanacData[i];
          // console.log("monthData",monthData)
          for(let x = 0; x < selected.keys.length; x++){
            cData[selected.keys[x]].push({
              date: `${new Date().getFullYear()}-${monthArrDate[i]}`, // i, //monthArr[x],
              y: monthData[selected.keys[x]],
            })
          }
        }
      }
      console.log("cData", cData);
      setChartData(cData)
    }
  };
  
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }}>

      {historicalData && <Select
          value={selectedOption}
          onChange={handleSelectChange}
          fullWidth
        >
        {selectedOption && <MenuItem key={'asdwdad'} value={null}>Deselect Chart</MenuItem>}
          {chartConfigs?.map((option, index) => (
            <MenuItem key={index} value={option.value}>{option.label}</MenuItem>
          ))}
      </Select>}
      {toolTipData && chartData && 
              <Box style={{flexDirection: "row", display: 'flex', 
              pointerEvents: 'none'}} >
                
                {/* <Box style={{ display: 'flex', flexDirection: "row", margin: 10 }} >
                    <Typography>
                      {Math.floor(mousePos?.x)}, {Math.floor(mousePos?.y)}
                    </Typography>
                    <br />
                  </Box> */}
                {
                Object.keys(toolTipData).map((key, index) => {
                  return (
                  <Box style={{ display: 'flex', flexDirection: "row", margin: 10 }} >
                    <Typography style={{ color: selectedOption?.range[key] }}>
                      {key}: {key === "date" ?toolTipData.date : toolTipData[key].y}
                    </Typography>
                    <br />
                  </Box>)
                })
              }
              </Box>}
      <svg ref={svgRef} 
            width={width}
            height={height} >
        <g>
        {chartData && <XYChart
        style={{ pointerEvents: 'none' }} 
          height={height}
          width={width}
          xScale={{ type: "time", clamp: true, nice: true }}
          yScale={{ type: "linear", clamp: true, nice: true }}
        >
          <Grid  style={{ pointerEvents: 'none' }} numTicks={4} />
          <AnimatedAxis style={{ pointerEvents: 'none' }}  orientation="bottom" numTicks={5} strokeWidth={0.5} />
          <AnimatedAxis style={{ pointerEvents: 'none' }} orientation="left" numTicks={4} label={`${selectedOption?.title} (${selectedOption?.unit})`} strokeWidth={0.5} />
          {Object.entries(chartData).map(([key, value]) => (
            <>
              <AnimatedLineSeries style={{ pointerEvents: 'none' }} key={key} opacity={0.7} dataKey={key} data={value} {...accessors} />
              <LineSeries style={{ pointerEvents: 'none' }} dataKey={key} data={value} {...accessors} stroke={selectedOption?.range[key]}/>
            </>
          ))} 
        </XYChart>}
        </g>
          {chartData &&<rect
            width={width- 100}
            height={100}
            y={height * 0.8}
            x={width * 0.065}
            fill={'rgba(0, 0, 0, 0.05)'}
            pointerEvents="all" 
            onMouseMove={handleMouseMove}
          />}
      </svg>
    </Box>
  );
};