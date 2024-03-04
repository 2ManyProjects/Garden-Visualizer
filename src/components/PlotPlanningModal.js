
import React, { useState, useCallback, useEffect, useRef, useMemo,  useLayoutEffect} from 'react';
import { setAllPlantData, setCurrentSession, setPlantsInGarden, setSelectedPlant} from '../redux/gardenSlice'; 
import { Typography, Box, Modal, IconButton, Card, CardActions, CardContent, Button, TextField, ToggleButtonGroup, ToggleButton,  Grid, Paper, Select, MenuItem } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close'
import { SwatchesPicker } from 'react-color'
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { v4 as uuidv4 } from 'uuid';
import {isWindows, isLinux, isApple, isFirefox} from '../utils/PlatForm'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow'; 

//https://farmwest.com/climate/calculator-information/et/crop-coefficients/
const initialPlants = [
  {
    plantId: "001",
    plantName: "Kale",
    plantType: "Leafy green",
    chosenYieldIndex: null,
    crownSpread: 0.5,
    colour: "#2E7D32",
    yieldStructureArray: [
      {
        yieldId: "001a",
        itemHarvested: "Leaves",
        yieldSeasonStart: "04-15",
        durationTillMaturity: '01-20',
        yieldSeasonEnd: "10-01",
        notes: "Can be harvested multiple times during the growing season."
      }
    ],
    growthStages: [
      {stage: "Initial", kc: 0.75, defaultDays: 30, userDefinedDays: null},
      {stage: "Mid-Season", kc: 1.2, defaultDays: 60, userDefinedDays: null},
      {stage: "Late Season", kc: 0.95, defaultDays: 30, userDefinedDays: null}
    ]
  },
  {
    plantId: "002",
    crownSpread: 1,
    plantName: "Tomato",
    plantType: "Fruit",
    colour: "#F44336",
    chosenYieldIndex: null,
    yieldStructureArray: [
      {
        yieldId: "002a",
        itemHarvested: "Fruits",
        durationTillMaturity: '03-01',
        yieldSeasonStart: "06-15",
        yieldSeasonEnd: "09-01",
        notes: "Start indoors, transplant after last frost. Harvest until first frost."
      }
    ],
    growthStages: [
      {stage: "Initial", kc: 0.8, defaultDays: 20, userDefinedDays: null},
      {stage: "Mid-Season", kc: 1.1, defaultDays: 50, userDefinedDays: null},
      {stage: "Late Season", kc: 0.95, defaultDays: 30, userDefinedDays: null}
    ]
  },
  {
    plantId: "003",
    crownSpread: 1,
    plantName: "Cucumber",
    plantType: "Fruit",
    colour: "#9CCC65",
    chosenYieldIndex: null,
    yieldStructureArray: [
      {
        yieldId: "003a",
        itemHarvested: "Fruits",
        yieldSeasonStart: "06-01",
        durationTillMaturity: '04-10',
        yieldSeasonEnd: "08-20",
        notes: "Transplant or direct sow after last frost."
      }
    ],
    growthStages: [
      {stage: "Initial", kc: 0.7, defaultDays: 10, userDefinedDays: null},
      {stage: "Mid-Season", kc: 1.05, defaultDays: 40, userDefinedDays: null},
      {stage: "Late Season", kc: 0.95, defaultDays: 20, userDefinedDays: null}
    ]
  },
];
const PlotPlanningModal = ({selectedMeasurement, open, closeModal, pixelsPerMeter, conversionFactors, gardenDimensions, saveToMeasurement}) => {  

  useLayoutEffect(() => { 
    
  }, [])

  function truncateString(str, num) {
    if (str.length > num) {
      return str.slice(0, num) + "...";
    } else {
      return str;
    }
  } 
  
  return (
    <Modal
      open={open}
      onClose={()=> closeModal()}
      aria-labelledby="colour-modal"
      aria-describedby="colour-modal-description"
    >
      <Card sx={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          width: '80%',
          boxShadow: 24,
          p: 4,
      }}>
        
        <CardContent>
        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'  }}>
            <IconButton fontSize='small' onClick={() => {closeModal()}} color="success">
                <CloseIcon />
            </IconButton>
        </Box>
        <GardenCalendar selectedMeasurement={selectedMeasurement} pixelsPerMeter={pixelsPerMeter} conversionFactors={conversionFactors} gardenDimensions={gardenDimensions} saveToMeasurement={saveToMeasurement}/>


        </CardContent> 
      </Card>
    </Modal>
  )
}

export default PlotPlanningModal

