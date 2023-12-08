import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from 'react-leaflet';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Typography, Box, Modal, Button } from '@mui/material';
import LocationOn from '@mui/icons-material/LocationOn';
import { renderToStaticMarkup } from 'react-dom/server';
import {setAstroData} from '../redux/gardenSlice';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import LZString from 'lz-string';

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

    map.setMaxBounds(CanadaBounds);
  
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
                  maxBounds={CanadaBounds}
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

function getDateStr(dateModified){
  const date = new Date(dateModified)
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).substr(-2)
  const day = ('0' + date.getDate()).substr(-2)
  const dateStr = [year, month, day].join('')
  return dateStr
}

function parseHistoricalData(data){
  let compiledData = {
    monthlyMoonPhase: [],
    solarPaths: {
      summerSolstice: {
        key: '06-21',
        data: null
      },
      winterSolstice: {
        key: '12-21',
        data: null
      },
      vernalEquinox: {
        key: '03-20',
        data: null
      },
      autumnalEquinox: {
        key: '09-22',
        data: null
      }
    }
  }
  let monthKeys = Object.keys(data.historicalData).filter((item, index) => index < 12)

  monthKeys.map((key, index) => {
    compiledData.monthlyMoonPhase.push(data.historicalData[key].astro.phases);
    data.historicalData[key].astro.data.map((item) => {
      let solsticeKeys = Object.keys(compiledData.solarPaths)
      for(let x = 0; x < solsticeKeys.length; x++){
        if(item.dateLocal.includes(compiledData.solarPaths[solsticeKeys[x]].key)){
          compiledData.solarPaths[solsticeKeys[x]].data = item;
          return item;
        }
      }

    })
  });

  return compiledData;

}

export async function fetchHistoricalWeatherData(apiKey, latitude, longitude, startDate, endDate, id, dispatch) {

  const cacheCheck = localStorage.getItem(`GardenPlanStorage-${id}-${startDate}-${endDate}`);
  if(cacheCheck){
    let returnData = JSON.parse(LZString.decompress(cacheCheck));
    console.log("HISTORICAL DATA", returnData)
    // console.log("Parsed HISTORICAL DATA", parseHistoricalData(returnData))
    // let astroData = parseHistoricalData(returnData);
    dispatch(setAstroData(returnData.astroData))
    return {almanacData: returnData.almanacData, historicalData: returnData.historicalData, astroData: returnData.astroData };
  }

  const weatherStationRequest = await axios.get(`https://api.weather.com/v3/location/near?geocode=${latitude},${longitude}&product=airport&format=json&apiKey=${apiKey}`);
  if(weatherStationRequest.status !== 200)
    return

  const historicalData = {};
  const almanacData = [];
  let stationId = null;
  let stationName = null;
  //`https://api.weather.com/v1/location/${weatherStationRequest.data.location.icaoCode[1]}:9:CA/almanac/daily.json?apiKey=${apiKey}&units=m&start=${String(month).padStart(2, '0')}01&end=${String(month).padStart(2, '0')}${new Date(year, month, 0).getDate()}`
  // let alUrl = `https://api.weather.com/v3/wx/almanac/monthly/1month?icaoCode=${weatherStationRequest.data.location.icaoCode[1]}&format=json&units=m&month=${1}&apiKey=${apiKey}`;
  // const alResp = await axios.get(alUrl);
  // console.log(alResp)
  for (let year = startDate; year <= endDate; year++) {
    // let aggUrl = `https://api.weather.com/v2/astro?apiKey=${apiKey}&geocode=${latitude},${longitude}&days=${30}&date=${year}0101&format=json`
    // const aggResponse = await axios.get(aggUrl);
    // console.log("aggResponse", aggResponse);
    // return
    for (let month = 1; month <= 12; month++) {
      const dateString = `${year}${String(month).padStart(2, '0')}`;
      if(year === startDate){
        let almanacUrl = `https://api.weather.com/v3/wx/almanac/monthly/1month?icaoCode=${weatherStationRequest.data.location.icaoCode[1]}&format=json&units=m&month=${month}&apiKey=${apiKey}`
        const alResponse = await axios.get(almanacUrl);
        if(alResponse.status === 200){
          let alObj = {}
          let keys = Object.keys(alResponse.data);

          for(let x = 0; x < keys.length; x++){
            alObj[keys[x]] = alResponse.data[keys[x]][0] || null;
          }

          almanacData.push(alObj);
          if(!stationId){
            stationId = alObj.stationId
            stationName = alObj.stationName
          }
        }

      }
      let url = `https://api.weather.com/v1/location/${weatherStationRequest.data.location.icaoCode[1]}:9:CA/observations/historical.json?apiKey=${apiKey}&units=m&startDate=${dateString}01&endDate=${dateString}${new Date(year, month, 0).getDate()}`;
      let astroUrl = `https://api.weather.com/v2/astro?apiKey=${apiKey}&geocode=${latitude},${longitude}&days=${new Date(year, month, 0).getDate() === 31  ? 30 : new Date(year, month, 0).getDate() }&date=${dateString}01&format=json`;


      try {
        const response = await axios.get(url);
        const astroResponse = await axios.get(astroUrl);
        if(response.data.metadata.status_code === 200 || astroResponse.data.metadata.status_code === 200)
          historicalData[dateString] = {
            observations: [],
            astro: {
              data: [],
              phases: []
            }
          }
        if(astroResponse.data.metadata.status_code === 200){
          historicalData[dateString].astro = {
            data: astroResponse.data.astroData,
            phases: astroResponse.data.astroPhases
          };
        }
        if(response.data.metadata.status_code === 200)
          historicalData[dateString].observations = response.data.observations;
      } catch (error) {
        console.error(`Failed to fetch historical weather data for ${dateString}:`, error);
      }
    }
  }
  
  let astroData = parseHistoricalData({historicalData, almanacData});
  let jsonStr = JSON.stringify({historicalData, almanacData, astroData});
  const compressed = LZString.compress(jsonStr);
  localStorage.setItem(`GardenPlanStorage-${id}-${startDate}-${endDate}`, compressed);
  console.log("HISTORICAL DATA", {almanacData: almanacData, historicalData: historicalData, astroData })
  dispatch(setAstroData(astroData))
  return {almanacData: almanacData, historicalData: historicalData, astroData };
}


