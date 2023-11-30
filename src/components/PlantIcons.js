import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PlantIcon from './PlantIcon';
import { Select, MenuItem, FormControl, InputLabel, ListItemIcon, ListItemText } from '@mui/material';
import TreeIcon from '@mui/icons-material/EmojiNature';
import { setSelectedPlant } from '../redux/gardenSlice'; 


const PlantIcons = ({isPlantSelectorEnabled, isEditing}) => {
  const dispatch = useDispatch();
    const { selectedPlants, selectedPermRole, selectedPlant } = useSelector(state => state.garden);

    useEffect(() => {
      if(isEditing && selectedPlant)
        dispatch(setSelectedPlant(null))
    }, [isEditing])
  
    return (
    <FormControl style={{ maxWidth: 400, minWidth: 200,  margin: '10px' }} disabled={!isPlantSelectorEnabled}>
      <InputLabel id="plant-icon-select-label">Plant</InputLabel>
      <Select
        labelId="plant-icon-select-label"
        id="plant-icon-select"
        // value={selectedValue}
        label="Plant"
        onChange={(e) => dispatch(setSelectedPlant(e.target.value))}
      >
        <MenuItem key={"Clear Selection"} value={undefined}>
          <ListItemText primary={"Clear Selection"} />
        </MenuItem>
        {selectedPlants.map((plant, index) => <MenuItem key={`${plant.Latin}#${index}`} value={plant}>
          <ListItemText primary={plant.Name} />
        </MenuItem>)}
         
      </Select>
    </FormControl> 
    );
};

export default PlantIcons;