
import React, { useState, useCallback, useEffect, useRef, useMemo,  useLayoutEffect} from 'react';
import { setAllPlantData, setCurrentSession, setPlantsInGarden, setSelectedPlant} from '../redux/gardenSlice'; 
import { Typography, Box, Modal, IconButton, Card, CardActions, CardContent, Button, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close'
import { SwatchesPicker } from 'react-color'
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PlotPlanningModal from './PlotPlanningModal';


const PlotCardDetails = ({selectedMeasurement, conversionFactors, gardenDimensions, calculatePolygonArea, handleAddRemovePoints, handleClearMeasurement, handleDeleteMeasurement,setSelectedMeasurement, isInsidePolygon, plantsInGarden, plantMacros, setMeasurementColor, pixelsPerMeter, setMeasurementList}) => {
    const [nutrientReq, setNutrientReq] = useState({ kReq: 0, nReq: 0 });

    const [open, setOpen] = useState(false);
    const [openPlanning, setOpenPlanning] = useState(false);
    const [colour, setColour] = useState(null);
    const [showColourPicker, setShowColourPicker] = useState(false);
    const [newName, setNewName] = useState('');


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
    const saveToMeasurement = (data) => {
      let measurement = selectedMeasurement;
      measurement.planningData = data;
      // console.log(measurement);
      setMeasurementList(list => list.map(item => {
          if(item.id === measurement.id){
              return measurement;
          }else {
              return item;
          }
  
      }))
      setSelectedMeasurement(measurement);
      setOpenPlanning(false);
    };
  
    
    return (
      <Box sx={{ 
        // pointerEvents: 'none',
        position: 'fixed', 
        left: '80vw',
        top: '56vh', 
      }}> 
      <PlotPlanningModal pixelsPerMeter={pixelsPerMeter} conversionFactors={conversionFactors} gardenDimensions={gardenDimensions} selectedMeasurement={selectedMeasurement} open={openPlanning} closeModal={() => setOpenPlanning(false)} saveToMeasurement={saveToMeasurement}/>
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
              <Button size="small" onClick={handleAddRemovePoints}>{selectedMeasurement.addPoints ? 'Done' : 'Add Points'}</Button>
              <Button size="small" onClick={handleClearMeasurement}>Clear</Button>
            </Box> 
            {/* <Box sx={{display: 'flex', flexDirection: 'row'}}>
              <Button size="small" onClick={nutrientAnalysis}>Analyse Nutrients</Button>
            </Box> */}
            <Box sx={{display: 'flex', flexDirection: 'row'}}>
              <Button size="small" onClick={()=> setOpenPlanning(true)}>Planting Plan</Button>
            </Box>
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

  export default PlotCardDetails