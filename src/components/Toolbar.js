import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating GUIDs
import { useDispatch, useSelector } from 'react-redux';
import { setPermRole, toggleVisibility, setSelectedPlant, setGardenAnalysis, setPlantMacroData, setRoles, setAllPlantData } from '../redux/gardenSlice'; // Import setPlantData
import SyncButton from './SyncButton';
import PlantIcons from './PlantIcons';
import { Select, MenuItem, FormControl, InputLabel, ListItemIcon, Box, ListItemText, Button, TextField, Modal, Typography, ToggleButton  } from '@mui/material';
import axios from 'axios';
import Toolbar from '@mui/material/Toolbar';

const TB = ({ setEditing, clearGarden, onGardenDimensionsChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const fetching = useRef(false);
  const dispatch = useDispatch();
  const { permRoles, selectedPlants, selectedPlant, plantsInGarden, plantMacros, gardenAnalysis } = useSelector(state => state.garden);
  const [selectedPermRole, setSelectedPermRole] = useState('');
  const [open, setOpen] = useState(false);
  const [keys, showKeys] = useState(false);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [unit, setUnit] = useState('m');
  const [isPlantSelectorEnabled, setIsPlantSelectorEnabled] = useState(true);

  const handleOpenKeys = () => showKeys(true);
  const handleCloseKeys = () => showKeys(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  useEffect(() => {
    let analysisData = {
      kReq: 0,
      nReq: 0
    };
    // console.log("plantsInGarden Change");
    if(plantMacros){
      // console.log("plantMacros", plantMacros);
      for(let  x = 0; x < plantsInGarden.length; x++){
        let plant = plantsInGarden[x];
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
        // console.log(analysisData)
      }
    }else {
      // console.log("NoplantMacros");
      if(!fetching.current)
        fetchSheetData();
    }
    if(!gardenAnalysis || gardenAnalysis.kReq !== analysisData.kReq || gardenAnalysis.nReq !== analysisData.nReq){
      dispatch(setGardenAnalysis({...(gardenAnalysis || {}), ...analysisData}))
    }
  }, [plantsInGarden]);
  useEffect(() => {
    setIsPlantSelectorEnabled(Boolean(unit));

    if(Boolean(unit)){
        onGardenDimensionsChange(unit)
    }
  }, [unit]);



  const fetchSheetData = async () => {
    fetching.current = true;
    setIsFetching(true);
    var config = {
      method: 'get',
      url: 'https://ytwwg98ey8.execute-api.ca-central-1.amazonaws.com/prod/v1/plants/general',
      headers: {
        'Content-Type': 'application/json'
      },
    };
    
    let plantData = await axios(config) 
    console.log("PLANTDATA", plantData);
    if(plantData.status === 200){
      let plantResponse = plantData.data.data;
      dispatch(setPlantMacroData(plantResponse.plantMacros));
      dispatch(setRoles(plantResponse.permRoles));
      dispatch(setAllPlantData(plantResponse.plants));
    }else if(plantData.status === 202){
      config = {
        method: 'get',
        url: plantData.data.data,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      try {
        const response = await axios(config);
        dispatch(setPlantMacroData(response.data.plantMacros));
        dispatch(setRoles(response.data.permRoles));
        dispatch(setAllPlantData(response.data.plants));
      } catch (error) {
        console.error('Error downloading the data:', error);
      }
    }
    fetching.current = false;
    setIsFetching(false);
    
  }; 

  
  const handlePermRoleChange = (event) => {
    setSelectedPermRole(event.target.value);
    dispatch(setPermRole(event.target.value)); 
  };

  const handleVisibilityToggle = () => {
    dispatch(toggleVisibility());
  };


  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setEditing(!isEditing);
  };

  return (
    <Toolbar>
    <Button onClick={() => {
      showKeys(true)
      }}>Help/KeyBinds</Button>
        <FormControl>
            <InputLabel>Unit</InputLabel>
            <Select value={unit} label="Unit" onChange={(e) => setUnit(e.target.value)}>
                <MenuItem value="cm">cm</MenuItem>
                <MenuItem value="m">m</MenuItem>
                <MenuItem value="in">in</MenuItem>
                <MenuItem value="ft">ft</MenuItem>
                <MenuItem value="y">yards</MenuItem>
                <MenuItem value="ac">acre</MenuItem>
                <MenuItem value="ha">hectare</MenuItem>
            </Select>
    </FormControl>


    <SyncButton  disabled={isFetching} fetchSheetData={fetchSheetData}/> 

    {permRoles.length > 0 && <FormControl style={{ maxWidth: 400, minWidth: 200,  margin: '10px' }}>
      <InputLabel id="plant-icon-select-label">Role</InputLabel>
      <Select
        labelId="role-icon-select-label"
        id="role-icon-select"
        value={selectedPermRole}
        label="Plant"
        onChange={handlePermRoleChange}
      >
        {permRoles.map(permRole => <MenuItem key={permRole} value={permRole}>
          <ListItemText primary={permRole} />
        </MenuItem>)}
         
      </Select>
    </FormControl> }
      {selectedPlants?.length > 0 && <PlantIcons isPlantSelectorEnabled={isPlantSelectorEnabled} isEditing />} 
      {/* {selectedPlants.length > 0 && <Button onClick={handleVisibilityToggle}>Toggle Visibility</Button>} */}
      {selectedPlant && <Button onClick={handleOpen}>Info/Plant Config</Button>}
      <Button onClick={toggleEdit}>{isEditing ? '- Points' : '+ Points'}</Button>
      <Button onClick={() => {
        clearGarden(true)
        setTimeout(() => { clearGarden(false)}, 50)
        }}>Clear Garden</Button>
      {gardenAnalysis && <Box>
        <Typography>{`N: ${gardenAnalysis.nReq.toFixed(2)}g, K:${gardenAnalysis.kReq.toFixed(2)}g`}</Typography>  
        
      </Box>}

      {selectedPlant && <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="rename-modal"
        aria-describedby="rename-modal-description"
      >
        <Box sx={{
          justifyContent: 'center',
          alignItems: 'center',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
        }}>
          <Typography  sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} id="rename-modal" variant="h6" component="h2">
          Info: {selectedPlant?.Name}, {selectedPlant?.Latin}
          </Typography>

          {selectedPlant && Object.keys(selectedPlant).map((item, index) => {
            const regex = /(\d+(\.\d+)?)-(\d+(\.\d+)?)/;
            if( ["sheetIndex", "Image", "path", "Name", "Latin"].includes(item) || /^usr/.test(item))
              return null

              if(selectedPlant[item] !== null && regex.test(selectedPlant[item])){
                return(
                  <NumberRangeInput rangeString={selectedPlant[item]} keyName={item} currentVal={selectedPlant["usr"+item] || selectedPlant[item]} setPlantData={(numValue, keyName) => {
                    let plant = {...selectedPlant};
                    plant[keyName] = numValue;
                    dispatch(setSelectedPlant({...plant, local: true}))
                  }} />
                )
              }
            return (
              <Typography sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} key={index} fontWeight="bold">
                {typeof selectedPlant[item] !== "object" && `${item}:  ${selectedPlant[item] }`}
                {selectedPlant[item] && typeof selectedPlant[item] === "object" && <Box>
                  <Typography  sx={{ textDecoration: 'underline', display: 'flex',justifyContent: 'center',alignItems: 'center'}} variant="h8" component="h3">
                  {item}
                  </Typography>
                  {Object.keys(selectedPlant[item]).map((key, keyIndex) => {
                  return(
                    <Typography key={keyIndex} fontWeight="bold">
                      {`${key}:  ${selectedPlant[item][key]}`}
                    </Typography>
                  )
                })}
                  </Box>}
              </Typography>
            )
          })}
          {selectedPlant && (
            <ToggleButton selected={!Object.keys(selectedPlant).includes("nutrientCalc")? true : selectedPlant.nutrientCalc}
            onChange={(e)=>{
              let val = !selectedPlant.nutrientCalc;
              if(!Object.keys(selectedPlant).includes("nutrientCalc")){
                val = false;
              }
              let plant = {...selectedPlant};
              plant.nutrientCalc = val;
              dispatch(setSelectedPlant({...plant, local: true}))
            }}>
              Include in Nutrient Calc
            </ToggleButton>
          )}

          {selectedPlant && (
            <ToggleButton selected={!Object.keys(selectedPlant).includes("shadow")? true : selectedPlant.shadow}
            onChange={(e)=>{
              let val = !selectedPlant.shadow;
              if(!Object.keys(selectedPlant).includes("shadow")){
                val = false;
              }
              let plant = {...selectedPlant};
              plant.shadow = val;
              dispatch(setSelectedPlant({...plant, local: true}))
            }}>
              Calc Shadows
            </ToggleButton>

          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleClose}>Close</Button>
          </Box>
        </Box>
      </Modal>}
      <Modal
        open={keys}
        onClose={handleCloseKeys}
        aria-labelledby="rename-modal"
        aria-describedby="rename-modal-description"
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
          KeyBindings and Tips
          </Typography>
          <Typography fontWeight="bold">
            {`Zoom In/Out/Reset: +/-/Space`}
          </Typography>
          <Typography fontWeight="bold">
            {`Camera Move: Middle Mouse Drag`}
          </Typography>
          <Typography fontWeight="bold">
            {`Delete:  Right Click`}
          </Typography>
          <Typography fontWeight="bold">
            {`Zoom in to select easier`}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleCloseKeys}>Close</Button>
          </Box>
        </Box>
      </Modal>
    </Toolbar>
  );
};

