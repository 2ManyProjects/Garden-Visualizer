import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating GUIDs
import { useDispatch, useSelector } from 'react-redux';
import { setPermRole, toggleVisibility, setSelectedPlant, setGardenAnalysis, setPlantMacroData } from '../redux/gardenSlice'; // Import setPlantData
import SyncButton from './SyncButton';
import PlantIcons from './PlantIcons';
import { Select, MenuItem, FormControl, InputLabel, ListItemIcon, Box, ListItemText, Button, TextField, Modal, Typography,  } from '@mui/material';
import axios from 'axios';
import Toolbar from '@mui/material/Toolbar';

const TB = ({ setEditing, clearGarden, onGardenDimensionsChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();
  const { permRoles, selectedPlants, selectedPlant, plantsInGarden, plantMacros, gardenAnalysis } = useSelector(state => state.garden);
  const [selectedPermRole, setSelectedPermRole] = useState('');
  const [open, setOpen] = useState(false);
  const [keys, showKeys] = useState(false);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [unit, setUnit] = useState('');
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
    const apiKey = 'AIzaSyBJ06eJiBt8FGOg6KH1SQWgLXEikskMqIY'; 
    const spreadsheetId = '1evjgI_DQb4dlvvIE-fIfPmGCmJtRH796tsgyBQ-I51E'; 
    let range = 'Plant Macros'; 
  
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  
    try {
      let template = null;
      
      let macroData = await axios.get(url);
      let plantMacroRequirements = {};
      let plantMacroSources = {};
      template = null;
      let dataSourceIndex = 0;
      for(let x = 0; x < macroData.data?.values.length; x++){
        if(["cropType", "Source"].includes(macroData.data?.values[x][0])){
          template = macroData.data?.values[x];
          dataSourceIndex += 1;
          continue;
        }
        let plantMacroRequirement = {};
        let plantMacroSource = {};
        let cell = macroData.data?.values[x];
        for(let y = 0; y < template.length; y++){
          if(dataSourceIndex === 1){
            plantMacroRequirement[template[y]] = cell[y] || null;
          }else if(dataSourceIndex === 2){
            plantMacroSource[template[y]] = cell[y] || null;
          }
        }        
        if(dataSourceIndex === 1){
          plantMacroRequirements[plantMacroRequirement.cropType] = plantMacroRequirement || null;
        }else if(dataSourceIndex === 2){
          plantMacroSources[plantMacroSource.Source] = plantMacroSource || null;
        }
      }
      dispatch(setPlantMacroData({plantMacroRequirements, plantMacroSources}));


    } catch (error) {
      console.error('Error fetching sheet data:', error);
    }
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


    <SyncButton /> 

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
                    <Typography  sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} variant="h8" component="h3">
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