import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import FloatingToolbar from './FloatingToolbar';
import { setAllPlantData, setCurrentSession, setPlantsInGarden, setSelectedPlant } from '../redux/gardenSlice'; // Import setPlantData
import SaveLoadModal from "./SaveLoadModal"
import { Typography, Box, Modal, IconButton, Card, CardActions, CardContent, Button, TextField } from '@mui/material';
import SunCalc from 'suncalc'
import mapboxgl from 'mapbox-gl';
import {MapModal} from './EnvironmentalDataModal'
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Map, {Source, Layer} from 'react-map-gl';
import Slider from '@mui/material/Slider';
import MeasurementList from './MeasurementList';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { SwatchesPicker } from 'react-color'
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close';
import useDeepCompareEffect from '../utils/useDeepCompareEffect';
import { useLayoutEffect } from 'react';

let mapAccessToken = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? 'pk.eyJ1Ijoiam9uZG8zIiwiYSI6ImNscTI1c3p5ZjAwcmYycW56bXdvcm5wcnkifQ.bAzhy4X_Fvbb53LuvgGJ5w' : 'pk.eyJ1Ijoiam9uZG8zIiwiYSI6ImNscTI1cWVicTAwcXgyam80MGl4bm1ldXIifQ.qRpd5YlDJx7cpilf_AvXEg';
const conversionFactors = {
  cm: parseFloat((1/ 0.01).toFixed(5)), // centimeters to meters
  m: 1, // meters to meters
  in: parseFloat((1 / 0.0254).toFixed(5)), // inches to meters
  ft: parseFloat((1/ 0.3048).toFixed(5)), // feet to meters
  y: parseFloat((1 / 0.9144).toFixed(5)), // yards to meters
  ac: parseFloat((1 / 63.61).toFixed(5)), // acre to meters
  ha: parseFloat((1/ 100).toFixed(5)), // acre to meters
};
const pixelsPerMeter = 10;
var map = null;
const Garden = ({ showShadows, setShowShadows, isEditing, clearGarden, gardenDimensions, openHeightMap, setOpenHeightMap, setOpenFeedBackModal, openFeedBackModal, setGlobalScale, setAreaStr, areaStr}) => {
  const dispatch = useDispatch();
  const [modalData, setmodalData] = useState({
    type: null,
    selectionData: null,
    confirmFunction: null,
    open: false
  });
  const [measurementList, setMeasurementList] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [lastSelectedPointIndex, setLastSelectedPointIndex] = useState(null);
  const [lastSelectedPlant, setLastSelectedPlant] = useState(null);
  const [selectedPlantIndex, setSelectedPlantIndex] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [startViewBox, setStartViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 }); // Default values
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: window.innerHeight * 0.81 });
  const [scale, setScale] = useState(1);
 

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { permRoles, selectedPlants, selectedPlant, plantsInGarden, selectedPermRole, plants, plantMacros, currentSession, astroData } = useSelector(state => state.garden); 

  useEffect(() => {
    setLastSelectedPlant(null)
  }, [selectedPermRole, selectedPlants, selectedPlant])
    
  // useEffect(() => {
  //   if (openHeightMap) {
  //     setTimeout(() => {

  //     // console.log(location?.lat || session?.data?.coords?.lat, location?.lon || session?.data?.coords?.lon);
  //     map = new mapboxgl.Map({
  //       container: 'map-container',
  //       style: 'mapbox://styles/mapbox/outdoors-v11',
  //       center: [currentSession?.data?.coords?.lon,  currentSession?.data?.coords?.lat],
  //       zoom: 13,
        
  //     });

  //     map.on('load', () => {
  //       map.addSource('mapbox-dem', {
  //         'type': 'raster-dem',
  //         'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
  //         'tileSize': 512,
  //         'maxzoom': 15
  //       });
  //       map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        
  //     });
  //     }, 50)
  //   }else {
  //     if(map)
  //       map.remove();
  //   }

  //   return () => {
  //     if (map) {
  //       map.remove();
  //     }
  //   };
  // }, [openHeightMap,  currentSession?.data?.coords?.lat, currentSession?.data?.coords?.lon]);
  const svgRef = useRef();
  useEffect(() => {
    setPoints([]);
    setSelectedPointIndex(null);
    setLastSelectedPointIndex(null);
    dispatch(setPlantsInGarden([]));
  }, [clearGarden])
  
  useEffect(() => {
    const newPlantsInGarden = plantsInGarden.filter(plant => isInsidePolygon({ x: plant.x, y: plant.y }, points));
    dispatch(setPlantsInGarden(newPlantsInGarden));
  }, [points]);
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  const handleZoom = useCallback((delta) => {
  
    setScale(prevScale => {
      let scaleFactor = (delta > 0 ? 1 : -1) * 0.1; //(delta > 0 ? 1.1 : 1 / 1.1);
  
      if(prevScale < 0.4){
        scaleFactor /= 10;
      }
      const newScale = prevScale + scaleFactor; // Math.max(prevScale + scaleFactor, 0.1); 
      setGlobalScale(parseFloat(newScale.toFixed(5)));
      return parseFloat(newScale.toFixed(5));
    });
  }, [setScale, viewBox, setViewBox]);

  const renderGridLines = (gridLines) => {
    return gridLines.map((line, index) => (
      <line
        key={index}
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="lightgray"
        strokeWidth="0.5"
      />
    ));
  };

  
  function calculateGridLines(vB) {
    // Define intervals for primary and secondary lines based on the scale
    let primaryInterval, secondaryInterval;

    if (scale < 1) {
      // Find the power of 2 for scales less than 1
      let power = 0;
      while (1 / Math.pow(2, power) > scale) {
        power++;
      }
      primaryInterval = 10 * pixelsPerMeter * Math.pow(2, power - 1); // 10m at 1/(2^power)
      secondaryInterval = 1 * pixelsPerMeter * Math.pow(2, power - 1); // 1m at 1/(2^power)
    } else {
      // For scales of 1 and above, the interval decreases as the scale increases
      // Find the nearest power of 2 that is less than or equal to the scale
      const power = Math.floor(Math.log2(scale));
      primaryInterval = 10 * pixelsPerMeter / Math.pow(2, power); // 10m interval at scale 1
      secondaryInterval = 1 * pixelsPerMeter / Math.pow(2, power); // 1m interval at scale 1
    }
  

    // const primaryInterval = 10 * pixelsPerMeter// * scale; // 10m interval at scale 1
    // const secondaryInterval = pixelsPerMeter// * scale; // 1m interval at scale 1
    let viewBox ={...vB};
    // viewBox.height *= Math.PI;
    // Calculate the start and end points for the lines based on the viewBox
    let startX = (Math.floor((viewBox.x) / scale / primaryInterval) * primaryInterval);
    // startX -= 0.25 * startX;
    const endX = (Math.ceil((viewBox.x + viewBox.width) / scale / primaryInterval) * primaryInterval) * 1.25;
    const startY = (Math.floor(viewBox.y / scale / primaryInterval) * primaryInterval);
    const endY = (Math.ceil((viewBox.y + viewBox.height) / scale / primaryInterval) * primaryInterval) * 1.25;
  // console.log(startX,endX, startY, endY);
    const primaryLines = [];
    const secondaryLines = [];
  
    // Generate primary grid lines within the viewBox
    for (let x = startX; x <= endX; x += primaryInterval) {
      primaryLines.push({ x1: x, y1: viewBox.y / scale, x2: x, y2: (viewBox.y + viewBox.height) / scale });
    }
    for (let y = startY; y <= endY; y += primaryInterval) {
      primaryLines.push({ x1: viewBox.x / scale - (viewBox.width * 0.25), y1: y, x2: viewBox.x / scale + (viewBox.width * 1.25) / scale, y2: y });
    }
  
    // Generate secondary grid lines within the primary intervals
    for (let x = startX; x <= endX; x += secondaryInterval) {
      if (x % primaryInterval !== 0) { // Skip primary line positions
        secondaryLines.push({ x1: x, y1: viewBox.y / scale, x2: x, y2: (viewBox.y + viewBox.height) / scale });
      }
    }
    for (let y = startY; y <= endY; y += secondaryInterval) {
      if (y % primaryInterval !== 0) { // Skip primary line positions
        secondaryLines.push({ x1: viewBox.x / scale - (viewBox.width * 0.25), y1: y, x2: viewBox.x / scale + (viewBox.width * 1.25) / scale, y2: y });
      }
    }
  
    return { primaryLines, secondaryLines };
  }

  const handleKeyPress = useCallback((e) => {
    let newX = parseFloat(svgRef.current.viewBox.baseVal.x);
    let newY = parseFloat(svgRef.current.viewBox.baseVal.y);
    switch(e.key) {
      // case '+':
      // case '=': // Zoom in
      //   handleZoom(1, mousePosition);
      //   break;
      // case '_':
      // case '-': // Zoom out
      //   handleZoom(-1, mousePosition);
      //   break;
        // case ' ': // Zoom out
        //   setScale(1);
        //   svgRef.current.setAttribute('viewBox', `${0} ${0} ${1000} ${1000}`);
        //   setViewBox({ ...viewBox, x: 0, y: 0, width: 1000  });
        //   break;
      default:
        return; // Ignore other keys
    }
 
  }, [handleZoom, mousePosition, viewBox]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const clearData = () => {
    if(currentSession && currentSession.id){
      const seshArr = localStorage.getItem("GardenPlanStorage");
      let seshData = seshArr != null ? JSON.parse(seshArr) : [];

      let seshIndex = seshData.findIndex(item => item.id === currentSession.id)
      if(seshIndex !== -1){
        console.log("clearData", seshData.length);
        localStorage.setItem("GardenPlanStorage", JSON.stringify(seshData.filter(item => item.id !== currentSession.id)));

      }
    }
  }

  const loadData = () => {
    console.log("loadData")
    const seshArr = localStorage.getItem("GardenPlanStorage");
    let seshData = seshArr != null ? JSON.parse(seshArr) : [];
    let sesh = seshData.find(item => { return item.id === currentSession?.id || item.name === currentSession?.id })
    console.log("loadData", seshData.length);
    if(sesh){
      sesh.dateModified = new Date();
      let index = seshData.findIndex(item => { return item.id === currentSession.id });
      sesh.data = {
        coords: currentSession?.data?.coords || sesh.data.coords,
        measurementList: measurementList,
        points: points,
        plantsInGarden: plantsInGarden,
        plants: plants
      }
      seshData[index] = sesh;
      const jsonValue = JSON.stringify(seshData);
      console.log("loadData1", seshData.length);
      localStorage.setItem("GardenPlanStorage", jsonValue);
    }else {

      let id = uuidv4();

      let cSession = {
        id: id,
        name: currentSession?.name || id || null,
        dateCreated: currentSession?.dateCreated || new Date(),
        dateModified: new Date(),
        data: {
          measurementList: measurementList,
          points: points,
          plantsInGarden: plantsInGarden,
          plants: plants,
          coords: currentSession?.data?.coords || null
        }
      }
      seshData.push(cSession);
      dispatch(setCurrentSession({data: cSession}))
      const jsonValue = JSON.stringify(seshData);
      console.log("loadData2", seshData.length);
      localStorage.setItem("GardenPlanStorage", jsonValue);
    }
    const jsonData = localStorage.getItem('GardenPlanStorage');
    if (jsonData) {
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GardenPlanner_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } else {
      
      console.error('No data available to download.');
    }
  }


  const storeSession = (skip = false) => {

    const seshArr = localStorage.getItem("GardenPlanStorage");
    let seshData = seshArr != null ? JSON.parse(seshArr) : [];
    console.log("storeSession", seshData.length);
    let sesh = seshData.find(item => { return item.id === currentSession?.id || item.name === currentSession?.id })
    if(sesh){
      sesh.dateModified = new Date();
      let index = seshData.findIndex(item => { return item.id === currentSession?.id || item.name === currentSession?.id });
      sesh.data = {
        measurementList: measurementList,
        points: points,
        plantsInGarden: plantsInGarden,
        plants: plants,
        coords: currentSession?.data?.coords || sesh.data.coords
      }
      seshData[index] = sesh;
      const jsonValue = JSON.stringify(seshData);
      console.log("storeSession1", seshData.length);
      localStorage.setItem("GardenPlanStorage", jsonValue);
    }else {
      console.log(currentSession)
      let cSession = {
        id: uuidv4(),
        name: currentSession?.name || null,
        dateCreated: currentSession?.dateCreated || new Date(),
        dateModified: new Date(),
        data: {
          measurementList: measurementList,
          points: points,
          plantsInGarden: plantsInGarden,
          plants: plants,
          coords: currentSession?.data?.coords || null
        }
      }
      seshData.push(cSession);
      if(!skip)
        dispatch(setCurrentSession({data: cSession}))
      const jsonValue = JSON.stringify(seshData);
      console.log("storeSession2", seshData.length);
      localStorage.setItem("GardenPlanStorage", jsonValue);
    }
  }

  const clearPlantData = () => {
    const seshArr = localStorage.getItem("GardenPlanStorage");
    let seshData = seshArr != null ? JSON.parse(seshArr) : []; 
    let sesh = seshData.find(item => { return item.id === currentSession.id || item.name === currentSession.id })
    if(sesh){
      sesh.dateModified = new Date();
      let index = seshData.findIndex(item => { return item.id === currentSession.id || item.name === currentSession.id });
      sesh.data = {
        coords: currentSession?.data?.coords || sesh.data.coords,
        measurementList: measurementList,
        points: points,
        plantsInGarden: [],
        plants: null
      }
      seshData[index] = sesh;
      const jsonValue = JSON.stringify(seshData); 
      localStorage.setItem("GardenPlanStorage", jsonValue);
    }
  }

  const storeData = () => {
    try {
      const preSavedJson = localStorage.getItem("GardenPlanStorage");
      let obj = preSavedJson != null ? JSON.parse(preSavedJson) : [];

      if(obj){
        setmodalData({
          type: "S",
          selectionData: obj.map(item => item.name || item.id),
          handleClose: () => {
            setmodalData({
              type: null,
              selectionData: null,
              confirmFunction: null,
              open: false
            })
          },
          confirmFunction: (idStr, reName) => {
            const seshArr = localStorage.getItem("GardenPlanStorage");
            let seshData = seshArr != null ? JSON.parse(seshArr) : [];
            console.log("storeData0", seshData.length);
            let sesh = seshData.find(item => { return item.id === idStr || item.name === idStr })
            if(sesh){
              sesh.dateModified = new Date();
              let index = seshData.findIndex(item => { return item.id === idStr || item.name === idStr });
              if(reName)
              sesh.name = idStr;
              sesh.data = {
                coords: currentSession?.data?.coords || sesh.data.coords,
                measurementList: measurementList,
                points: points,
                plantsInGarden: plantsInGarden,
                plants: plants
              }
              seshData[index] = sesh;
              const jsonValue = JSON.stringify(seshData);
              console.log("storeData1", seshData.length);
              localStorage.setItem("GardenPlanStorage", jsonValue);
            }else {

              let cSession = {
                id: uuidv4(),
                name: idStr || currentSession?.name || null,
                dateCreated: currentSession?.dateCreated || new Date(),
                dateModified: new Date(),
                data: {
                  measurementList: measurementList,
                  points: points,
                  plantsInGarden: plantsInGarden,
                  plants: plants,
                  coords: currentSession?.data?.coords || null
                }
              }
              dispatch(setCurrentSession({data: cSession}))
              seshData.push(cSession);
              const jsonValue = JSON.stringify(seshData);
              console.log("storeData2", seshData.length);
              localStorage.setItem("GardenPlanStorage", jsonValue);
            }
          },
          open: true
        });
      }


      console.log('Data stored successfully');
    } catch (e) {
      console.error('Failed to save the data to the storage', e);
    }

  };
  
  //load session data
  const retrieveData = () => {
    try {
      const jsonValue = localStorage.getItem("GardenPlanStorage");
      let obj = jsonValue != null ? JSON.parse(jsonValue) : null;
      if(!obj){
        obj = [];
        localStorage.setItem("GardenPlanStorage", JSON.stringify([]));
      }

      console.log(obj);
      if(obj){
        setmodalData({
          type: "L",
          selectionData: obj.map(item => item.name || item.id),
          handleClose: () => {
            setmodalData({
              type: null,
              selectionData: null,
              confirmFunction: null,
              open: false
            })
          },
          confirmFunction: (idStr) => {
            const seshArr = localStorage.getItem("GardenPlanStorage");
            let seshData = seshArr != null ? JSON.parse(seshArr) : null;
            let sesh = seshData.find(item => { return item.id === idStr || item.name === idStr })
            if(sesh){
              let temp = {...currentSession};
              temp.id = sesh.id;
              temp.name = sesh.name;
              temp.dateCreated = sesh.dateCreated;
              temp.data = {};
              if(sesh?.data?.coords){
                temp.data.coords = {...sesh.data.coords};
              }
              setPoints(sesh.data.points);
              setMeasurementList(sesh.data.measurementList);
              dispatch(setPlantsInGarden(sesh.data.plantsInGarden));
              dispatch(setAllPlantData({...sesh.data.plants, local: true}));
              dispatch(setCurrentSession({data: temp, storeSession: storeSession}));
            }
            
          },
          open: true
        });
      }
    } catch (e) {
      console.error('Failed to fetch the data from storage', e);
    }
  };

  const handleDeleteMeasurement = () => {
    setMeasurementList(measurementList.filter(item => item.id !== selectedMeasurement.id))
    setSelectedMeasurement(null);
  }
  const handleClearMeasurement = () => {
    let measurement = selectedMeasurement;
    measurement.points = [];
    let list = [...measurementList];
    for(let x = 0; x < list.length; x++){
      if(list[x].id === selectedMeasurement.id){
        list[x] = measurement;
        break;
      }
    }
    setMeasurementList(list)
  }
  const handleAddMeasurement = () => {
    let id = uuidv4();
    let measurement = {
      id: id,
      name: id,
      points: [],
      selectedPointIndex: null,
      lastSelectedPointIndex: null,
      addPoints: true
    };
    let list = [...measurementList, measurement];
    console.log(list)
    setMeasurementList(list)
    setSelectedMeasurement(measurement);
  }


  const handleSvgClick = (e) => {
    e?.stopPropagation();
    console.log("click", )
    if(selectedMeasurement && selectedMeasurement.addPoints && selectedMeasurement.selectedPointIndex === null){

      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
      cursorpt.x /= scale;
      cursorpt.y /= scale;
      

      let pts = [...selectedMeasurement.points];
      pts.splice(selectedMeasurement.lastSelectedPointIndex, 0, { x: cursorpt.x, y: cursorpt.y });
      let measurement = selectedMeasurement;
      measurement.points = [...pts];
      setSelectedMeasurement(measurement);
      let list = [...measurementList];
      for(let x = 0; x < list.length; x++){
        if(list[x].id === selectedMeasurement.id){
          list[x] = measurement
          break;
        }
      }
      setMeasurementList(list);
      return;

    }

    if (isEditing && selectedPointIndex === null){


      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
      cursorpt.x /= scale;
      cursorpt.y /= scale;

      // if(lastSelectedPointIndex && lastSelectedPointIndex < points.length){
      //   const lastPoint = points[lastSelectedPointIndex];
      //   const distance = calculateDistance(cursorpt, lastPoint);
      //   if (distance < 10) {
      //     return;
      //   }
      // }

      let pts = [...points];
      pts.splice(lastSelectedPointIndex, 0, { x: cursorpt.x, y: cursorpt.y });
      setPoints([...pts]);
      
    }else if(selectedPlant ){
      // Get the SVG element from the event or using a ref
      const svg = e.currentTarget; // e.currentTarget;
  
      // Create a point in the SVG's coordinate system
      let pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
  
      // Translate the point to the SVG coordinate system
      let cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
      cursorpt.x /= scale;
      cursorpt.y /= scale;
      console.log("selectedPlant", isInsidePolygon(cursorpt, points));
  
      // Check if the point is inside the garden
      if (selectedPlantIndex === null && isInsidePolygon(cursorpt, points)) {
        let spread = parseAndGenerateNumber(selectedPlant["Crown Spread (m)"]);
        // console.log("handleSvgClick", selectedPlant);
        const newPlant = {
          x: cursorpt.x,
          y: cursorpt.y,
          cropType: selectedPlant["Crop Type"],
          nutrientCalc: selectedPlant["nutrientCalc"],
          latin: selectedPlant["Latin"],
          shadow: selectedPlant["shadow"],
          name: selectedPlant["Name"],
          lifespan: selectedPlant["usrLifespan"]  ||  parseAndGenerateNumber(selectedPlant["Lifespan"]),
          rootDepth: selectedPlant["usrRoot Depth (m)"]  ||  parseAndGenerateNumber(selectedPlant["Root Depth (m)"]),
          crownDia: selectedPlant["usrCrown Spread (m)"] ? parseFloat(selectedPlant["usrCrown Spread (m)"]): parseAndGenerateNumber(selectedPlant["Crown Spread (m)"], 1),
          crownSpread: selectedPlant["usrCrown Spread (m)"] ? calculateCrownSpread(selectedPlant["usrCrown Spread (m)"] , gardenDimensions):  calculateCrownSpread(spread, gardenDimensions),
          height: selectedPlant["usrMax Height"]  ||  selectedPlant["Max Height"],
          sheetIndex: selectedPlant.sheetIndex,
          "Perm Role": selectedPlant["Perm Role"],
          spread: spread,
          rotation: (["Herbaceous", "Vertical", "Rhizosphere", "Ground Cover"].includes(selectedPlant["Perm Role"])) ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 180),
          path:  selectedPlant.path,
          ...selectedPlant,
          id: `${selectedPlant.Latin}#${uuidv4()}`,
        };
      
        dispatch(setPlantsInGarden([...plantsInGarden, newPlant]))
      }
    }

  };

  function isInsidePolygon(point, polygon) {
    if(!polygon)
      return false;

    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      let xi = polygon[i].x, yi = polygon[i].y;
      let xj = polygon[j].x, yj = polygon[j].y;
  
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function parseAndGenerateNumber(input, check = 0) {
    // Check if input contains a range indicated by a hyphen
    if (input.includes('-')) {
      // Split the string into start and end of the range
      const [start, end] = input.split('-').map(item => parseFloat(item));
      if([-1, 1].includes(check)){
        if(check === -1){
          return start;
        }else if(check === 1){
          return end;
        }

      }
      // Generate a random integer within the range
      // return Math.random() * (end - start) + start
      return (end + start) / 2
    } else {
      // If not a range, simply convert the string to an integer
      return parseInt(input, 10);
    }
  }
  

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleMeasurementWidget = (index, e, type, selMeasure = false) => {
    // console.log(index, e, type, selMeasure)
    if(type === "center"){

      let measurement = selectedMeasurement;
      measurement.selectedWidget = "measurementMove"
      setSelectedMeasurement(measurement);
      // console.log(measurement);
      setMeasurementList(list => list.map(item => {
          if(item.id === measurement.id){
              return measurement;
          }else {
              return item;
          }

      }))
    }
  }

  const handlePointMouseDown = (index, e, type, measurement = false, listIndex) => {
    e?.preventDefault();
    // e?.stopPropagation();
    // console.log(`MEasurement ${measurement}`, type, e)
    if(type === "edge"){
      if(!measurement){
        if(e.button === 0){
          setSelectedPointIndex(index);
        }else if(e.button === 2) {
          setPoints(points.filter((_, i) => i !== index));
        }
      }else {
        if(selectedMeasurement){ // 

          if(e.button === 0){
            if(measurementList[listIndex].id === selectedMeasurement.id){
              let measurement = selectedMeasurement;
              // if(measurement.selectedPointIndex !== null){
              //   measurement.lastSelectedPointIndex = measurement.selectedPointIndex;
              // }
              measurement.selectedPointIndex = index;
              // console.log(measurement);
              setMeasurementList(list => list.map(item => {
                  if(item.id === measurement.id){
                      return measurement;
                  }else {
                      return item;
                  }
    
              }))
              // console.log(measurement);
              setSelectedMeasurement(measurement);
            }
          }else if(e.button === 2) {
            if(measurementList[listIndex].id === selectedMeasurement.id){
              let measurement = selectedMeasurement;
              measurement.points = measurement.points.filter((_, i) => i !== index);
              // console.log(measurement, index)
              setMeasurementList(list => list.map(item => {
                  if(item.id === measurement.id){
                      return measurement;
                  }else {
                      return item;
                  }
              }))
              setSelectedMeasurement(measurement);
            }
          }
        }
      }
    }else if(type === "plant"){
      
      if(e.button === 0){
        // check local Edit list

        setLastSelectedPlant(plantsInGarden[index])
        setSelectedPlantIndex(index);
      }else if(e.button === 2) {
        dispatch(setPlantsInGarden(plantsInGarden.filter((_, i) => i !== index)));
      }
    }
  };

  const handleMouseDown = (e) => { 
    if (e.button === 1) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
      setStartViewBox({ ...viewBox });
      e.preventDefault();
    }
  };


  const handleMouseMove = useCallback(
    (e) => {
      if(e.currentTarget.window){
        return
      }
      if (isPanning) {
        const dx = (e.clientX - startPan.x) * (viewBox.width / window.innerWidth);
        const dy = (e.clientY - startPan.y) * (viewBox.height / window.innerHeight);
        setViewBox({
          ...viewBox,
          x: startViewBox.x - dx,
          y: startViewBox.y - dy,
          width: startViewBox.width,
        }); 
      }
      let svg = svgRef.current;
      let pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
      setMousePosition({ x: svgPoint.x, y: svgPoint.y });


      if(selectedMeasurement && selectedMeasurement?.selectedPointIndex !== null  && selectedMeasurement.selectedWidget !== "measurementMove"){

        svg = e.currentTarget;
        // console.log(typeof e.currentTarget, Object.keys(e.currentTarget), e.currentTarget)
        pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
        cursorpt.x /= scale;
        cursorpt.y /= scale;
        let measurement = selectedMeasurement;


        measurement.points = measurement?.points.map((point, index) => {
          if (index === measurement.selectedPointIndex) {
            return { x: cursorpt.x, y: cursorpt.y };
          }
          return point;
        });
        // console.log(measurement);
        setMeasurementList(list => list.map(item => {
            if(item.id === measurement.id){
                return measurement;
            }else {
                return item;
            }

        }))
        setSelectedMeasurement(measurement);
        
      }

      if(selectedMeasurement && selectedMeasurement.selectedWidget === "measurementMove"){

        svg = e.currentTarget;
        // console.log(typeof e.currentTarget, Object.keys(e.currentTarget), e.currentTarget)
        pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
        cursorpt.x /= scale;
        cursorpt.y /= scale;
        let measurement = selectedMeasurement;
        let centerPt = { x: 0, y: 0};
        measurement.points.map((pt) => {
            centerPt.x += pt.x;
            centerPt.y += pt.y;
            return pt
        })
        centerPt.x /= measurement.points.length;
        centerPt.y /= measurement.points.length;
        if(!measurement.initOffset){
          measurement.initOffset = {
            x: cursorpt.x,
            y: cursorpt.y,
          }
        }
        
        const offsetX = cursorpt.x - selectedMeasurement.initOffset.x;
        const offsetY = cursorpt.y - selectedMeasurement.initOffset.y;
  
        measurement.points = measurement?.points.map((point, index) => {
          return { x: point.x + offsetX, y: point.y + offsetY };
        });

        measurement.initOffset = {
          ...measurement.initOffset ,
          x: cursorpt.x,
          y: cursorpt.y,
        }
        // if(!measurement.initOffset){
        //     measurement.initOffset = {
        //         offsetX: cursorpt.x - centerPt.x,
        //         offsetY: cursorpt.y - centerPt.y,
        //     };
        // }
    
        // // Use the constant offset to calculate the new position
        // const { offsetX, offsetY } = measurement.initOffset;
        // measurement.points = measurement.points.map(point => ({
        //     x: point.x + (cursorpt.x - centerPt.x - offsetX),
        //     y: point.y + (cursorpt.y - centerPt.y - offsetY),
        // }));

        // measurement.initOffset = {
        //   ...measurement.initOffset ,
        //   offsetX: cursorpt.x - centerPt.x,
        //   offsetY: cursorpt.y - centerPt.y,
        // }

        
        // console.log(measurement);
        setMeasurementList(list => list.map(item => {
            if(item.id === measurement.id){
                return measurement;
            }else {
                return item;
            }

        }))
        setSelectedMeasurement(measurement);
        
      }



      if (selectedPlantIndex !== null) {
        // Logic for moving the selected plant
        let svg = svgRef.current;
        let pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
        cursorpt.x /= scale;
        cursorpt.y /= scale;
        dispatch(setPlantsInGarden(plantsInGarden.map((plant, index) => {
          if (index === selectedPlantIndex) {
            return { ...plant, x: cursorpt.x, y: cursorpt.y };
          }
          return plant;
        })));
      }

      if (selectedPointIndex !== null) {
        svg = e.currentTarget;
        pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
        cursorpt.x /= scale;
        cursorpt.y /= scale;
        setPoints(points.map((point, index) => {
          if (index === selectedPointIndex) {
            return { x: cursorpt.x, y: cursorpt.y };
          }
          return point;
        }));
      }
    },
    [selectedPointIndex, selectedPlantIndex, points, scale, selectedMeasurement, plantsInGarden, viewBox, isPanning, startPan]
  );


  const setMeasurementColor = (colour) => {
    let measurement = selectedMeasurement;
    if(colour)
      measurement.colour = {...colour, rgbString: `rgba( ${colour.rgb.r}, ${colour.rgb.g}, ${colour.rgb.b}, 0.5)`}
    else 
      measurement.colour = null;
      // console.log(measurement);
    setMeasurementList(list => list.map(item => {
      if(item.id === measurement.id){
          return measurement;
      }else {
          return item;
      }
    }))
    setSelectedMeasurement(measurement);
  }

  const handleMouseUp = () => {
    if(isPanning){

      setTimeout(() => {
        setIsPanning(false);
      }, 5)
    }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

    if (selectedPlantIndex != null && plantsInGarden[selectedPlantIndex]) {
      const selPlant = plantsInGarden[selectedPlantIndex];
      if (!isInsidePolygon({ x: selPlant.x, y: selPlant.y }, points)) {
        dispatch(setPlantsInGarden(plantsInGarden.filter((_, index) => index !== selectedPlantIndex)));
      }
      
      if(selectedPlantIndex !== null){
        setTimeout(() => {
          setSelectedPlantIndex(null);
        }, 5) //delay to prevent placing another point or plant
      }
    }
    if(selectedPointIndex !== null){
      setTimeout(() => {
        setLastSelectedPointIndex(selectedPointIndex);
        setSelectedPointIndex(null);
      }, 5)
    }

    if(selectedMeasurement && selectedMeasurement?.selectedPointIndex !== null && selectedMeasurement.selectedWidget !== "measurementMove" ){
      setTimeout(() => {
        let measurement = selectedMeasurement;
        if(measurement.selectedPointIndex !== null)
          measurement.lastSelectedPointIndex = measurement.selectedPointIndex;


        measurement.selectedPointIndex = null;
        setMeasurementList(list => list.map(item => {
            if(item.id === measurement.id){
                return measurement;
            }else {
                return item;
            }
  
        }))
        setSelectedMeasurement(measurement);
      }, 5)
    }

    if(selectedMeasurement && selectedMeasurement.selectedWidget === "measurementMove" ){
      setTimeout(() => {
        let measurement = selectedMeasurement;
        measurement.selectedWidget = null; 
        measurement.initOffset = null;
 
        let list = [...measurementList];
        for(let x = 0; x < list.length; x++){
          if(list[x].id === selectedMeasurement.id){
            list[x] = measurement;
            break;
          }
        }
        setMeasurementList(list);
        setSelectedMeasurement(measurement);
      }, 5)
    }
  };

  
  function CircleImage({ imageUrl, radius, cx, cy, rotation, role, index, fullOpacity, isLastSelected}) {
    const clipPathId = `clip-circle-${Math.random().toString(36).substr(2, 9)}`;
    const transformOrigin = `${radius}px ${radius}px`;
  
    return (
      <svg width={radius * 2} height={radius * 2} x={cx - radius} y={cy - radius} opacity={(fullOpacity) ? 1 : 0.33} onMouseDown={(e) => handlePointMouseDown(index, e, "plant")}>
        <defs>
          <clipPath id={clipPathId}>
            <circle cx={radius} cy={radius} r={radius} />
          </clipPath>
        </defs>
        {isLastSelected && <circle cx={radius} cy={radius} r={radius} fill='rgba(169, 173, 98, 1)' />}
        <ImageWithFallback
          imageUrl={imageUrl}
          radius={radius}
          clipPath={clipPathId}
          rotation={rotation}
          // style={{
          //   transformOrigin: transformOrigin
          // }}
        />
      </svg>
    );
  }
  function ImageWithFallback({ imageUrl, radius, clipPathId, rotation }) {
    const [hasError, setHasError] = useState(false);
  
    if (hasError) {
      // Render a circle as the fallback
      return (
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          clipPath={`url(#${clipPathId})`}
          transform={`rotate(${rotation},${radius},${radius})`}
          fill="#CCCCCC" 
        />
      );
    }
  
    return (
      <image
        href={imageUrl}
        width={radius * 2}
        height={radius * 2}
        clipPath={`url(#${clipPathId})`}
        transform={`rotate(${rotation},${radius},${radius})`}
        onError={(e) => {
          // console.log("ERR", e)
          setHasError(true)}}
        // style={{
        //   transformOrigin: transformOrigin
        // }}
      />
    );
  }
  

  const renderPlants = ({lastSelectedPlant}) => {
    
    return plantsInGarden.map((plant, index) => {
    // let pathArr = plant.path.split("/")
    let path = plant.path;
    let height = plant.height || null;
    if(height){
      height = parseFloat(height);
    }
    // console.log("Height", height)
    const plantHeight = height;
    let summerSolsticeShadowPolygon = null;
    let winterSolsticeShadowPolygon = null;
    let equinoxShadowPolygon = null;
    let winterEquinoxShadowPolygon = null;
    let isLastSelected = false;
    if(lastSelectedPlant?.id === plant.id)
      isLastSelected = true;
      
    if(selectedPermRole && currentSession?.data?.coords && plant["Perm Role"].includes(selectedPermRole) && showShadows && plant.shadow !== false){
      summerSolsticeShadowPolygon = getShadowMapForDay(plant.x, plant.y, new Date('2022-06-21'), plantHeight, currentSession.data.coords);
      equinoxShadowPolygon = getShadowMapForDay(plant.x, plant.y, new Date('2022-09-22'), plantHeight, currentSession.data.coords);
      // winterEquinoxShadowPolygon = getShadowMapForDay(plant.x, plant.y, new Date('2022-03-20'), plantHeight, currentSession.data.coords);
      winterSolsticeShadowPolygon = getShadowMapForDay(plant.x, plant.y, new Date('2022-12-21'), plantHeight, currentSession.data.coords);
      // console.log("winterSolsticeShadowPolygon", winterSolsticeShadowPolygon);
      // console.log("summerSolsticeShadowPolygon", summerSolsticeShadowPolygon);
      
    }
    return (
      <React.Fragment key={index}>
        <CircleImage imageUrl={path} radius={plant.crownSpread / 2} cx={plant.x} cy={plant.y} rotation={plant.rotation} role={plant["Perm Role"]} fullOpacity={plant["Perm Role"].includes(selectedPermRole)} index={index} isLastSelected={isLastSelected}/>
        {summerSolsticeShadowPolygon && (
          <polygon
            points={summerSolsticeShadowPolygon}
            style={{ fill: 'rgba(80, 0, 0, 0.25)', stroke: 'red', strokeWidth: 3 }}
          />
        )}
        {equinoxShadowPolygon && (
          <polygon
            points={equinoxShadowPolygon}
            style={{ fill: 'rgba(255, 255, 0, 0.1)', stroke: 'yellow', strokeWidth: 3 }}
          />
        )}


        {winterSolsticeShadowPolygon && 
          <polygon 
            points={winterSolsticeShadowPolygon} 
            style={{ fill: 'rgba(0, 0, 80, 0.25)',  stroke: 'blue', strokeWidth: 3 }} 
          />
        }
       
      </React.Fragment>
    )
  })
  };


  function getShadowMapForDay(plantX, plantY, date, plantHeight, location, log = false) {
    let shadowPoints = [];
    const times = SunCalc.getTimes(date, location.lat, location.lon);
  
    // Calculate shadows from sunrise to sunset
    let currentTime = new Date(times.sunrise);
    const endTime = new Date(times.sunset);
    if(log)
      console.log(currentTime, endTime, plantHeight,  location)
  
    while (currentTime <= endTime) {
      const sunPosition = SunCalc.getPosition(currentTime, location.lat, location.lon);
      if(log)
        console.log(sunPosition);
  
      const shadowLength = Math.min(calculateShadowLength(plantHeight, sunPosition.altitude), 15000);
      const adjustedAzimuth = sunPosition.azimuth + Math.PI / 2; //rotate shadow 90 ccw, 
      
      const shadowX = plantX + ((shadowLength ) * Math.cos(adjustedAzimuth) )/ (pixelsPerMeter / 2);
      const shadowY = plantY - ((shadowLength ) * Math.sin(adjustedAzimuth)) / (pixelsPerMeter / 2); 
  
      shadowPoints.push({ x: shadowX, y: shadowY });
  
      currentTime.setHours(currentTime.getHours() + 1);
    }
    if (shadowPoints.length > 0) {
      shadowPoints.push(shadowPoints[0]);
    }
  
    const polygonPointsString = shadowPoints.map(p => `${p.x},${p.y}`).join(' ');
  
    return polygonPointsString;
  }
  
  function calculateShadowLength(plantHeight, sunElevationDeg, ) {
    if (sunElevationDeg <= 0) {
      // The sun is at or below the horizon, no shadow is cast
      return 0;
    }
    const elevationRadians = sunElevationDeg * Math.PI / 180;
    return plantHeight / Math.tan(elevationRadians);
  }



  function calculateDistance(point1, point2) {
    const pxm = pixelsPerMeter;
     
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy) / pxm;
  }

  function calculatePolygonArea(arr) {
    let area = 0;
    const n = arr.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += arr[i].x * arr[j].y;
      area -= arr[j].x * arr[i].y;
    }
    return Math.abs(area / 2);
  }
  

  function calculateGardenDimensions(pts) {
    if (pts.length === 0) {
      return { length: 0, width: 0, lengthP: 0, widthP: 0 };
    }
  
    let minX = pts[0].x;
    let maxX = pts[0].x;
    let minY = pts[0].y;
    let maxY = pts[0].y;
  
    pts.forEach(point => {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    });
  
    const realWorldPerPixel = pixelsPerMeter;
    const length = (maxX - minX) / realWorldPerPixel;
    const width = (maxY - minY) / realWorldPerPixel;
  
    return { length, width, lengthP: (maxX - minX), widthP: (maxY - minY) };
  }
  const calculateCrownSpread = (crownSpread, gardenDimensions) => {
  //calculateDistance(point, nextPoint).toFixed(2)
    // let dimensions = calculateGardenDimensions(points);
    const pxm = pixelsPerMeter; //dimensions.widthP / dimensions.width;
    // console.log(pxm, dimensions.widthP , dimensions.width, dimensions.widthP / dimensions.width);
    
    const crownSpreadInMeters = crownSpread * conversionFactors[gardenDimensions.unit];
    const crownSpreadInPixels = crownSpreadInMeters * pxm;
    // console.log(crownSpreadInMeters, crownSpreadInPixels);
  
    return crownSpreadInPixels;
  };
  


  const handleAddRemovePoints = () => {
    console.log("handleAddRemovePoints");
    let measurement = selectedMeasurement;
    measurement.addPoints = !measurement.addPoints;
    // console.log(measurement);
    setMeasurementList(list => list.map(item => {
        if(item.id === measurement.id){
            return measurement;
        }else {
            return item;
        }

    }))
    setSelectedMeasurement(measurement);
  };


  const textX = 10; // Start text close to the top-left corner
  const lineHeight = 20; 
  const areaInPixels = calculatePolygonArea(points);

  const baseFontSize = 8; // Base font size in pixels
  const baseEdgeVertSize = 5;
  const baseStrokeSize = 2;
  const textOffset = 180;
  let adjustedFontSize = Math.max(baseFontSize / (scale), (1/scale) * 10);
  let adjustedEdgeVertSize = Math.min(baseEdgeVertSize / (scale*scale), 20);
  let adjustedStrokeSize = baseStrokeSize / (scale);

  // 10 px per m , 10x 10 per m2 
  const areaInDesiredUnit = (areaInPixels / (pixelsPerMeter * pixelsPerMeter) ) * (conversionFactors[gardenDimensions.unit] * conversionFactors[gardenDimensions.unit]); // Squared for area
  if(areaStr !== `Area: ${areaInDesiredUnit.toFixed(2)} sq ${gardenDimensions.unit}`){
    setAreaStr(`Area: ${areaInDesiredUnit.toFixed(2)} sq ${gardenDimensions.unit}`)
  }
  const { primaryLines, secondaryLines } = calculateGridLines(viewBox);
  function calculateStrokeWidth(scale) {
    if (scale === 1) {
        return 2; // Base stroke width at scale 1
    } else if (scale > 1) {
        // For scales greater than 1, divide stroke width by nearest power of 2
        const power = Math.floor(Math.log2(scale));
        return 2 / Math.pow(2, power);
    } else {
        // For scales less than 1, multiply stroke width by nearest power of 2
        let power = 0;
        while (1 / Math.pow(2, power) > scale) {
            power++;
        }
        return 2 * Math.pow(2, power - 1);
    }
}
  let primaryInterval, secondaryInterval;

  if (scale < 1) {
    // Find the power of 2 for scales less than 1
    let power = 0;
    while (1 / Math.pow(2, power) > scale) {
      power++;
    }
    primaryInterval = 10 * pixelsPerMeter * Math.pow(2, power - 1); // 10m at 1/(2^power)
    secondaryInterval = 1 * pixelsPerMeter * Math.pow(2, power - 1); // 1m at 1/(2^power)
  } else {
    // For scales of 1 and above, the interval decreases as the scale increases
    // Find the nearest power of 2 that is less than or equal to the scale
    const power = Math.floor(Math.log2(scale));
    primaryInterval = 10 * pixelsPerMeter / Math.pow(2, power); // 10m interval at scale 1
    secondaryInterval = 1 * pixelsPerMeter / Math.pow(2, power); // 1m interval at scale 1
  
  }
  if(primaryInterval > 0)
    primaryInterval /= 10;

  if(secondaryInterval > 0)
    secondaryInterval /= 10;
  const tickStyle = {
    height: '10px',
    borderLeft: '1px solid black',
    marginBottom: '4px',
  }; 


  const PlotCardDetails = ({selectedMeasurement, conversionFactors, gardenDimensions, calculatePolygonArea, handleAddRemovePoints, handleClearMeasurement, handleDeleteMeasurement,setSelectedMeasurement, isInsidePolygon, plantsInGarden, plantMacros}) => {
    const [nutrientReq, setNutrientReq] = useState({ kReq: 0, nReq: 0 });

    const [open, setOpen] = useState(false);
    const [colour, setColour] = useState(null);
    const [showColourPicker, setShowColourPicker] = useState(false);
    const [newName, setNewName] = useState('');


    // useEffect(() => {
    //   // console.log("ONMOUNT")
    //   nutrientAnalysis();
    // }, [selectedMeasurement?.points, plantsInGarden])

    useLayoutEffect(() => {
      nutrientAnalysis();
      
    }, [])

    function truncateString(str, num) {
      if (str.length > num) {
        return str.slice(0, num) + "...";
      } else {
        return str;
      }
    }
    function nutrientAnalysis() {

      if(selectedMeasurement?.points.length > 0 && plantsInGarden.length > 0){
        let plantList = []
        console.log("nutrient calc")
        for(let x = 0; x < plantsInGarden?.length; x++){
          let plant = plantsInGarden[x];
          if(isInsidePolygon({ x: plant.x, y: plant.y }, selectedMeasurement?.points)){
            plantList.push(plant);
          }
        }


        let analysisData = {
          kReq: 0,
          nReq: 0
        };
      // console.log("plantsInGarden Change");
        if(plantMacros){
          // console.log("plantMacros", plantMacros);
          for(let  x = 0; x < plantList.length; x++){
            let plant = plantList[x];
            if(plant.nutrientCalc !== null && plant.nutrientCalc === false){
              continue;
            }
            let crownArea = Math.PI * (Math.pow( plant.crownDia , 2));
            let macro = plantMacros?.plantMacroRequirements[plant.cropType];
            // console.log(macro, plant)
            if(macro?.nReq){
              let nLoad = crownArea * parseFloat(macro.nReq);
              analysisData.nReq += nLoad;
            }
            if(macro?.kReq){
              let kLoad = crownArea * parseFloat(macro.kReq);
              analysisData.kReq += kLoad;
            }
            setNutrientReq(analysisData);
            // console.log(analysisData)
          }
        }
        //isInsidePolygon({ x: selPlant.x, y: selPlant.y }, points)
      }
    }
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleConfirm = () => {
      let measurement = selectedMeasurement;
      measurement.name = newName;
      // console.log(measurement);
      setMeasurementList(list => list.map(item => {
          if(item.id === measurement.id){
              return measurement;
          }else {
              return item;
          }
  
      }))
      setSelectedMeasurement(measurement);
      handleClose();
    };
  
    
    return (
      <Box sx={{ 
        // pointerEvents: 'none',
        position: 'fixed', 
        left: '80vw',
        top: '56vh', 
      }}> 
       {/* <Button sx={{ pointerEvents: 'auto' }}>I am clickable</Button> */}

      <Card variant="outlined" sx={{ width: '20vw',height: '35vh'}}>
        <CardContent>
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'  }}>
              <IconButton fontSize='small' onClick={() => {setSelectedMeasurement(null)}} color="success">
                <CloseIcon />
              </IconButton>

          </Box>
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'  }}> 
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Plot Details
            </Typography> 

          </Box>
          {/* {selectedMeasurement?.id && <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
            {selectedMeasurement?.id }
          </Typography>} */}
          
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}> 
            {selectedMeasurement?.name &&  <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
            {truncateString(selectedMeasurement?.name, 15) }
          </Typography>}

              <IconButton onClick={() => handleOpen(true)} color="success">
                <DriveFileRenameOutlineIcon />
              </IconButton>
          </Box> 
 
        {nutrientReq && (nutrientReq.nReq.toFixed(2) !== "0.00" || nutrientReq.kReq.toFixed(2) !== "0.00") && <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <Typography>{`N: ${nutrientReq.nReq.toFixed(2)}g `}</Typography>  
          <Typography>{` K: ${nutrientReq.kReq.toFixed(2)}g`}</Typography>  
          
        </Box>} 
          {/* {console.log(selectedMeasurement)} */} 
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}> 
            {selectedMeasurement?.colour?.rgbString &&
              <Box sx={{ marginLeft: `1vw`, width: '5vw', height: 20,  backgroundColor: selectedMeasurement.colour.rgbString, border: '1px solid black'}}> </Box>}

              <IconButton onClick={() => setShowColourPicker(true)} color="success">
                <ColorLensIcon />
              </IconButton>
          </Box> 

          {selectedMeasurement?.points.length > 2 && <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <Typography sx={{ fontSize: 14 }} color="text.secondary">
              {` ${((calculatePolygonArea(selectedMeasurement.points) / (pixelsPerMeter * pixelsPerMeter) ) * (conversionFactors[gardenDimensions.unit] * conversionFactors[gardenDimensions.unit])).toFixed(2)} sq ${gardenDimensions.unit}`}
            </Typography>
          </Box>}
        </CardContent>
        <CardActions>
          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
            <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
              <Button size="small" onClick={handleAddRemovePoints}>{selectedMeasurement.addPoints ? 'Stop Adding' : 'Add Points'}</Button>
              <Button size="small" onClick={handleClearMeasurement}>Clear</Button>
            </Box> 
            {/* <Box sx={{display: 'flex', flexDirection: 'row'}}>
              <Button size="small" onClick={nutrientAnalysis}>Analyse Nutrients</Button>
            </Box> */}
            <Box sx={{display: 'flex', flexDirection: 'row'}}>
              <Button size="small" onClick={handleDeleteMeasurement}>Delete Plot</Button>
            </Box>
          </Box>
        </CardActions>
          
        </Card>

        <Modal
          open={showColourPicker}
          onClose={()=> setShowColourPicker(false)}
          aria-labelledby="colour-modal"
          aria-describedby="colour-modal-description"
        >
          <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
          }}>
            <SwatchesPicker onChangeComplete={(color) =>{setColour(color)}}/>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={()=> {
                  setColour(null);
                  setMeasurementColor(null);
                  setShowColourPicker(false);
                }}>Cancel</Button>
              <Button onClick={()=> {
                  setMeasurementColor(colour);
                  setShowColourPicker(false);
                }} sx={{ ml: 1 }}>Confirm</Button>
            </Box>
          </Box>
        </Modal>

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="rename-modal"
          aria-describedby="rename-modal-description"
          sx={{zIndex: 100000}}
        >
          <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
          }}>
            <Typography id="rename-modal" variant="h6" component="h2">
              Enter Measurement Plot Name
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="New Name"
              type="text"
              fullWidth
              variant="standard"
              value={newName}
              onChange={(e) => {
                e.stopPropagation();
                setNewName(e.target.value);
                e.preventDefault();
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConfirm} sx={{ ml: 1 }}>Confirm</Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    )
  }

  const PlantCardDetails = ({selectedPlant, plantsInGarden}) => {
    const [open, setOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [crownSpread, setCrownSpread] = useState('');
    const [height, setHeight] = useState('');

    useEffect(() => {
      setCrownSpread(selectedPlant?.crownDia || '');
      setHeight(selectedPlant?.height || '');
      setNewName(selectedPlant?.nickname || '');
    }, [selectedPlant]);

    function validOrClose() {
      let found = plantsInGarden.find(item => selectedPlant.id === item.id)
      if(!found)
        setLastSelectedPlant(null);
    }
    // console.log(selectedPlant);

    function truncateString(str, num) {
      if (str.length > num) {
        return str.slice(0, num) + "...";
      } else {
        return str;
      }
    }
    const handleConfirm = () => {
      validOrClose();
      let plant = {...selectedPlant};
      plant.nickname = newName;
      // console.log(measurement);

      const newPlantsInGarden = plantsInGarden.map(item => {
          if(item.id === plant.id){
              return plant;
          }else {
              return item;
          }

      });
      dispatch(setPlantsInGarden(newPlantsInGarden));
      setLastSelectedPlant(plant);
      handleClose();
    }; 

    const saveCrownSpread = (crownSpread) => {
      validOrClose();
      let plant = {...selectedPlant};
      plant.crownSpread = calculateCrownSpread(crownSpread, gardenDimensions);
      plant.crownDia = crownSpread;
      console.log(crownSpread);

      const newPlantsInGarden = plantsInGarden.map(item => {
          if(item.id === plant.id){
              return plant;
          }else {
              return item;
          }

      });
      dispatch(setPlantsInGarden(newPlantsInGarden));
      setLastSelectedPlant(plant);
    }

    const saveHeight = (height) => {
      validOrClose();
      let plant = {...selectedPlant};
      plant.height = height;
      // console.log(measurement);

      const newPlantsInGarden = plantsInGarden.map(item => {
          if(item.id === plant.id){
              return plant;
          }else {
              return item;
          }

      });
      dispatch(setPlantsInGarden(newPlantsInGarden));
      setLastSelectedPlant(plant);
    }
    
    let floatRegex = /^-?\d+(\.\d*)?$/;
    return (
      <Box sx={{ 
        // pointerEvents: 'none',
        position: 'fixed', 
        left: '0vw',
        top: '40vh', 
      }}> 
       {/* <Button sx={{ pointerEvents: 'auto' }}>I am clickable</Button> */}

      <Card variant="outlined" sx={{ width: '20vw',height: '40vh', overflowY: 'scroll',}}>
        <CardContent>
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'  }}>
              <IconButton fontSize='small' onClick={() => {setLastSelectedPlant(null)}} color="success">
                <CloseIcon />
              </IconButton>

          </Box>
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'  }}> 
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
             {` ${selectedPlant?.latin|| ""}`}
            </Typography> 

          </Box>
          
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}> 
              {selectedPlant?.name &&  <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              {truncateString(selectedPlant?.name, 15) }
            </Typography>}
          </Box> 
          
          
          <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}> 
              {selectedPlant?.nickname &&  <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              {truncateString(selectedPlant?.nickname, 15) }
            </Typography>}

            <IconButton onClick={() => {validOrClose(); handleOpen(true)}} color="success">
              <DriveFileRenameOutlineIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
            <TextField
              label="Crown Spread (m)"
              variant="outlined"
              value={crownSpread}
              onChange={(e) => {
                if((floatRegex.test(e.target.value)))
                setCrownSpread(e.target.value)}}
              inputProps={{
                onBlur: () => {
                    saveCrownSpread(crownSpread);
                }
             }}
            />
            <TextField
              label="Height (m)"
              variant="outlined"
              value={height}
              onChange={(e) => {
                
                if((floatRegex.test(e.target.value)))
                setHeight(e.target.value)}} 
              inputProps={{
                onBlur: () => {
                  saveHeight(height)
                },  
              }
            }
            />
          </Box> 
          
        </CardContent>
        <CardActions>
          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
            
            <Box sx={{display: 'flex', flexDirection: 'row'}}>
              <Button size="small" onClick={() => {
                validOrClose(); 
                dispatch(setPlantsInGarden(plantsInGarden.filter((plant, i) => plant.id !== selectedPlant.id)))
              }}>Delete Plant</Button>
            </Box>
          </Box>
        </CardActions>
          
      </Card>

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="rename-modal"
          aria-describedby="rename-modal-description"
          sx={{zIndex: 100000}}
        >
          <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
          }}>
            <Typography id="rename-modal" variant="h6" component="h2">
              Enter Plant Nickname
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="New Nickname"
              type="text"
              fullWidth
              variant="standard"
              value={newName}
              onChange={(e) => {
                e.stopPropagation();
                setNewName(e.target.value);
                e.preventDefault();
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConfirm} sx={{ ml: 1 }}>Confirm</Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    )
  }


  return (
    <div style={{ position: 'relative', height: '100%'  }}onContextMenu={handleContextMenu}>
      <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', height: '100%'  }}>
        <svg width="100%" height="120" style={{ overflow: 'visible' }}>

          {/* <text x={'1vw'} y={'13vh'} fontWeight="bold">
            {`Area: ${areaInDesiredUnit.toFixed(2)} sq ${gardenDimensions.unit}`}
          </text> */}
          {/* <text x={textX} y={textOffset + lineHeight} fontWeight="bold">
            {`W x L: ${(calculateGardenDimensions(points).width * conversionFactors[gardenDimensions.unit]).toFixed(2)}${gardenDimensions.unit || ""} X ${(calculateGardenDimensions(points).length * conversionFactors[gardenDimensions.unit]).toFixed(2)}${gardenDimensions.unit || ""}`}
          </text>
          <text x={textX} y={textOffset + lineHeight * 2} fontWeight="bold">
            {`X, Y: ${mousePosition.x.toFixed(2)}, ${mousePosition.y.toFixed(2)}`}
          </text>
          <text x={textX} y={textOffset + lineHeight * 3} fontWeight="bold">
            {`Scale: ${scale}`}
          </text>
          <text x={textX} y={textOffset + lineHeight * 4} fontWeight="bold">
            {`# Plants: ${plantsInGarden.length}`}
          </text>
          <text x={textX} y={textOffset + lineHeight * 5} fontWeight="bold">
            {`Area: ${areaInDesiredUnit.toFixed(2)} sq ${gardenDimensions.unit}`}
          </text> */}

          <Modal 
          open={openHeightMap}
          onClose={() => {}}
          style={{
            position: 'absolute',
            top: '12%',
            left: '74%',
            height: '20vh',
            transform: 'translate(0, 0)',
            bgcolor: 'background.paper',
            overflowY: 'scroll'}}
          disableEnforceFocus
          slotProps={{backdrop: {
            style: {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }
          }}} 
          >
            <Map
              mapboxAccessToken={mapAccessToken}
              mapLib={import('mapbox-gl')}
              initialViewState={{
                longitude: currentSession?.data?.coords?.lon,
                latitude: currentSession?.data?.coords?.lat,
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
            </Map>
          </Modal>
          
          
        </svg>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ border: '1px solid black', cursor: /*isEditing ? 'crosshair' : */'default', backgroundColor: 'rgba(127, 127, 127, 0.5)',  }}
        onClick={handleSvgClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
      >
        
      <g transform={`scale(${scale})`}>

        {points.length > 0 && (
          <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} style={{ fill: 'limegreen', stroke: 'green', strokeWidth: 1 }} />
        )}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={adjustedEdgeVertSize}
            zIndex={100}
            fill={index === lastSelectedPointIndex ? "rgba(127, 0, 0, 0.5)" : "rgba(0, 0, 127, 0.5)"}
            stroke="black"
            strokeWidth={adjustedStrokeSize}
            onMouseDown={(e) => handlePointMouseDown(index, e, "edge")}
            // onDoubleClick={() => handlePointDoubleClick(index)}
            style={{ cursor: 'pointer' }}
          />
        ))}
        {points.map((point, index) => {
          const nextPoint = points[index + 1] || points[0];  
          const distance = (calculateDistance(point, nextPoint).toFixed(2) * conversionFactors[gardenDimensions.unit]).toFixed(1); // Adjust decimal places as needed

          // Calculate midpoint for text placement
          const midX = (point.x + nextPoint.x) / 2;
          const midY = (point.y + nextPoint.y) / 2;

          return (
            <g key={index}>
              <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y} /* ...other line properties... */ />
              <text x={midX} y={midY} style={{ fontSize: `${adjustedFontSize}px` }}>
                {distance}
              </text>
            </g>
          );
        })}
        {lastSelectedPointIndex != null  && lastSelectedPointIndex < points.length && (
          <line
            x1={points[lastSelectedPointIndex].x}
            y1={points[lastSelectedPointIndex].y}
            x2={points[lastSelectedPointIndex !== 0 ? lastSelectedPointIndex - 1 : points.length - 1].x}
            y2={points[lastSelectedPointIndex !== 0 ? lastSelectedPointIndex - 1 : points.length - 1].y}
            style={{ stroke: 'yellow', strokeWidth: adjustedStrokeSize }}
          />
        )} 
        <MeasurementList 
        setSelectedMeasurement={setSelectedMeasurement}
        measurementList={measurementList}
        adjustedEdgeVertSize={adjustedEdgeVertSize}
        adjustedStrokeSize={adjustedStrokeSize}
        handlePointMouseDown={handlePointMouseDown}
        selectedMeasurement={selectedMeasurement}
        conversionFactors={conversionFactors}
        gardenDimensions={gardenDimensions}
        calculateDistance={calculateDistance}
        adjustedFontSize={adjustedFontSize}
        widgetWidth={secondaryLines.length > 0 ? Math.abs(secondaryLines[0].x1 - secondaryLines[1].x1) : 0}
        handleMeasurementWidget={handleMeasurementWidget}
        />
        
        {useMemo(() => renderPlants({lastSelectedPlant}), [lastSelectedPlant, plantsInGarden, showShadows, selectedPermRole, selectedPlant])}
        {/* {renderPlants()} */}

        {primaryLines.map((line, index) => (
          <line key={`primary-${index}`} style ={{opacity: '25%'}} {...line} stroke="black" strokeWidth={calculateStrokeWidth(scale)/ 2} />
        ))}
        {secondaryLines.map((line, index) => (
          <line key={`secondary-${index}`} style ={{opacity: '25%'}} {...line} stroke="gray" strokeWidth={calculateStrokeWidth(scale) / 4}/>
        ))}
        </g>
      </svg>
      <div style={{
      position: 'absolute', // or 'fixed' if you want it to stay in place on scroll
      bottom: '120px', // Adjust the value as needed
      marginBottom: '200px',
      display: 'flex',
      justifyContent: 'center'
    }}>
    {primaryLines && primaryLines.length > 0 && <Box style={{ position: 'fixed', bottom: '11vh', left: 0, right: 0, height: '8vh', width: '20vh' }}>
      <Box style={{display: 'flex', flexDirection: 'row', width: 40}}>
        <IconButton style={{backgroundColor: '#8df48b', border: '1px solid #000'}} onClick={() => handleZoom(1)} color="success">
          <ZoomInIcon />
        </IconButton>
        <IconButton style={{backgroundColor: '#8df48b', border: '1px solid #000'}} onClick={() => handleZoom(-1)}  color="secondary">
          <ZoomOutIcon />
        </IconButton>

      </Box>
      <Box style={{backgroundColor: '#fff', border: '1px solid #000'}}>
        <Box style={{width: '100%',justifyContent: 'space-between', display: 'flex'}}>
          <Typography variant="caption" >
            {`0m`}
          </Typography> 
          <Typography variant="caption"  >
          {`${secondaryInterval * 5}m`}
          </Typography> 
          <Typography variant="caption"  >
          {`${primaryInterval}m`}
          </Typography> 
        </Box>
        <Box sx={{ height: '2px', backgroundColor: 'black', width: '100%' }} />

          <Box style={{width: '100%',justifyContent: 'space-between', display: 'flex'}}>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ ...tickStyle, borderLeft: '4px solid black', height: '20px', position: 'absolute', left: 0 }} />
              </Box>

              
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>


              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>


              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>
              <Box item xs={4} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ ...tickStyle}} />
              </Box>


              <Box item xs={4} sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Box sx={{ ...tickStyle, borderLeft: '4px solid black', height: '20px', position: 'absolute', right: 0 }} />
                {/* <Typography variant="caption" sx={{ ...labelStyle, position: 'absolute', right: 0 }}>
                  {`${primaryInterval}m`}
                </Typography> */}
              </Box>

          </Box> 
      </Box>
    </Box>}
    {/* PlotCardDetails = ({selectedMeasurement, conversionFactors, gardenDimensions, calculatePolygonArea, handleAddRemovePoints, handleClearMeasurement, handleDeleteMeasurement,setSelectedMeasurement}) */}
   
    {lastSelectedPlant && <PlantCardDetails selectedPlant={lastSelectedPlant} plantsInGarden={plantsInGarden}/>}
    {selectedMeasurement && <PlotCardDetails 
      plantMacros={plantMacros}
      plantsInGarden={plantsInGarden}
      isInsidePolygon={isInsidePolygon}
      selectedMeasurement={selectedMeasurement}
      conversionFactors={conversionFactors}
      gardenDimensions={gardenDimensions}
      calculatePolygonArea={calculatePolygonArea}
      handleAddRemovePoints={handleAddRemovePoints}
      handleClearMeasurement={handleClearMeasurement}
      handleDeleteMeasurement={handleDeleteMeasurement}
      setSelectedMeasurement={setSelectedMeasurement} 
    />}
        
    <FloatingToolbar 
    setLocation={(coords) => {
      let sesh = JSON.parse(JSON.stringify(currentSession))
      sesh.data.coords = {lat: coords.lat, lon: coords.lon};
      dispatch(setCurrentSession({data: sesh, storeSession: storeSession}))
      // curSesh.data.coords = {lat: coords.lat, lon: coords.lon};
      // storeSession();
    }}
    showShadows={showShadows}
    setShowShadows={setShowShadows}
    session={currentSession}
    measurementList={measurementList} 
    selectedMeasurement={selectedMeasurement} 
    handleDeleteMeasurement={handleDeleteMeasurement} 
    handleClearMeasurement={handleClearMeasurement} 
    handleAddMeasurement={handleAddMeasurement}
    setSelectedMeasurement={setSelectedMeasurement}
    setMeasurementList={setMeasurementList}
    gardenDimensions={gardenDimensions}
    retrieveData={retrieveData}
    handleDownload={loadData}
    storeData={storeData}
    clear={clearData}
    clearPlantData={clearPlantData}
    setMeasurementColor={setMeasurementColor}
    calcArea={()=>{
      return selectedMeasurement !== null ?  (calculatePolygonArea(selectedMeasurement.points) / (pixelsPerMeter * pixelsPerMeter) ) * (conversionFactors[gardenDimensions.unit] * conversionFactors[gardenDimensions.unit]) : null
    }}
    />
    
    </div>
    
    <SaveLoadModal modalData={modalData} session={currentSession} retrieveData={retrieveData}/>
  </div>
  );
};

export default Garden;