export function EnvironmentalDataModal({session, setLocation}) {
    const dispatch = useDispatch();
    const [MapModalOpen, setMapModalOpen] = useState(false);
    const [location, recordLocation] = useState(null);
    const [open, setOpen] = useState(false);
    const apiKey = 'e1f10a1e78da46f5b10a1e78da96f525'; // Replace with your actual API key
    const startDate = new Date().getFullYear() - 1; // Start of your date range
    const endDate = new Date().getFullYear(); 
    const [locationData, setLocationData] = useState(null);
  
    useEffect(()=> {
      const cacheCheck = localStorage.getItem(`GardenPlanStorage-${session.id}-${startDate}-${endDate}`);
      if(cacheCheck){
        let returnData = JSON.parse(LZString.decompress(cacheCheck));
        console.log("HISTORICAL DATA", returnData)
        setLocationData(returnData)
      }
    }, [])

    const handleLocationSelect = (latlng) => {
      console.log(latlng); 
      recordLocation({lat: latlng.lat, lon: latlng.lng});
      setLocation({lat: latlng.lat, lon: latlng.lng});
    };
  
    const modalStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    };
    return (
      <Box>
        {session?.id && <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Location Data
        </Button>}
        <Modal open={open} onClose={() => {setOpen(false)}}>
          <Box sx={modalStyle}>
            {session?.data?.coords &&
            <Typography id="lat-lon" variant="h6" component="h2"> 
              {`SLat: ${((session?.data?.coords?.lat)).toFixed(7)}, SLon: ${((session?.data?.coords?.lon)).toFixed(7)}`} 
              </Typography>}
            {location &&
            <Typography id="lat-lon" variant="h6" component="h2"> 
              {`Lat: ${((location?.lat)).toFixed(7)}, Lon: ${((location?.lon)).toFixed(7)}`} 
              </Typography>}
              
            <Button variant="contained" color="primary" onClick={() => setMapModalOpen(true)}>
              Select Location
            </Button>
            {(location || session?.data?.coords) && <Button variant="contained" color="primary" onClick={async() => {
              let data = await fetchHistoricalWeatherData(apiKey,  location?.lat || session?.data?.coords.lat, location?.lon || session?.data?.coords.lon, startDate, endDate, session.id, dispatch)
              setLocationData(data);
              }}>
              Get Location Data
            </Button>}
            <MapModal open={MapModalOpen} coords={session?.data?.coords} location={location}onClose={() => setMapModalOpen(false)} onLocationSelect={handleLocationSelect} />
          </Box>
        </Modal>
      </Box>
    );
  }