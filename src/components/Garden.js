import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch, useSelector } from 'react-redux';
import FloatingToolbar from './FloatingToolbar';
import { setAllPlantData } from '../redux/gardenSlice'; // Import setPlantData
import SaveLoadModal from "./SaveLoadModal"


    
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
var curSesh = {};
const Garden = ({ isEditing, clearGarden, gardenDimensions }) => {
  const dispatch = useDispatch();
  const [modalData, setmodalData] = useState({
    type: null,
    selectionData: null,
    confirmFunction: null,
    open: false
  });
  const [measurementList, setMeasurementList] = useState([]);
  const [points, setPoints] = useState([]);
  const [plantsInGarden, setPlantsInGarden] = useState([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [lastSelectedPointIndex, setLastSelectedPointIndex] = useState(null);
  const [selectedPlantIndex, setSelectedPlantIndex] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [startViewBox, setStartViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 }); // Default values
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 1000 });
  const [scale, setScale] = useState(1);
  const { permRoles, selectedPlants, selectedPlant, selectedPermRole, plants } = useSelector(state => state.garden); 
  const svgRef = useRef();
  useEffect(() => {
    setPoints([]);
    setSelectedPointIndex(null);
    setLastSelectedPointIndex(null);
    setPlantsInGarden([]);
  }, [clearGarden])
  
  useEffect(() => {
    const newPlantsInGarden = plantsInGarden.filter(plant => isInsidePolygon({ x: plant.x, y: plant.y }, points));
    setPlantsInGarden(newPlantsInGarden);
  }, [points]);
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);


  const handleZoom = useCallback((delta) => {
    const scaleFactor = (delta > 0 ? 1.1 : 1 / 1.1);
  
    setScale(prevScale => {
      const newScale = Math.max(prevScale * scaleFactor, 0.1);
  
      // Assuming you have a state or a ref for your SVG's current viewBox
      const { x, y, width, height } = viewBox; 
  
      // Calculate the new width and height based on the scale
      const newWidth = width / scaleFactor;
      const newHeight = height / scaleFactor;
  
      // Calculate the new x and y to keep the center the same
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;
  
      // Update the viewBox state or ref here
      setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  
      return newScale.toFixed(3);
    });
  }, [setScale, viewBox, setViewBox]);

  const handleKeyPress = useCallback((e) => {
    const step = 10;
    let newX = parseFloat(svgRef.current.viewBox.baseVal.x);
    let newY = parseFloat(svgRef.current.viewBox.baseVal.y);
    switch(e.key) {
      case '+':
      case '=': // Zoom in
        handleZoom(1, mousePosition);
        break;
      case '_':
      case '-': // Zoom out
        handleZoom(-1, mousePosition);
        break;
        case ' ': // Zoom out
          setScale(1);
          svgRef.current.setAttribute('viewBox', `${0} ${0} ${1000} ${1000}`);
          setViewBox({ x: 0, y: 0, width: 1000, height: 1000 });
          break;
      default:
        return; // Ignore other keys
    }

    // Update the viewBox state to re-render the SVG
    setViewBox({ ...viewBox, x: newX, y: newY });
  }, [handleZoom, mousePosition, viewBox]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const clearData = () => {
    if(curSesh && curSesh.id){
      const seshArr = localStorage.getItem("GardenPlanStorage");
      let seshData = seshArr != null ? JSON.parse(seshArr) : [];

      let seshIndex = seshData.findIndex(item => item.id === curSesh.id)
      if(seshIndex !== -1){
        localStorage.setItem("GardenPlanStorage", JSON.stringify(seshData.filter(item => item.id !== curSesh.id)));

      }
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
            let seshData = seshArr != null ? JSON.parse(seshArr) : null;
            let sesh = seshData.find(item => { return item.id === idStr || item.name === idStr })
            if(sesh){
              sesh.dateModified = new Date();
              let index = seshData.findIndex(item => { return item.id === idStr || item.name === idStr });
              if(reName)
              sesh.name = idStr;
              sesh.data = {
                measurementList: measurementList,
                points: points,
                plantsInGarden: plantsInGarden,
                plants: plants,
              }
              seshData[index] = sesh;
              const jsonValue = JSON.stringify(seshData);
              localStorage.setItem("GardenPlanStorage", jsonValue);
            }else {

              let currentSession = {
                id: uuidv4(),
                name: idStr || curSesh?.name || null,
                dateCreated: curSesh?.dateCreated || new Date(),
                dateModified: new Date(),
                data: {
                  measurementList: measurementList,
                  points: points,
                  plantsInGarden: plantsInGarden,
                  plants: plants,
                }
              }
              seshData.push(currentSession);
              const jsonValue = JSON.stringify(seshData);
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
  
  // Function to retrieve data
  const retrieveData = () => {
    try {
      const jsonValue = localStorage.getItem("GardenPlanStorage");
      let obj = jsonValue != null ? JSON.parse(jsonValue) : null;
      
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
              curSesh.id = sesh.id;
              curSesh.name = sesh.name;
              curSesh.dateCreated = sesh.dateCreated;
              setPoints(sesh.data.points);
              setMeasurementList(sesh.data.measurementList);
              setPlantsInGarden(sesh.data.plantsInGarden);
              dispatch(setAllPlantData({...sesh.data.plants, local: true}));
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
        const newPlant = {
          id: `${selectedPlant.Latin}#${uuidv4()}`,
          x: cursorpt.x,
          y: cursorpt.y,
          lifespan: selectedPlant["usrLifespan"]  ||  parseAndGenerateNumber(selectedPlant["Lifespan"]),
          rootDepth: selectedPlant["usrRoot Depth (m)"]  ||  parseAndGenerateNumber(selectedPlant["Root Depth (m)"]),
          crownSpread: selectedPlant["usrCrown Spread (m)"] ? calculateCrownSpread(selectedPlant["usrCrown Spread (m)"] , gardenDimensions):  calculateCrownSpread(spread, gardenDimensions),
          height: selectedPlant["usrMax Height"]  ||  selectedPlant["Max Height"],
          sheetIndex: selectedPlant.sheetIndex,
          "Perm Role": selectedPlant["Perm Role"],
          spread: spread,
          rotation: (["Herbaceous", "Vertical", "Rhizosphere", "Ground Cover"].includes(selectedPlant["Perm Role"])) ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 180),
          path:  selectedPlant.path
          // ...selectedPlant
        };
      
        setPlantsInGarden([...plantsInGarden, newPlant])
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

  function parseAndGenerateNumber(input) {
    // Check if input contains a range indicated by a hyphen
    if (input.includes('-')) {
      // Split the string into start and end of the range
      const [start, end] = input.split('-').map(item => parseFloat(item));
      // Generate a random integer within the range
      return Math.random() * (end - start) + start
    } else {
      // If not a range, simply convert the string to an integer
      return parseInt(input, 10);
    }
  }
  

  const handleContextMenu = (e) => {
    e.preventDefault();
  };
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
        setSelectedPlantIndex(index);
      }else if(e.button === 2) {
        setPlantsInGarden(plantsInGarden.filter((_, i) => i !== index));
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
          x: startViewBox.x - dx,
          y: startViewBox.y - dy,
          width: startViewBox.width,
          height: startViewBox.height
        });
        // setViewBox({
        //   ...viewBox,
        //   x: startPan.x - e.clientX,
        //   y: startPan.y - e.clientY
        // });
      }
      let svg = svgRef.current;
      let pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
      setMousePosition({ x: svgPoint.x, y: svgPoint.y });


      if(selectedMeasurement && selectedMeasurement?.selectedPointIndex !== null){

        svg = e.currentTarget;
        // console.log(typeof e.currentTarget, Object.keys(e.currentTarget), e.currentTarget)
        pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
        cursorpt.x /= scale;
        cursorpt.y /= scale;


        let measurement = selectedMeasurement;
        // console.log(selectedMeasurement);
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



      if (selectedPlantIndex !== null) {
        // Logic for moving the selected plant
        let svg = svgRef.current;
        let pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
        cursorpt.x /= scale;
        cursorpt.y /= scale;

        setPlantsInGarden(plantsInGarden.map((plant, index) => {
          if (index === selectedPlantIndex) {
            return { ...plant, x: cursorpt.x, y: cursorpt.y };
          }
          return plant;
        }));
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
    [selectedPointIndex, selectedPlantIndex, points, scale, plantsInGarden, viewBox, isPanning, startPan]
  );

  const handleMouseUp = () => {
    if(isPanning){

      setTimeout(() => {
        setIsPanning(false);
      }, 5)
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    if (selectedPlantIndex != null && plantsInGarden[selectedPlantIndex]) {
      const selPlant = plantsInGarden[selectedPlantIndex];
      if (!isInsidePolygon({ x: selPlant.x, y: selPlant.y }, points)) {
        setPlantsInGarden(plantsInGarden.filter((_, index) => index !== selectedPlantIndex));
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

    if(selectedMeasurement && selectedMeasurement?.selectedPointIndex !== null){
      setTimeout(() => {
        let measurement = selectedMeasurement;
        if(measurement.selectedPointIndex !== null)
          measurement.lastSelectedPointIndex = measurement.selectedPointIndex;


        measurement.selectedPointIndex = null;
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

  
    function CircleImage({ imageUrl, radius, cx, cy, rotation, role, index}) {
      const clipPathId = `clip-circle-${Math.random().toString(36).substr(2, 9)}`;
      const transformOrigin = `${radius}px ${radius}px`;
    
      return (
        <svg width={radius * 2} height={radius * 2} x={cx - radius} y={cy - radius} visibility={(role && role.includes(selectedPermRole)) ? "visible" : "hidden"} onMouseDown={(e) => handlePointMouseDown(index, e, "plant")}>
          <defs>
            <clipPath id={clipPathId}>
              <circle cx={radius} cy={radius} r={radius} />
            </clipPath>
          </defs>
          <image
            href={imageUrl}
            width={radius * 2}
            height={radius * 2}
            clipPath={`url(#${clipPathId})`}
            transform={`rotate(${rotation},${radius},${radius})`}
            // style={{
            //   transformOrigin: transformOrigin
            // }}
          />
        </svg>
      );
    }

  const renderPlants = () => {
    //https://drive.google.com/file/d/1FQwtHBBFHOaGoQrrWSG9k9ddTHFVND-5/view?usp=sharing 
    //https://drive.google.com/uc?id=1FQwtHBBFHOaGoQrrWSG9k9ddTHFVND-5
    return plantsInGarden.map((plant, index) => {
    let pathArr = plant.path.split("/")
    let path = `https://drive.google.com/uc?id=${pathArr[pathArr.length - 2]}`;
      
      
    return (
      <CircleImage imageUrl={path} radius={plant.crownSpread / 2} cx={plant.x} cy={plant.y} rotation={plant.rotation} role={plant["Perm Role"]} index={index}/>
    )
  })
  };
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
  const textX = 10; // Start text close to the top-left corner
  const lineHeight = 20; 
  const areaInPixels = calculatePolygonArea(points);

  const baseFontSize = 8; // Base font size in pixels
  const baseEdgeVertSize = 8;
  const baseStrokeSize = 2;
  let adjustedFontSize = Math.max(baseFontSize / (scale), 20);
  let adjustedEdgeVertSize = Math.min(baseEdgeVertSize / (scale*scale), 20);
  let adjustedStrokeSize = baseStrokeSize / (scale);

  // 10 px per m , 10x 10 per m2 
  const areaInDesiredUnit = (areaInPixels / (pixelsPerMeter * pixelsPerMeter) ) * (conversionFactors[gardenDimensions.unit] * conversionFactors[gardenDimensions.unit]); // Squared for area


  return (
    <div style={{ position: 'relative', height: '100%'  }}onContextMenu={handleContextMenu}>
      <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', height: '100%'  }}>
        <svg width="100%" height="120" style={{ overflow: 'visible' }}>
          <text x={textX} y={lineHeight} fontWeight="bold">
            {`W x L: ${(calculateGardenDimensions(points).width * conversionFactors[gardenDimensions.unit]).toFixed(2)}${gardenDimensions.unit || ""} X ${(calculateGardenDimensions(points).length * conversionFactors[gardenDimensions.unit]).toFixed(2)}${gardenDimensions.unit || ""}`}
          </text>
          <text x={textX} y={lineHeight * 2} fontWeight="bold">
            {`X, Y: ${mousePosition.x.toFixed(2)}, ${mousePosition.y.toFixed(2)}`}
          </text>
          <text x={textX} y={lineHeight * 3} fontWeight="bold">
            {`Scale: ${scale}`}
          </text>
          <text x={textX} y={lineHeight * 4} fontWeight="bold">
            {`# Plants: ${plantsInGarden.length}`}
          </text>
          <text x={textX} y={lineHeight * 5} fontWeight="bold">
            {`Area: ${areaInDesiredUnit.toFixed(2)} sq ${gardenDimensions.unit}`}
          </text>
          <text x={textX} y={lineHeight * 6} fontWeight="bold">
            {`fontSize: ${adjustedFontSize}`}
          </text>
          <text x={textX} y={lineHeight * 7} fontWeight="bold">
            {`vertSize: ${adjustedEdgeVertSize}`}
          </text>
          {/* <text x={textX} y={lineHeight * 10} fontWeight="bold">
            {`selectedPointIndex: ${selectedPointIndex}`}
          </text>
          <text x={textX} y={lineHeight * 11} fontWeight="bold">
            {`selectedPlantIndex: ${selectedPlantIndex}`}
          </text>
          <text x={textX} y={lineHeight * 12} fontWeight="bold">
            {`lastSelectedPointIndex: ${lastSelectedPointIndex}`}
          </text> */}
          
        </svg>
      </div>
      <svg
        ref={svgRef}
        width="99vw"
        height="90vh"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        style={{ border: '1px solid black', cursor: /*isEditing ? 'crosshair' : */'default', backgroundColor: 'rgba(127, 127, 127, 0.5)' }}
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
        {measurementList?.map((item, listIndex) => {
          let isSelected = item.id === selectedMeasurement?.id
          return(
            <React.Fragment key={listIndex}>

              {item.points.length > 0 && (
                <polygon points={item.points.map(p => `${p.x},${p.y}`).join(' ')} style={{ fill: isSelected ? 'rgba(255, 255, 53, 0.3)' : 'rgba(53, 81, 92, 0.3)', stroke: 'blue', strokeWidth: 1 }} />
              )}
              {isSelected && item.points.length > 0 && item.points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={adjustedEdgeVertSize}
                  fill={index === item.lastSelectedPointIndex ? "rgba(127, 0, 0, 0.5)" : "rgba(0, 0, 127, 0.5)"}
                  stroke="blue"
                  strokeWidth={adjustedStrokeSize}
                  onMouseDown={(e) => handlePointMouseDown(index, e, "edge", true, listIndex)}
                  // onDoubleClick={() => handlePointDoubleClick(index)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
              {isSelected && item.points.length > 0 && item.points.map((point, index) => {
                const nextPoint = item.points[index + 1] || item.points[0];  
                const distance = (calculateDistance(point, nextPoint).toFixed(2) * conversionFactors[gardenDimensions.unit]).toFixed(1); // Adjust decimal places as needed

                // Calculate midpoint for text placement
                const midX = (point.x + nextPoint.x) / 2;
                const midY = (point.y + nextPoint.y) / 2;

                return (
                  <g key={index}>
                    <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y}/>
                    <text x={midX} y={midY} style={{ fontSize: `${adjustedFontSize}px` }}>
                      {distance}
                    </text>
                  </g>
                );
              })}
              {item.lastSelectedPointIndex != null  && item.lastSelectedPointIndex < item.points.length && (
                <line
                  x1={item.points[item.lastSelectedPointIndex].x}
                  y1={item.points[item.lastSelectedPointIndex].y}
                  x2={item.points[item.lastSelectedPointIndex !== 0 ? item.lastSelectedPointIndex - 1 : item.points.length - 1].x}
                  y2={item.points[item.lastSelectedPointIndex !== 0 ? item.lastSelectedPointIndex - 1 : item.points.length - 1].y}
                  style={{ stroke: 'yellow', strokeWidth: adjustedStrokeSize }}
                />
              )}
            </React.Fragment >
          )
        })}
        {renderPlants()}
        </g>
      </svg>
      <div style={{
      position: 'absolute', // or 'fixed' if you want it to stay in place on scroll
      bottom: '120px', // Adjust the value as needed
      marginBottom: '200px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <FloatingToolbar 
      measurementList={measurementList} 
      selectedMeasurement={selectedMeasurement} 
      handleDeleteMeasurement={handleDeleteMeasurement} 
      handleClearMeasurement={handleClearMeasurement} 
      handleAddMeasurement={handleAddMeasurement}
      setSelectedMeasurement={setSelectedMeasurement}
      setMeasurementList={setMeasurementList}
      gardenDimensions={gardenDimensions}
      retrieveData={retrieveData}
      storeData={storeData}
      clear={clearData}
      calcArea={()=>{
        return selectedMeasurement !== null ?  (calculatePolygonArea(selectedMeasurement.points) / (pixelsPerMeter * pixelsPerMeter) ) * (conversionFactors[gardenDimensions.unit] * conversionFactors[gardenDimensions.unit]) : null
      }}
      />
      </div>
      <SaveLoadModal modalData={modalData} session={curSesh}/>
    </div>
  );
};

export default Garden;

