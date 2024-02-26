import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating GUIDs
import { useDispatch, useSelector } from 'react-redux';
import { setPermRole, toggleVisibility, setSelectedPlant, setGardenAnalysis, setPlantMacroData, setRoles, setAllPlantData } from '../redux/gardenSlice'; // Import setPlantData
import SyncButton from './SyncButton';
import PlantIcons from './PlantIcons';
import { Select, MenuItem, FormControl, InputLabel, ListItemIcon, Box, ListItemText, Button, TextField, Modal, Typography, ToggleButton, TextareaAutosize, FormControlLabel, Checkbox, OutlinedInput, Chip,  } from '@mui/material';
import axios from 'axios';
import Toolbar from '@mui/material/Toolbar';
import Shade from '@mui/icons-material/WbShade';

const TB = ({ showShadows, setShowShadows, setEditing, clearGarden, onGardenDimensionsChange, openHeightMap, setOpenHeightMap, setOpenFeedBackModal, openFeedBackModal, setOpenPlantModal,openPlantModal, areaStr}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const fetching = useRef(false);
  const dispatch = useDispatch();
  const { permRoles, selectedPlants, selectedPlant, plantsInGarden, plantMacros, gardenAnalysis, currentSession } = useSelector(state => state.garden);
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
  /*

    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 2, backgroundColor: isVisible ? '#fff' : 'rgba(0,0,0,0)', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  */

  return (
  <Toolbar sx={{position: 'fixed', top: 0, left: 0, right: 0, padding: 2, zIndex: 50, backgroundColor: '#fff'}}>
    <Box sx={{display: 'flex', maxHeight: 50, flexDirection: 'row', justifyContent: 'space-between', width: "100%"}}>
      <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
        <Box sx={{display: 'flex', flexDirection: 'column'}}>
          <Button sx={{maxHeight: 20}} onClick={() => {
            showKeys(true)
            }}>Help</Button>
          <SyncButton  sx={{maxHeight: 20}}  disabled={isFetching} fetchSheetData={fetchSheetData}/> 
        </Box>

        {currentSession?.data?.coords?.lon && <Button
            color="primary"
            startIcon={<Shade />}
            onClick={()=>{
              setShowShadows(!showShadows)
            }}
        />}

      <Box>
        {gardenAnalysis && (gardenAnalysis.nReq.toFixed(2) !== "0.00" || gardenAnalysis.kReq.toFixed(2) !== "0.00") && <Box>
          
          <Typography fontSize={13} >
            {areaStr}
          </Typography>
          <Typography fontSize={13}>{`N: ${gardenAnalysis.nReq.toFixed(2)}g`}</Typography>  
          <Typography fontSize={13}>{`K: ${gardenAnalysis.kReq.toFixed(2)}g`}</Typography>  
          
        </Box>}
      </Box>
      </Box>
      <Box sx={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}> 
        <FormControl sx={{paddingRight: 2,}}>
          <InputLabel>Unit</InputLabel>
          <Select sx={{maxHeight: 50, width: '5vw'}}value={unit} onChange={(e) => setUnit(e.target.value)}>
              <MenuItem value="cm">cm</MenuItem>
              <MenuItem value="m">m</MenuItem>
              <MenuItem value="in">in</MenuItem>
              <MenuItem value="ft">ft</MenuItem>
              <MenuItem value="y">yards</MenuItem>
              <MenuItem value="ac">acre</MenuItem>
              <MenuItem value="ha">hectare</MenuItem>
          </Select>
        </FormControl>



        {permRoles.length > 0 && <FormControl sx={{paddingRight: 2}}>
          <InputLabel>Role</InputLabel>
          <Select
            sx={{maxHeight: 50, minWidth: '10vw'}} 
            value={selectedPermRole}
            onChange={handlePermRoleChange}
          >
            {permRoles.map(permRole => <MenuItem key={permRole} value={permRole}>
              <ListItemText primary={permRole} />
            </MenuItem>)}
            
          </Select>
        </FormControl> }
        {selectedPlants?.length > 0 && <PlantIcons maxHeight={30} isPlantSelectorEnabled={isPlantSelectorEnabled} isEditing />}   

        {selectedPlant && <Button onClick={handleOpen}>Plant Config</Button>}
        <Button onClick={toggleEdit}>{isEditing ? 'Done' : 'Add Points'}</Button>
        <Button sx={{color: 'red'}} onClick={() => {
          clearGarden(true)
          setTimeout(() => { clearGarden(false)}, 50)
          }}>DELETE</Button> 
      </Box>

      <Box sx={{ paddingTop: 1}}>
        {currentSession?.data?.coords?.lat && <Button onClick={() => setOpenHeightMap(!openHeightMap)}>HeightMap</Button>}
        <Button onClick={() => setOpenFeedBackModal(true)}>Feedback</Button>
        <Button onClick={() => setOpenPlantModal(true)}>New Plant</Button>
      </Box>
    </Box>


    <FeedbackModal open={openFeedBackModal} handleClose={() => setOpenFeedBackModal(false)} />
    {plantMacros?.plantMacroRequirements && <PlantSubmitModal open={openPlantModal} handleClose={() => setOpenPlantModal(false)} />}
    {selectedPlant && <Modal
      open={open}
      onClose={handleClose}
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
        overflowY: 'scroll',
        height: '80%'
      }}>
        <Typography  sx={{ display: 'flex',justifyContent: 'center',alignItems: 'center'}} id="rename-modal" variant="h6" component="h2">
        Info: {selectedPlant?.Name}, {selectedPlant?.Latin}
        </Typography>

        {selectedPlant && Object.keys(selectedPlant).sort().map((item, index) => {
          const regex = /(\d+(\.\d+)?)-(\d+(\.\d+)?)/;
          if( ["sheetIndex", "Image", "path", "Name", "Latin",  "id", "local", "shadow", "nutrientCalc"].includes(item) || /^usr/.test(item))
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
              {typeof selectedPlant[item] !== "object" && `${item !== "Variety|Rootstock" ? item : "Rootstock"}:  ${selectedPlant[item] }`}
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
        {/* <Typography fontWeight="bold">
          {`Zoom In/Out/Reset: +/-/Space`}
        </Typography> */}
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

const FeedbackModal = ({ open, handleClose }) => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    // console.log(feedback);
    
    var config = {
      method: 'post',
      url: 'https://ytwwg98ey8.execute-api.ca-central-1.amazonaws.com/prod/v1/anon/feedback',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { message: feedback},
      // params: {consume: true}
    };
  
    let sendFeedbackRequest = await axios(config) 
    // console.log(sendFeedbackRequest)
    handleClose();
  };
  const maxLength = 1000;
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
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
      }}>
        <Typography variant="h6">Feedback</Typography>
        <TextareaAutosize
          minRows={3}
          maxRows={6}
          placeholder={`Any Feature requests, bugs, plant submissions (max ${maxLength} characters)`}
          style={{ width: '100%' }}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={maxLength}
        />
        <Button variant="contained" onClick={handleSubmit} disabled={feedback.length === 0 || feedback.length > maxLength}>
          Submit
        </Button>
        <Button variant="contained" onClick={handleClose}>
          Close
        </Button>
      </Box>
    </Modal>
  );
};


