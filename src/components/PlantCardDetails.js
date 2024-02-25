
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { setAllPlantData, setCurrentSession, setPlantsInGarden, setSelectedPlant} from '../redux/gardenSlice'; 
import { Typography, Box, Modal, IconButton, Card, CardActions, CardContent, Button, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close'


const PlantCardDetails = ({selectedPlant, plantsInGarden, setLastSelectedPlant, calculateCrownSpread, gardenDimensions}) => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [crownSpread, setCrownSpread] = useState(selectedPlant?.crownDia || 0);
    const [height, setHeight] = useState(selectedPlant?.height || 0);
    const [shadow, setShadow] = useState(selectedPlant?.shadow || null );
    const [nutrientCalc, setNutrientCalc] = useState(selectedPlant?.nutrientCalc  || null );
    // console.log(selectedPlant);
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
              let plantObj = {...plant, x: item.x, y: item.y}
              plant = plantObj
              return plant;
          }else {
              return item;
          }

      });
      dispatch(setPlantsInGarden(newPlantsInGarden));
      setLastSelectedPlant(plant);
      handleClose();
    }; 
    const saveNutrientCalc = () => {
      validOrClose();
      let plant = {...selectedPlant};
      plant.nutrientCalc = !nutrientCalc; 
      setNutrientCalc(plant.nutrientCalc);
      
      const newPlantsInGarden = plantsInGarden.map(item => {
        if(item.id === plant.id){
            let plantObj = {...plant, x: item.x, y: item.y}
            plant = plantObj
            return plant;
        }else {
            return item;
        }

    });
      dispatch(setPlantsInGarden(newPlantsInGarden));
      setLastSelectedPlant(plant);
    }
    const saveShadow = () => {
      console.log('saveShadow');
      validOrClose();
      let plant = {...selectedPlant};
      plant.shadow = !shadow; 
      console.log(!shadow)
      const newPlantsInGarden = plantsInGarden.map(item => {
          if(item.id === plant.id){
              let plantObj = {...plant, x: item.x, y: item.y}
              plant = plantObj
              return plant;
          }else {
              return item;
          }

      });
      setShadow(plant.shadow);
      dispatch(setPlantsInGarden(newPlantsInGarden));
      setLastSelectedPlant(plant);
    }

    const saveCrownSpread = (crownSpread) => {
      validOrClose();
      let plant = {...selectedPlant};
      plant.crownSpread = calculateCrownSpread(crownSpread, gardenDimensions);
      plant.crownDia = crownSpread; 

      
      const newPlantsInGarden = plantsInGarden.map(item => {
        if(item.id === plant.id){
            let plantObj = {...plant, x: item.x, y: item.y}
            plant = plantObj
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
            let plantObj = {...plant, x: item.x, y: item.y}
            plant = plantObj
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
        top: '30vh', 
      }}> 
       {/* <Button sx={{ pointerEvents: 'auto' }}>I am clickable</Button> */}

      <Card variant="outlined" sx={{ width: '20vw',height: '50vh', overflowY: 'scroll',}}>
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
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <ToggleButtonGroup exclusive>
        <ToggleButton
          value="shadow"
          selected={shadow === null ? true : shadow}
          onClick={()=>{
            console.log("shade")
            saveShadow();
          }}
          sx={{ m: 1 }}
        >
          Shadow
        </ToggleButton>
        <ToggleButton
          value="nutrientCalc"
          selected={nutrientCalc === null ? true : nutrientCalc}
          onClick={()=>{
            console.log("saveNutrientCalc")
            saveNutrientCalc();
          }} 
          sx={{ m: 1 }}
        >
          Nutrient Calc
        </ToggleButton>
      </ToggleButtonGroup>
      </Box>
          
        </CardContent>
        <CardActions>
          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
            
            <Box sx={{display: 'flex', flexDirection: 'row'}}>
              <Button size="small" onClick={() => {
                validOrClose(); 
                dispatch(setPlantsInGarden(plantsInGarden.filter((plant, i) => plant.id !== selectedPlant.id)))
                setLastSelectedPlant(null);
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

  export default PlantCardDetails