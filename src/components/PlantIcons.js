import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PlantIcon from './PlantIcon';
import { Select, MenuItem, FormControl, InputLabel, ListItemIcon, ListItemText } from '@mui/material';
import TreeIcon from '@mui/icons-material/EmojiNature';
import { setSelectedPlant } from '../redux/gardenSlice'; 


const PlantIcons = ({isPlantSelectorEnabled, isEditing, maxHeight}) => {
  const dispatch = useDispatch();
    const { selectedPlants, selectedPermRole, selectedPlant } = useSelector(state => state.garden);

    useEffect(() => {
      if(isEditing && selectedPlant)
        dispatch(setSelectedPlant(null))
    }, [isEditing])
  
    return (
    <FormControl disabled={!isPlantSelectorEnabled} sx={{paddingRight: 2}}>
      <InputLabel>Plant</InputLabel>
      <Select
        // value={selectedValue}
        sx={{maxHeight: maxHeight, minWidth: 100}}
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