export default TB;


const NumberRangeInput = ({ rangeString, keyName, setPlantData, currentVal }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  
  // Parse the range and determine the number type (integer/float)
  const parseRange = (str) => {
    const match = str.match(/(\d+(\.\d+)?)-(\d+(\.\d+)?)/);
    if (match) {
      return { lower: parseFloat(match[1]), upper: parseFloat(match[3]), isFloat: match[2] || match[4] };
    }
    return null;
  };

  const range = parseRange(rangeString) ;

  const handleChange = (event) => {
    const newValue = event.target.value;
    event.stopPropagation();
    setValue(newValue);

    if (range) {
      const numValue = parseFloat(newValue);
      setError(numValue < range.lower || numValue > range.upper || isNaN(numValue));
      if(!(numValue < range.lower || numValue > range.upper || isNaN(numValue))){
        setPlantData(numValue, `usr${keyName}`);
      }
    }
  };

  return (
    <Box >
        <Typography fontWeight="bold" sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} >{keyName}: {currentVal}</Typography>
        <Box sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} >

          <TextField
          error={error}
          helperText={error ? `Enter a number between ${range.lower} and ${range.upper}` : ''}
          value={value}
          defaultValue={currentVal}
          onChange={handleChange}
          type="number"
          label={`min:${range.lower} max:${range.upper}`}
        />
        </Box>
        <Box sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} >
          <Button onClick={() => setPlantData(null, `usr${keyName}`)}>Reset</Button>
        </Box>

    </Box>
  );
};