const GardenCalendar = ({selectedMeasurement, pixelsPerMeter, conversionFactors, gardenDimensions, saveToMeasurement}) => {
  const months = [
    { name: 'January', weeks: 5, eto: 1.00 },
    { name: 'February', weeks: 4, eto: 2.00 },
    { name: 'March', weeks: 4, eto: 3.00 },
    { name: 'April', weeks: 4, eto: 4.00 },
    { name: 'May', weeks: 5, eto: 5.00 },
    { name: 'June', weeks: 4, eto: 6.00 },
    { name: 'July', weeks: 5, eto: 7.00 },
    { name: 'August', weeks: 4, eto: 7.00 },
    { name: 'September', weeks: 4, eto: 5.00 },
    { name: 'October', weeks: 5, eto: 3.00 },
    { name: 'November', weeks: 4, eto: 2.00 },
    { name: 'December', weeks: 4, eto: 1.00 }
  ]; 
  // console.log(selectedMeasurement)
  const [plants, setPlants] = useState(initialPlants);
  const [plotPlants, setPlotPlants] = useState(selectedMeasurement?.planningData?.plants || []);
  const [rows, setRows] = useState(selectedMeasurement?.planningData?.successionData || [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [yeild, setYield] = useState(null);
  const [chosenPlant, setChosenPlant] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [plotSuccessionData, setPlotSuccessionData] = useState([])
  const [eto, setETO] = useState(months.map(item => item.eto))
  // console.log(plotSuccessionData)
  const [stage, setStage] = useState(0);
  const [placeablePlants, setPlaceablePlants] = useState([]);
  const [plantWaterData, setPlantWaterData]= useState([]);
 
  // useLayoutEffect(() => {

  // }, [])
  const calculateCrownSpread = (crownSpread) => {
    //calculateDistance(point, nextPoint).toFixed(2)
    // console.log(conversionFactors, gardenDimensions)
      // let dimensions = calculateGardenDimensions(points);
      const pxm = pixelsPerMeter; //dimensions.widthP / dimensions.width;
      // console.log(pxm, dimensions.widthP , dimensions.width, dimensions.widthP / dimensions.width);
      
      const crownSpreadInMeters = crownSpread * conversionFactors[gardenDimensions.unit];
      const crownSpreadInPixels = crownSpreadInMeters * pxm;
      // console.log(crownSpreadInMeters, crownSpreadInPixels);
    
      return crownSpreadInPixels;
    };

  // Function to add a new plant
  const handleStopPlant = () => {
    setSelectedPlant(null);
    setYield(null);
    setChosenPlant(null);
  };

  const saveSuccessionAndTransition = () => {
    let succession = [];
    for(let x = 0; x < rows.length; x++){
      let r = rows[x]
      for(let i = 0; i < r.length; i++){
        succession.push(r[i]);
      }
    }
    succession.sort((a,b) => a.selectedWeekIndex >= b.selectedWeekIndex)
    setPlotSuccessionData(succession);
    // console.log(selectedMeasurement, succession);
    setStage(1);
    setChosenPlant(null);
  }
  const calcWaterUsage = () => {
    let plantsToCalc = [];
    for(let x = 0; x < rows.length; x++){
      if(rows[x].length > 0){
       plantsToCalc.push(rows[x][0])
      }
    }
    // console.log(plantsToCalc)
    let yearByWeek = [];
    months.map((month, index) => {
      Array.from({ length: month.weeks }, (_, weekIndex) => {
        yearByWeek.push({name: month.name, eto: eto[index]})
      })
    })
    // console.log(yearByWeek)
    let plantWithWaterCalc = [];
    for(let x = 0; x < plantsToCalc.length; x++){
      let plant = plantsToCalc[x];
      let stageWeeks = 0;
      let kcIndexByWeek = [];
      plant.plant.growthStages.map(item => {
        let duration = Math.ceil((item.userDefinedDays || item.defaultDays) / 7)
        for(let y = 0; y < duration; y++){
          kcIndexByWeek.push(item.kc)
        }
        stageWeeks += duration
        return item;
      })
      // console.log("Total Weeks", stageWeeks)
      let plantWaterUsage = 0;
      for(let i = plant.selectedWeekIndex; i < plant.selectedWeekIndex + stageWeeks; i++){
        let kcIndex = (i % 52) - plant.selectedWeekIndex;
        let plantRadius = plant.plant.orgCrownSpread / 2;
        let weekWaterUsage = (kcIndexByWeek[kcIndex] * yearByWeek[(i % 52)].eto * ((plantRadius * plantRadius) * Math.PI )) * 7;
        // console.log(kcIndex, kcIndexByWeek[kcIndex], yearByWeek[(i % 52)].eto, ((plantRadius * plantRadius) * Math.PI ) )
        // console.log((kcIndexByWeek[kcIndex] * yearByWeek[(i % 52)].eto * ((plantRadius * plantRadius) * Math.PI )))
        // console.log((kcIndexByWeek[kcIndex] * yearByWeek[(i % 52)].eto * ((plantRadius * plantRadius) * Math.PI )))
        plantWaterUsage += weekWaterUsage;
      }
      plant.plant.waterUsageLiters = plantWaterUsage ;
      let foundPlants = plotPlants.filter(item => item.id === plant.plant.id)
      plant.plant.plannedPlantsWaterUsageLiters = ((plant.plant.waterUsageLiters) * foundPlants.length);
      plantWithWaterCalc.push(plant.plant);
      // console.log(plant.plant.plantName, plant.plant.plannedPlantsWaterUsageLiters)
    }
    // console.log(plantWithWaterCalc, plotPlants)
    setPlantWaterData(plantWithWaterCalc);
  }

  
  const handleDone = () => {
    let saveObj = {plants: plotPlants, successionData: rows}
    console.log(saveObj);
    saveToMeasurement(saveObj, stage === 2 ? true : false);
    if(stage !== 2)
      setStage(2)
  }
  return (
    <div> 
      {stage === 0 && <Box>
        <GardenCalendarUI rows={rows} setRows={(data) => {
          setRows(data)
        }}
        selectedPlant={selectedPlant}
        setSelectedPlant={setSelectedPlant}
        />  
        
        {rows.length > 0 && <Box align="center"  style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          <Box align="center" style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
            <Select
              sx={{maxWidth: 100}}
              value={chosenPlant || ''}
              onChange={(e) => {
                setSelectedPlant(null);
                if(!e.target.value){
                  setChosenPlant(null)
                  setYield(null);
                  return;
                }
                let pl = e.target.value;
                // console.log(pl)
                pl.id = uuidv4();
                pl.chosenYieldIndex = 0;
                // console.log("pl")
                
                setYield(0)
                setChosenPlant(pl)
                setSelectedPlant({...pl, chosenYieldIndex: 0, orgCrownSpread: pl.crownSpread, crownSpread: calculateCrownSpread(pl.crownSpread)});
              }
            } 
            >
            {chosenPlant && <MenuItem key={-5} value={null}>
              Deselect Plant
            </MenuItem>}
              {plants?.map(plant => (
                <MenuItem key={plant.id} value={plant}>
                  {plant.plantName}
                </MenuItem>
              ))}
            </Select> 
            {chosenPlant && 
            <Select
              sx={{maxWidth: 100}}
              value={yeild != null ? chosenPlant.yieldStructureArray[yeild].itemHarvested :  ''}
              onChange={(e) =>{  
                setYield( chosenPlant.yieldStructureArray.findIndex(item => item.itemHarvested === e.target.value))
                
                setSelectedPlant({...chosenPlant, chosenYieldIndex: chosenPlant.yieldStructureArray.findIndex(item => item.itemHarvested === e.target.value), orgCrownSpread: chosenPlant.crownSpread,crownSpread: calculateCrownSpread(chosenPlant.crownSpread)});
              }} 
            >
              {chosenPlant.yieldStructureArray?.map((yeild, index) => (
                <MenuItem key={yeild.yieldId} value={yeild.itemHarvested}>
                  {yeild.itemHarvested}
                </MenuItem>
              ))}
            </Select>}
            {chosenPlant && yeild != null  && selectedPlant &&  <Button variant="contained" onClick={handleStopPlant} >
            Stop Planting
            </Button>}
          </Box>
          <Box>
            <Button variant="contained" onClick={saveSuccessionAndTransition} style={{ marginBottom: '1rem' }}>
            Next
            </Button>
          </Box>
          
          </Box>}
        </Box>}
        {stage === 1 &&
        <Box>
          <GardenPlantingUI plotSuccessionData={plotSuccessionData} selectedMeasurement={selectedMeasurement} pixelsPerMeter={pixelsPerMeter} conversionFactors={conversionFactors} gardenDimensions={gardenDimensions} placeablePlants={placeablePlants} setPlaceablePlants={setPlaceablePlants} setChosenPlant={setChosenPlant} chosenPlant={chosenPlant} setMousePosition={setMousePosition} mousePosition={mousePosition} plotPlants={plotPlants} setPlotPlants={setPlotPlants}/>  
          
          {rows.length > 0 && <Box align="center"  style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}> 
{/* {console.log(placeablePlants)} */}
          <Box align="center" style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
              <Select
                sx={{maxWidth: 100}}
                value={chosenPlant || ''}
                onChange={(e) => {
                  setSelectedPlant(null);
                  if(!e.target.value){
                    setChosenPlant(null) 
                    return;
                  }
                  let pl = e.target.value; 
                  // pl.id = uuidv4(); 
                  setChosenPlant(pl)
                }
              } 
              >
              {chosenPlant && <MenuItem key={-5} value={null}>
                Deselect Plant
              </MenuItem>}
                {placeablePlants?.map(plant => {
                  let curMonth = months[0].name
                  let wkIndex = plant.selectedWeekIndex;
                  for(let x = 0; x < months.length; x++){
                    curMonth = months[x].name;
                    wkIndex -= months[x].weeks
                    if(wkIndex <= 0)
                      break;
                  }

                  return (
                  <MenuItem key={plant.id} value={plant}>
                    {plant.plantName} | {curMonth}
                  </MenuItem>
                )})}
              </Select>  
          </Box>
          <Box>
            <Button variant="contained" onClick={()=> setStage(0)} style={{ marginBottom: '1rem' }}>
            Back
            </Button>
            <Button variant="contained" onClick={handleDone} style={{ marginBottom: '1rem' }}>
            Next
            </Button>
          </Box>
            
        </Box>}
      </Box>}
        {stage === 2 &&
        <Box>
          <GardenWaterUsageUI months={months}  eto={eto}  setETO={setETO}  calcWaterUsage={calcWaterUsage}  plantWaterData={plantWaterData}  plotPlants={plotPlants} />
          <Box align="center">
              <Button variant="contained" onClick={()=> setStage(1)} style={{ marginBottom: '1rem' }}>
              Back
              </Button>
              <Button variant="contained" onClick={handleDone} style={{ marginBottom: '1rem' }}>
              Done
              </Button>
          </Box>
        </Box>}
      </div>
    );
  };


const GardenWaterUsageUI = ({months, eto, setETO, calcWaterUsage, plantWaterData, plotPlants}) => {

  useEffect(()=> {
    calcWaterUsage();
  }, [])

  useEffect(()=> {
    calcWaterUsage();
  }, [eto])
  // console.log(plantWaterData, plotPlants);
  return ( 
    <Box style={{ width: '100%', overflowY: 'hidden',  padding: '1rem' }}>
    <Typography variant="h5" align="center" gutterBottom>
      Plot Water Management
    </Typography>
    
    <Box align="center"  style={{display: 'flex', flexDirection: 'column', justifyContent: 'center'}}> 
        <Typography variant="body2">mm/day</Typography>
      <Grid container justifyContent="center" >
        {months.map((month, index) => (
          <Grid item xs key={index} style={{ textAlign: 'center' }}>
            <Typography variant="body2">{month.name}</Typography>
            <Grid container sx={{paddingTop: '1vh'}}>
              <TextField
                type='number'
                label={'ETo'}
                value={eto[index]}
                onChange={(e) => { 
                  let temp = [...eto];
                  temp[index] = parseFloat(e.target.value)
                  setETO(temp)
                }
                } 
              />     
            </Grid>  
          </Grid>
        ))}
      </Grid>  
      {plantWaterData.length > 0 && <Box style={{ marginTop: '1rem' }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead >
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}} align="center">Plants / Init Month / Yield</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="center">ID</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="center">Quantity</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="center">Crown Spread &nbsp;(m)</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="center">Coverage &nbsp;(sqm)</TableCell>
                <TableCell sx={{fontWeight: 'bold'}} align="center">Total Water &nbsp;(L)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plantWaterData.map((row) => {
                let quant = plotPlants.filter(item => item.id === row.id).length;
                let plantRadius = row.orgCrownSpread / 2;
                let plantCoverage = ((plantRadius * plantRadius) * Math.PI ) * quant;
                let curMonth = months[0].name
                let wkIndex = quant > 0 ? plotPlants.filter(item => item.id === row.id)[0].selectedWeekIndex: 0;
                if(wkIndex > 0)
                  for(let x = 0; x < months.length; x++){
                    curMonth = months[x].name;
                    wkIndex -= months[x].weeks
                    if(wkIndex <= 0)
                      break;
                  }
                return (
                <TableRow
                  key={row.plantName}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell align="center" component="th" scope="row">
                    {row.plantName} / {curMonth} / {row.yieldStructureArray[row.chosenYieldIndex].itemHarvested}
                  </TableCell>
                  <TableCell align="center">{row.id.split('-').pop()}</TableCell>
                  <TableCell align="center">{quant}</TableCell>
                  <TableCell align="center">{row.orgCrownSpread}</TableCell>
                  <TableCell align="center">{plantCoverage.toFixed(1)}</TableCell>
                  <TableCell align="center">{row.plannedPlantsWaterUsageLiters.toFixed(1)}</TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>}
      
    </Box>
  </Box>   
    )
}

const GardenPlantingUI = ({plotSuccessionData, selectedMeasurement, pixelsPerMeter, conversionFactors, gardenDimensions, placeablePlants, setPlaceablePlants, chosenPlant, setChosenPlant, setMousePosition, mousePosition, plotPlants, setPlotPlants}) => {

  const centroid = selectedMeasurement.points.reduce(
    (acc, point) => {
      return {
        x: acc.x + point.x / selectedMeasurement.points.length,
        y: acc.y + point.y / selectedMeasurement.points.length,
      };
    },
    { x: 0, y: 0 }
  ); 
  const [selectedPlantIndex, setSelectedPlantIndex] = useState(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: centroid.x - 500 / 2, y: centroid.y - 500 / 2, width: 500, height: 500 });
 
  useEffect(() => {
    let placeAble = [];
    for(let x = 0; x < plotSuccessionData.length; x++){
      let successionPlant = plotSuccessionData[x];
      if(selectedWeekIndex >= successionPlant.selectedWeekIndex && (successionPlant.selectedWeekIndex + successionPlant.widthInWeeks) >= selectedWeekIndex){
        if( placeAble.findIndex(item => item.id === successionPlant.plant.id)=== -1){
          let plant = {...successionPlant.plant, ...successionPlant}
          delete plant.plant; 
          placeAble.push(plant);
        }
      }
    }
    if(placeAble.length > 0){
      // for(let x = 0; x < placeAble.length; x++){
      //   setChosenPlant(placeAble[x])
      // }
      setChosenPlant(placeAble[0])
    }else
      setChosenPlant(null)
    setPlaceablePlants(placeAble)

    // console.log(selectedWeekIndex,placeAble, );
  }, [selectedWeekIndex])

  const months = [
    { name: 'January', weeks: 5 },
    { name: 'February', weeks: 4 },
    { name: 'March', weeks: 4 },
    { name: 'April', weeks: 4 },
    { name: 'May', weeks: 5 },
    { name: 'June', weeks: 4 },
    { name: 'July', weeks: 5 },
    { name: 'August', weeks: 4 },
    { name: 'September', weeks: 4 },
    { name: 'October', weeks: 5 },
    { name: 'November', weeks: 4 },
    { name: 'December', weeks: 4 }
  ];  

 
  const handleWheel = (event) => {
    const scale = 0.1; // Determine the scale of zoom
    const delta = event.deltaY * 0.01; // Normalizing the wheel speed

    // Calculate the new width and height
    const newWidth = viewBox.width * (1 + delta * scale);
    const newHeight = viewBox.height * (1 + delta * scale);

    // Calculate the new X and Y based on the mouse position to zoom into the cursor point
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; // Mouse X position within the element
    const mouseY = event.clientY - rect.top;  // Mouse Y position within the element

    // Adjust the viewBox position by the same proportion as the width/height
    const dx = ((viewBox.width - newWidth) / viewBox.width) * (mouseX / rect.width);
    const dy = ((viewBox.height - newHeight) / viewBox.height) * (mouseY / rect.height);

    setViewBox(prevViewBox => ({
      x: prevViewBox.x + dx,
      y: prevViewBox.y + dy,
      width: newWidth,
      height: newHeight
    }));
  };

  const handleMouseDown = (event) => {
    if(event.button === 1){ 
      setIsDragging(true);
      setStartDrag({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handleMeasurementMouseDown = (event) => { 
    // console.log("evt")
    if(event.button === 1){ 
      setIsDragging(true);
      setStartDrag({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handleMeasurementMouseUp = (event) => {
    if(selectedPlantIndex !== null){
      setSelectedPlantIndex(null)
      return;
    }

    if(event.button === 0){ 
      setPlotPlants((prevPlants) => {
        return [...prevPlants, {...chosenPlant, x: mousePosition?.x, y: mousePosition?.y }]
      }) 
    }else if(event.button === 1)
      setIsDragging(false);
  };

  const plantMouseDown = (event, index) => { 
    if(event.button === 0)
      setSelectedPlantIndex(index)  
  };
  
  const plantMouseUp = (event, index) => {
    // console.log(event, index)
    if(event.button === 0) 
      setSelectedPlantIndex(null)   
    else if(event.button === 2) {
      setSelectedPlantIndex(null)   
      setPlotPlants((prevPlants) => prevPlants.filter((item, i) => i !== index))
    }
  };


  const handleMouseMove = (event) => {
    if (isDragging) {
      const dx = event.clientX - startDrag.x;
      const dy = event.clientY - startDrag.y;
      setViewBox((prevViewBox) => ({
        ...prevViewBox,
        x: prevViewBox.x - dx,
        y: prevViewBox.y - dy
      }));
      setStartDrag({
        x: event.clientX,
        y: event.clientY
      });
    }else  {
      const svg = event.currentTarget;
      const { x, y } = transformCoordinates(event.clientX, event.clientY, svg);
      setMousePosition({ x, y });
      // setMousePosition({ x: event.clientX, y: event.clientY });
    }
    if(selectedPlantIndex !== null){
      
      setPlotPlants((prevPlants) => {
        return prevPlants.map((item, index) => {
          if(selectedPlantIndex === index){
            return {...item, x: mousePosition.x, y: mousePosition.y}
          }else {
            return item;
          }
        })
      }) 
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Ensure dragging stops if the mouse leaves the SVG area
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const transformCoordinates = (clientX, clientY, svgElement) => {
    const svgPoint = svgElement.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const transformedPoint = svgPoint.matrixTransform(svgElement.getScreenCTM().inverse());
    const { width, height } = svgElement.getBoundingClientRect();
    if(isFirefox() ){
      // console.log(width, svgElement.width.baseVal.value)
      transformedPoint.x += svgElement.width.baseVal.value * 1.1 ;
      transformedPoint.y += svgElement.height.baseVal.value * 0.83;
      // transformedPoint.x += width ;
      // transformedPoint.y += height ;
    }
    return { x: transformedPoint.x , y: transformedPoint.y };
  };

  function calculateDistance(point1, point2) {
    const pxm = pixelsPerMeter;
     
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy) / pxm;
  } 
  
  
  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`; 

  return (
    <Box style={{ width: '100%', overflowY: 'hidden',  padding: '1rem' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Garden Calendar
      </Typography>
      <Box 
        sx={{ width: '100%', height: 500, margin: 'auto', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={handleMouseLeave}>
        <Grid container justifyContent="center" onClick={() => { 
        }}>
          {months.map((month, index) => (
            <Grid item xs key={index} style={{ textAlign: 'center' }}>
              <Typography variant="body2">{month.name}</Typography>
              <Grid container>
                {Array.from({ length: month.weeks }, (_, weekIndex) => {
                  let cumulativeWeeks = 0;
                  for(let x = 0; x < index; x++){
                    cumulativeWeeks +=  months[x].weeks;
                  }
                  cumulativeWeeks += weekIndex;
                  return (
                    <Grid  onMouseOver={()=> {setSelectedWeekIndex(cumulativeWeeks)}} item xs  key={weekIndex} style={{ textAlign: 'center', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', backgroundColor: selectedWeekIndex === (cumulativeWeeks) ? '#c8cc84' : '#ffffff' }}>
                      <Typography variant="body2">{weekIndex + 1}</Typography>
                    </Grid>
                  )
                })}
              </Grid>  
            </Grid>
          ))}
        </Grid> 
        <svg width="100%" height="100%" viewBox={viewBoxStr} onMouseMove={handleMouseMove}>
        <polygon 
          onMouseDown={(e) =>{ 
            handleMeasurementMouseDown(e); 
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseUp={(e) =>{ 
            handleMeasurementMouseUp(e); 
            e.preventDefault();
            e.stopPropagation();
          }}
          points={selectedMeasurement.points.map(p => `${p.x},${p.y}`).join(' ')} 
          style={{ 
            fill:  selectedMeasurement?.colour?.rgbString ?? 'rgba(53, 81, 92, 0.3)', 
            stroke: 'blue', strokeWidth: 1 }} /> 
          {plotPlants.length > 0 && plotPlants.map((successionPlant, index) => { 

            let relavent = false;
            if(selectedWeekIndex >= successionPlant.selectedWeekIndex && (successionPlant.selectedWeekIndex + successionPlant.widthInWeeks) >= selectedWeekIndex){
              relavent = true;
            }
            if(relavent){
              return (
                <svg 
                x={successionPlant.x - (successionPlant.crownSpread)} 
                y={successionPlant.y - successionPlant.crownSpread} 
                onMouseDown={(e) =>{  
                  plantMouseDown(e, index);
                  // e.preventDefault();
                  // e.stopPropagation();
                }}
                onMouseUp={(e) =>{  
                  plantMouseUp(e, index);
                  // e.preventDefault();
                  // e.stopPropagation();
                }}>
                  <circle
                        cx={successionPlant.crownSpread / 2 + 1.07}
                        cy={successionPlant.crownSpread / 2 + 1.07}
                        r={successionPlant.crownSpread / 2 + 1}  
                        // r={50}  
                        fill={ "#000000"} /> 

                <circle 
                    cx={successionPlant.crownSpread / 2 + 1.07}
                    cy={successionPlant.crownSpread / 2 + 1.07}
                    r={successionPlant.crownSpread / 2}  
                    // r={50}  
                    fill={successionPlant.colour? successionPlant.colour : "#9CCC65"} 
                  />
                </svg> 
              )
            }else {
              return null;
            } 
          })}
          
          {/* {chosenPlant && !isDragging && <svg width={chosenPlant.crownSpread} height={chosenPlant.crownSpread} x={mousePosition.x - chosenPlant.crownSpread} y={mousePosition.y - chosenPlant.crownSpread}   ><circle
          cx={chosenPlant.crownSpread / 2}
          cy={chosenPlant.crownSpread / 2}
          r={chosenPlant.crownSpread / 2}  
          fill="#CCCCCC" 
        /> </svg>}  */}

          {selectedMeasurement.points.length > 0 && selectedMeasurement.points.map((point, index) => {
            const nextPoint = selectedMeasurement.points[index + 1] || selectedMeasurement.points[0];  
            const distance = (calculateDistance(point, nextPoint).toFixed(2) * conversionFactors[gardenDimensions.unit]).toFixed(1); // Adjust decimal places as needed

            // Calculate midpoint for text placement
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;

            return (
              <g key={index}>
                <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y}/>
                <text x={midX} y={midY} style={{ 
                  fontSize: `${10}px`, 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none', 
                  msUserSelect: 'none' 
                   }}>
                {distance}{gardenDimensions.unit}
                </text>
              </g>
            );
          })}
        </svg>
            
      </Box> 
    </Box>
  );
};

const GardenCalendarUI = ({rows, setRows, selectedPlant, setSelectedPlant}) => {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  

  const months = [
    { name: 'January', weeks: 5 },
    { name: 'February', weeks: 4 },
    { name: 'March', weeks: 4 },
    { name: 'April', weeks: 4 },
    { name: 'May', weeks: 5 },
    { name: 'June', weeks: 4 },
    { name: 'July', weeks: 5 },
    { name: 'August', weeks: 4 },
    { name: 'September', weeks: 4 },
    { name: 'October', weeks: 5 },
    { name: 'November', weeks: 4 },
    { name: 'December', weeks: 4 }
  ];  
  useEffect(() => {
    if (selectedPlant) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [selectedPlant]);

  const parseDuration = (duration) => {
    const [m, days] = duration.split('-').map(Number);
    let cumulativeWeeks = 0;
    for(let x = 0; x < parseInt(m); x++){
      cumulativeWeeks +=  months[x].weeks;
    }
    cumulativeWeeks += parseInt(days / 7);
    return { months: m, days, weeks: cumulativeWeeks };
  };
  
  // Function to calculate the number of weeks between two dates
  const weeksBetween = (startDate, endDate) => {
    const msPerWeek = 1000 * 60 * 60 * 24 * 7;
    const diffInMs = endDate.getTime() - startDate.getTime();
    return diffInMs / msPerWeek;
  };
  const calculatePosition = (plant) => {
    // Parse the yieldSeasonStart and yieldSeasonEnd into date objects
    const startParts = plant.yieldStructureArray[plant.chosenYieldIndex].yieldSeasonStart.split('-').map(Number);
    const endParts = plant.yieldStructureArray[plant.chosenYieldIndex].yieldSeasonEnd.split('-').map(Number);
    const startMonth = startParts[0] - 1; // JS months are 0-indexed
    const endMonth = endParts[0] - 1;
  
    // Create date objects for the start and end of the yield season
    const currentYear = new Date().getFullYear();
    const yieldStart = new Date(currentYear, startMonth, startParts[1]);
    const yieldEnd = new Date(currentYear, endMonth, endParts[1]);
  
    // Calculate the width of the plant box based on the duration till maturity
    const duration = parseDuration(plant.yieldStructureArray[plant.chosenYieldIndex].durationTillMaturity);
    const maturityDate = new Date(yieldStart.getTime());
    maturityDate.setMonth(maturityDate.getMonth() + duration.months);
    maturityDate.setDate(maturityDate.getDate() + duration.days); 
    // Calculate the number of weeks the plant will occupy on the grid
    const plantWeeks = Math.ceil(weeksBetween(yieldStart, yieldEnd) + duration.weeks);
    // console.log(plant, weeksBetween(yieldStart, yieldEnd),  duration.weeks, plantWeeks, yieldStart, yieldEnd, yieldEnd.getTime() - yieldStart.getTime())
  
    // Return the position and width (in weeks) for the plant box
    return plantWeeks;
  };
  const handleAddPlant = () => {
    let rowsArr = rows; 
    let selRow = rows[selectedRow];
    selRow.push({ plant: {...selectedPlant, id: uuidv4()}, selectedRow, selectedWeekIndex, widthInWeeks: calculatePosition(selectedPlant)})
    rowsArr[selectedRow] = selRow;
    setRows(rowsArr)
  }

  // Update the mouse position state to follow the cursor
  const handleMouseMove = (event) => {
    // setMousePosition({ x: event.clientX, y: event.clientY });
  };
 

  const addRow = () => {
    setRows(prevRows => [...prevRows, []]);
  };

  const isPlantClicked = (data, week) => {

    let widthInWeeks = calculatePosition(data.plant); 
    if(data.selectedWeekIndex + widthInWeeks > 52){
      let offSetWeeks = widthInWeeks - (data.selectedWeekIndex + widthInWeeks - 52); 
      return week <= offSetWeeks || week >= data.selectedWeekIndex
    }else { 
      return week >= data.selectedWeekIndex && week <= (data.selectedWeekIndex + widthInWeeks)
    }
    
  }
  return (
    <Paper style={{ width: '100%', position: 'relative', overflowY: 'auto',  padding: '1rem', height: '470px' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Garden Calendar
      </Typography>
      <Box sx={{  overflowY: 'auto' }}>
        <Grid container justifyContent="center" onClick={() => {
          if(selectedPlant){
            let isDisabled = selectedRow !== null && rows[selectedRow].length > 0;
            if(!isDisabled)
              handleAddPlant();
            // setSelectedPlant(null);
          }
        }}>
          {months.map((month, index) => (
            <Grid item xs key={index} style={{ textAlign: 'center' }}>
              <Typography variant="body2">{month.name}</Typography>
              <Grid container>
                {Array.from({ length: month.weeks }, (_, weekIndex) => {
                  
                  let cumulativeWeeks = 0;
                  for(let x = 0; x < index; x++){
                    cumulativeWeeks +=  months[x].weeks;
                  }
                  cumulativeWeeks += weekIndex;
                  return(
                  <Grid item xs  key={weekIndex} style={{ textAlign: 'center', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', backgroundColor: selectedWeekIndex === (cumulativeWeeks) ? '#c8cc84' : '#ffffff' }}>
                    <Typography variant="body2">{weekIndex + 1}</Typography>
                  </Grid>
                )})}
              </Grid>
                {rows.map((row, rowIndex)=> row.map((data, index) =>{
                  return <FloatingPlantBox
                  months={months}
                  key={index}
                  plant={data.plant}
                  rowIndex={data.selectedRow}
                  weekIndex={data.selectedWeekIndex}
                  colour={'rgba(36, 147, 36, 0.08)'}/>
                }))} 
                {selectedPlant && (
                  <FloatingPlantBox
                  shadow={true}
                  months={months}
                  plant={selectedPlant}
                  rowIndex={selectedRow}
                  disabled={selectedRow !== null && rows[selectedRow].length > 0}
                  weekIndex={selectedWeekIndex}
                  colour={'rgba(100, 100, 100, 0.08)'}/>
                )}
                {rows.map((row, rowIndex) => 
                {
                  return<Grid container  onMouseOver={()=> {{
                    setSelectedRow(() => rowIndex)}}}>
                    {Array.from({ length: month.weeks }, (_, weekIndex) => {
                    let cumulativeWeeks = 0;
                    for(let x = 0; x < index; x++){
                      cumulativeWeeks +=  months[x].weeks;
                    }
                    cumulativeWeeks += weekIndex;
                      
                      return(
                    <Grid item xs  key={weekIndex} style={{ textAlign: 'center', borderRight: '1px solid rgba(221, 221, 221, 0.5)', borderBottom: '1px solid rgba(221, 221, 221, 0.5)', zIndex: 5 }} onMouseOver={()=> setSelectedWeekIndex(cumulativeWeeks)}
                    onMouseUp={(e) => {
                      if(e.button === 2){
                        console.log(rows[rowIndex]);
                        if(isPlantClicked(rows[rowIndex][0], selectedWeekIndex )){
                          let r = [...rows];
                          r[rowIndex] = [];
                          setRows(r)
                        }
                        // onDelete();
                      }
                  
                    }}
                    >
                      <Typography variant="body2"  sx={{color: "rgba(100,100,100, 0)", 
                      userSelect: 'none',  
                      WebkitUserSelect: 'none',  
                      msUserSelect: 'none'  }}>{weekIndex + 1}</Typography>
                    </Grid>
                  )})}
                  </Grid> 
                })}
            </Grid>
          ))}
        </Grid> 
      </Box>
      <Box  align="center">
        <Button    variant="contained" onClick={addRow} style={{ marginBottom: '1rem' }}>
          Add Row
        </Button>
      </Box> 
    </Paper>
  );
};


const FloatingPlantBox = ({ plant, rowIndex, weekIndex, colour, months, onDelete, shadow, disabled }) => {

  
  const parseDuration = (duration) => {
    const [m, days] = duration.split('-').map(Number);
    let cumulativeWeeks = 0;
    for(let x = 0; x < parseInt(m); x++){
      cumulativeWeeks +=  months[x].weeks;
    }
    cumulativeWeeks += parseInt(days / 7);
    return { months: m, days, weeks: cumulativeWeeks };
  };
  
  // Function to calculate the number of weeks between two dates
  const weeksBetween = (startDate, endDate) => {
    const msPerWeek = 1000 * 60 * 60 * 24 * 7;
    const diffInMs = endDate.getTime() - startDate.getTime();
    return diffInMs / msPerWeek;
  };
   
  const calculatePosition = (plant) => {
    // Parse the yieldSeasonStart and yieldSeasonEnd into date objects
    const startParts = plant.yieldStructureArray[plant.chosenYieldIndex].yieldSeasonStart.split('-').map(Number);
    const endParts = plant.yieldStructureArray[plant.chosenYieldIndex].yieldSeasonEnd.split('-').map(Number);
    const startMonth = startParts[0] - 1; // JS months are 0-indexed
    const endMonth = endParts[0] - 1;
  
    // Create date objects for the start and end of the yield season
    const currentYear = new Date().getFullYear();
    const yieldStart = new Date(currentYear, startMonth, startParts[1]);
    const yieldEnd = new Date(currentYear, endMonth, endParts[1]);
  
    // Calculate the width of the plant box based on the duration till maturity
    const duration = parseDuration(plant.yieldStructureArray[plant.chosenYieldIndex].durationTillMaturity);
    const maturityDate = new Date(yieldStart.getTime());
    maturityDate.setMonth(maturityDate.getMonth() + duration.months);
    maturityDate.setDate(maturityDate.getDate() + duration.days); 
    // Calculate the number of weeks the plant will occupy on the grid
    const plantWeeks = Math.ceil(weeksBetween(yieldStart, yieldEnd) + duration.weeks);
    // console.log(plant, weeksBetween(yieldStart, yieldEnd),  duration.weeks, plantWeeks, yieldStart, yieldEnd, yieldEnd.getTime() - yieldStart.getTime())
  
    // Return the position and width (in weeks) for the plant box
    return plantWeeks;
  };
  
  let widthInWeeks = calculatePosition(plant);
  let showOverFlowBox = false
  let textInMainBox = true;
  let addition = 0;
  // console.log(weekIndex,  widthInWeeks, weekIndex + widthInWeeks , weekIndex + widthInWeeks > 52)
  if(weekIndex + widthInWeeks > 52){
    addition = 0.6;
    widthInWeeks = widthInWeeks - (weekIndex + widthInWeeks - 52);
    showOverFlowBox = true;
    let overFlowWeeks = calculatePosition(plant) - widthInWeeks;
    if(overFlowWeeks / widthInWeeks > 1.2){
      textInMainBox = false;
    }
    // console.log(widthInWeeks, calculatePosition(plant) - widthInWeeks);
  }
  let weekFiveIndex = 0;//adjust widths for extra weeks
  let ind = weekIndex;
  let mStarting = 0; 
  for(let x = 0; x < months.length; x++){
    ind -= months[x].weeks;
    if(ind < months[x + 1].weeks){
      mStarting = x;
      break;
    }
  }
  ind = widthInWeeks;
 
  for(let x = mStarting; x < months.length; x++){
    ind -= months[x].weeks;
    if(months[x].weeks === 5){
      weekFiveIndex += 1;
    }
    if(ind < months[x + 1].weeks){
      break;
    }
  }
  let h = 3.6;
  let w = 2;
  // console.log(widthInWeeks, weekFiveIndex, widthInWeeks - weekFiveIndex)
  //needed to adjust for 5 week vs 4 weeks months
  const boxWidth = `${(widthInWeeks - weekFiveIndex + addition) * w}%`;

  // Calculate the y-position based on the rowIndex
  // const boxTopPosition = `${rowIndex * h + 20.8}vh`; // Example calculation, adjust as necessary
  const boxTopPosition = `${rowIndex * (h + 0.6) + 19.3}%`;

  // Use a ref to the grid container to calculate the x-position (1.5 * (1 - (weekIndex /  52)))
  const boxLeftPosition = `${(weekIndex) * w  + 2 - (9 * ((weekIndex /  52))) + (1 * ((weekIndex /  52))) - 0.5 }%`;
  // if(shadow)
  //   console.log((widthInWeeks - weekFiveIndex) * w, (widthInWeeks - weekFiveIndex), widthInWeeks, weekFiveIndex, w)
  // Styles for the plant box
  const boxStyles = {
    position: 'absolute',
    top: boxTopPosition ,
    left: boxLeftPosition,
    width: boxWidth,
    height: `${h}%`,  
    backgroundColor:disabled ?'rgba(200, 0, 0, 0.08)' : colour,
    color: '#dddbdc',
    border: '1.5px solid black',
    borderRadius: '5px'
  } 
  let overFlowWidth = `${(calculatePosition(plant) - widthInWeeks) * w}%`;
  if(showOverFlowBox){
    let weekFiveIndex = 0;
    let ind = calculatePosition(plant) - widthInWeeks; 
    for(let x = 0; x < months.length; x++){
      ind -= months[x].weeks;
      if(months[x].weeks === 5){
        weekFiveIndex += 1;
      }
      if(ind < months[x + 1].weeks){ 
        break;
      }
    }
    overFlowWidth = `${((calculatePosition(plant) - weekFiveIndex) - (widthInWeeks)) * w  }%`;
  }

  const OverFlowBoxStyles = {
    position: 'absolute',
    top: boxTopPosition ,
    left: `${0 * w + 1.5 }%`,
    width: overFlowWidth,
    height: `${h}%`,  
    backgroundColor: disabled ? 'rgba(200, 0, 0, 0.08)' : colour, 
    border: '1.5px solid black',
    color: '#dddbdc',
    borderRadius: '5px'
  };
  return <div  onMouseUp={(e) => {
    // if(e.button === 2 && onDelete){
    //   onDelete();
    // }

  }}>
    {(widthInWeeks - weekFiveIndex) > 0 && <div style={boxStyles}> {textInMainBox && plant.plantName} </div>}
    {showOverFlowBox && <div style={OverFlowBoxStyles}> {!textInMainBox && plant.plantName}  </div>}
  </div>;
};






