const PlantSubmitModal = ({ open, handleClose }) => {
  const [plantData, setPlantData] = useState({
    "Crop Type": "",
    "Crown Spread (m)": "",
    "Latin": "",
    "Lifespan": "",
    "Max Height": "",
    "Cultivar": "",
    "Name": "",
    "Perm Role": "",
    "Root Depth (m)": "",
    "Root System": "",
    "Source": "",
    "Usage Notes": "",
    "Variety|Rootstock": "",
  });

  const [errors, setErrors] = useState({});
  const [showYieldStructure, setShowYieldStructure] = useState(false);
  // Add state for Yield Structure fields
  const [yieldStructure, setYieldStructure] = useState({
    harvestUnit: "",
    peakYield: "",
    peakYieldEnd: "",
    peakYieldStart: "",
    timeUnit: "",
    yieldEnd: "",
    yieldStart: "",
    anYieldUnit: "",
    anYieldStart: "",
    anYieldEnd: ""
  });

  const { permRoles, selectedPlants, selectedPlant, plantsInGarden, plantMacros, gardenAnalysis, currentSession } = useSelector(state => state.garden);

  const rangePattern = /^(\d+(\.\d+)?)-(\d+(\.\d+)?)$/;

  const validate = (input) => {
    let tempErrors = {};
    let pData = input || plantData;
    if(input){
      Object.keys(pData).forEach(key => {
  
      if (key !== "Usage Notes" && pData[key] && typeof pData[key] === "string" &&  pData[key].includes('-')) {
        const match = pData[key].match(rangePattern);
        console.log(match)
        if (!match || parseFloat(match[1]) >= parseFloat(match[3])) {
          tempErrors[key] = "Invalid range. Expected format: X.X-Y.Y with X.X < Y.Y";
        }
      }
      });
      setErrors(tempErrors);
      console.log(tempErrors);
      return Object.keys(tempErrors).length === 0;
    }
    return Object.keys(errors).length === 0;
  };
  useEffect(() => {
    setYieldStructure({
      harvestUnit: "",
      peakYield: "",
      peakYieldEnd: "",
      peakYieldStart: "",
      timeUnit: "",
      yieldEnd: "",
      yieldStart: "",
      anYieldUnit: "",
      anYieldStart: "",
      anYieldEnd: ""
    });
    setShowYieldStructure(false);
    setPlantData({
      "Crop Type": "",
      "Crown Spread (m)": "",
      "Latin": "",
      "Lifespan": "",
      "Max Height": "",
      "Cultivar": "",
      "Name": "",
      "Perm Role": "",
      "Root Depth (m)": "",
      "Root System": "",
      "Source": "",
      "Usage Notes": "",
      "Variety|Rootstock": ""
    });

  }, [])

  const handleChange = (event) => {
    // console.log(event);
    setPlantData({ ...plantData, [event.target.name]: event.target.value });
  };

  const handleChangeRange = (event) => {
    console.log(event.target.value);
    if(typeof event.target.value === "string" && event.target.value.includes("-")){

    }else if(isNaN(parseFloat(event.target.value))) {
      return
    }else {
      setPlantData({ ...plantData, [event.target.name]: parseFloat(event.target.value) });
      validate({ ...plantData, [event.target.name]: parseFloat(event.target.value) });
      return
    }
    setPlantData({ ...plantData, [event.target.name]: event.target.value });
    validate({ ...plantData, [event.target.name]: event.target.value });
  };
  const handleCheckboxChange = (event) => {
    setShowYieldStructure(event.target.checked);
    if (!event.target.checked) {
      setYieldStructure({
        harvestUnit: "",
        peakYield: "",
        peakYieldEnd: "",
        peakYieldStart: "",
        timeUnit: "",
        yieldEnd: "",
        yieldStart: "",
        anYieldUnit: "",
        anYieldStart: "",
        anYieldEnd: ""
      });
    }
  };

  const handleSubmit = async() => {
    if (validate()) {
      let data = {...plantData, "Yield Structure": null }
      if(showYieldStructure){
        data["Yield Structure"] = {...yieldStructure};
      }
      var config = {
        method: 'post',
        url: 'https://ytwwg98ey8.execute-api.ca-central-1.amazonaws.com/prod/v1/anon/feedback/plant',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { plant: data},
        // params: {consume: true}
      };
    
      let sendPlantFeedbackRequest = await axios(config) 
      console.log(sendPlantFeedbackRequest);
      handleClose();
    } else {
      console.log('Validation errors', errors);
    }
  }
  
  const handleYieldStructureChange = (event) => {
    setYieldStructure({ ...yieldStructure, [event.target.name]: event.target.value });
  };


  const isValidInput = (value, unit) => {
    if (!value) return true; // Empty values are always valid

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return false;

    switch (unit) {
      case 'd': return num <= 365;
      case 'w': return num <= 52;
      case 'm': return num <= 12;
      case 'y': return num > 0 && Math.floor(num) === num; // No floats for 'y'
      default: return false;
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        height: '80%',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'scroll',
      }}>
        <Typography variant="h6" component="h2"> 
        Submit Plant for Consideration (* Required)
      </Typography>
      

      <FormControl>
        <InputLabel>{"Crop Nutrient Uptake *" }</InputLabel>
        <Select value={plantData["Crop Type"]} label="Crop Type *"  name="Crop Type" onChange={handleChange}>
          {Object.keys(plantMacros?.plantMacroRequirements).map((item, index) => {
            let val = plantMacros?.plantMacroRequirements[item];
            let unit = plantMacros?.plantMacroRequirements[item].Unit;
            return (
              <MenuItem value={item}>{`${item}: N:${val.nReq}${unit} P:${val.kReq}${unit}`}</MenuItem>
            )
          })}
        </Select>
      </FormControl>


        <TextField label="Crown Spread (m) *" name="Crown Spread (m)" onChange={handleChangeRange} value={plantData["Crown Spread (m)"]} error={!!errors["Crown Spread (m)"]} helperText={errors["Crown Spread (m)"]} />
        
        <TextField label="Latin *" name="Latin" onChange={handleChange} value={plantData["Latin"]} error={!!errors["Latin"]} helperText={errors["Latin"]} />
{/* TODO: Change From Text field into Select allow for Annual, Perennial, Other (lifespan input) */}
        <TextField label="Lifespan *" name="Lifespan" onChange={handleChangeRange} value={plantData["Lifespan"]} error={!!errors["Lifespan"]} helperText={errors["Lifespan"]} />

        <TextField label="Max Height (m) *" name="Max Height" onChange={handleChangeRange} value={plantData["Max Height"]} error={!!errors["Max Height"]} helperText={errors["Max Height"]} />

        <TextField label="Cultivar" name="Cultivar" onChange={handleChange} value={plantData["Cultivar"]} error={!!errors["Cultivar"]} helperText={errors["Cultivar"]} />

        <TextField label="Name *" name="Name" onChange={handleChange} value={plantData["Name"]} error={!!errors["Name"]} helperText={errors["Name"]} />

        <FormControl>
          <InputLabel>{"Perm Role *" }</InputLabel>
          <Select
              multiple
              label="Perm Role *" 
              name="Perm Role"
              errors={!!errors["Perm Role"]} 
              value={plantData["Perm Role"] || []}
              onChange={handleChange}
              input={<OutlinedInput label="Perm Role *" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
          >
            <MenuItem value="Other">
              Other
            </MenuItem>
            {permRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {plantData["Perm Role"] && plantData["Perm Role"]?.find(item => item.includes("Other")) && <TextField label="Perm Role *" name="Perm Role" onChange={(e)=>{
          let val = e.target.value;
          let index = plantData["Perm Role"].findIndex(item => item.includes("Other"))
          let roles = plantData["Perm Role"];
          roles[index] = `Other${val.length > 0 ? ":" : ""}${val}`
          setPlantData({ ...plantData, ["Perm Role"]: roles });
        }} error={!!errors["Perm Role"]} helperText={errors["Perm Role"]} />}

        <FormControl>
          <InputLabel>{"Root System *" }</InputLabel>
          <Select
              label="Root System *" 
              name="Root System"
              error={!!errors["Root System"]} 
              value={plantData["Root System"]}
              onChange={handleChange}
              // input={<OutlinedInput label="Root System *" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                <Chip key={selected} label={selected} />
                </Box>
              )}
          >
            {["Fibrous","Deep Taproot", "Rhizomatous", "Tuber", "Fibrous Taproot", "Taproot"].map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </FormControl>


        <TextField label="Source" name="Source" onChange={handleChange} value={plantData["Source"]} error={!!errors["Source"]} helperText={errors["Source"]} />

        <TextField label="Usage Notes" name="Usage Notes" onChange={handleChange} value={plantData["Usage Notes"]} error={!!errors["Usage Notes"]} helperText={errors["Usage Notes"]} />
        <TextField label="Other Notes" name="Other Notes" onChange={handleChange} value={plantData["Other Notes"]} error={!!errors["Other Notes"]} helperText={errors["Other Notes"]} />

        <TextField label="Rootstock" name="Variety|Rootstock" onChange={handleChange} value={plantData["Variety|Rootstock"]} error={!!errors["Variety|Rootstock"]} helperText={errors["Variety|Rootstock"]} />
                
        <FormControlLabel
          control={<Checkbox checked={showYieldStructure} onChange={handleCheckboxChange} />}
          label="Add Yield Structure"
        />
        {showYieldStructure && (
          <>

            <FormControl>
              <InputLabel>{"Harvest Vol|Weight Unit *" }</InputLabel>
              <Select
                  label="Harvest Unit *" 
                  name="harvestUnit"
                  error={!!errors["harvestUnit"]} 
                  value={yieldStructure["harvestUnit"]}
                  onChange={handleYieldStructureChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip key={selected} label={selected} />
                    </Box>
                  )}
              >
                {["kg","g", "cord", "bushel", "L", "piece"].map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>


            <FormControl>
              <InputLabel>{"Time Unit (Peak/Lifetime Yeild)*" }</InputLabel>
              <Select
                  label="Time Unit *" 
                  name="timeUnit"
                  error={!!errors["timeUnit"]} 
                  value={yieldStructure["timeUnit"]}
                  onChange={handleYieldStructureChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip key={selected} label={selected} />
                    </Box>
                  )}
              >
                {["d","w", "m", "y"].map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>{"Annual Harvest Time Unit *" }</InputLabel>
              <Select
                  label="Annual Harvest Time Unit *" 
                  name="anYieldUnit"
                  error={!!errors["anYieldUnit"]} 
                  value={yieldStructure["anYieldUnit"]}
                  onChange={handleYieldStructureChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip key={selected} label={selected} />
                    </Box>
                  )}
              >
                {["d","w", "m"].map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
                        
            {yieldStructure["harvestUnit"] && <TextField label="Peak Yield Quanity" name="peakYield" onChange={handleYieldStructureChange} value={yieldStructure.peakYield} />}
            
            {yieldStructure["timeUnit"] && <TextField label="Peak Yield Start" name="peakYieldStart" onChange={handleYieldStructureChange} value={yieldStructure.peakYieldStart}
            disabled={!yieldStructure.timeUnit}
            error={!isValidInput(yieldStructure.peakYieldStart, yieldStructure.timeUnit)}
            helperText={!isValidInput(yieldStructure.peakYieldStart, yieldStructure.timeUnit) ? "Invalid input based on time unit" : ""}
            />}
            
            
            
            {yieldStructure["timeUnit"] &&<TextField label="Peak Yield End" name="peakYieldEnd" onChange={handleYieldStructureChange} value={yieldStructure.peakYieldEnd}
            disabled={!yieldStructure.timeUnit}
            error={!isValidInput(yieldStructure.peakYieldEnd, yieldStructure.timeUnit)}
            helperText={!isValidInput(yieldStructure.peakYieldEnd, yieldStructure.timeUnit) ? "Invalid input based on time unit" : ""}
            />}
            {yieldStructure["timeUnit"] && <TextField label="LifeTime Yield Start" name="yieldStart" onChange={handleYieldStructureChange} value={yieldStructure.yieldStart}
            disabled={!yieldStructure.timeUnit}
            error={!isValidInput(yieldStructure.yieldStart, yieldStructure.timeUnit)}
            helperText={!isValidInput(yieldStructure.yieldStart, yieldStructure.timeUnit) ? "Invalid input based on time unit" : ""}
            />}
            
            {yieldStructure["timeUnit"] && <TextField label="LifeTime Yield Yield End" name="yieldEnd" onChange={handleYieldStructureChange} value={yieldStructure.yieldEnd}
            disabled={!yieldStructure.timeUnit}
            error={!isValidInput(yieldStructure.yieldEnd, yieldStructure.timeUnit)}
            helperText={!isValidInput(yieldStructure.yieldEnd, yieldStructure.timeUnit) ? "Invalid input based on time unit" : ""}
            />}
            
            {yieldStructure["anYieldUnit"] && <TextField label="Annual Harvest Yield Start" name="anYieldStart" onChange={handleYieldStructureChange} value={yieldStructure.anYieldStart}
            disabled={!yieldStructure.anYieldUnit}
            error={!isValidInput(yieldStructure.anYieldEnd, yieldStructure.anYieldUnit)}
            helperText={!isValidInput(yieldStructure.anYieldEnd, yieldStructure.anYieldUnit) ? "Invalid input based on time unit" : ""}
            />}
            
            {yieldStructure["anYieldUnit"] && <TextField label="Annual Harvest Yield End" name="anYieldEnd" onChange={handleYieldStructureChange} value={yieldStructure.anYieldEnd}
            disabled={!yieldStructure.anYieldUnit}
            error={!isValidInput(yieldStructure.anYieldEnd, yieldStructure.anYieldUnit)}
            helperText={!isValidInput(yieldStructure.anYieldEnd, yieldStructure.anYieldUnit) ? "Invalid input based on time unit" : ""}
          />}
          </>
        )}
        <Button onClick={handleSubmit}>Submit</Button>
      </Box>
    </Modal>
  );
};