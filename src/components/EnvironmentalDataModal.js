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

export async function fetchHistoricalWeatherData(apiKey, latitude, longitude, startDate, endDate, id, dispatch) {

  const cacheCheck = localStorage.getItem(`GardenPlanStorage-${id}-${latitude}-${longitude}`);
  if(cacheCheck){
    let returnData = JSON.parse(LZString.decompress(cacheCheck));
    // console.log("HISTORICAL DATA", returnData)
    
    dispatch(setAstroData(returnData.astroData))
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

      let jsonStr = JSON.stringify(response.data);
      // console.log("HISTORICAL DATA", response.data)
      const compressed = LZString.compress(jsonStr);
      localStorage.setItem(`GardenPlanStorage-${id}-${latitude}-${longitude}`, compressed);
      dispatch(setAstroData(response.data.astroData))
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
    const apiKey = 'e1f10a1e78da46f5b10a1e78da96f525';
    const startDate = new Date().getFullYear() - 1;  
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