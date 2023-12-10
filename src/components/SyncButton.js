import React from 'react';
import { useDispatch } from 'react-redux';
import { setAllPlantData, setRoles, setPlantMacroData } from '../redux/gardenSlice';
import axios from 'axios'; 
import {   Button } from '@mui/material';


const SyncButton = () => {
  const dispatch = useDispatch();

  const handleSync = async () => {
    await fetchSheetData();
  };
  

  const fetchSheetData = async () => {
    var config = {
      method: 'get',
      url: 'https://ytwwg98ey8.execute-api.ca-central-1.amazonaws.com/prod/v1/plants/general',
      headers: {
        'Content-Type': 'application/json'
      },
    };
    
    let plantData = await axios(config) 
    // console.log("PLANTDATA", plantData.data.body, plantData.status);
    if(plantData.status === 200){
      let plantResponse = JSON.parse(plantData.data.body);
      dispatch(setRoles(plantResponse.data.permRoles));
      dispatch(setAllPlantData(plantResponse.data.plants));
      dispatch(setPlantMacroData(plantResponse.data.plantMacros));
    }
  }; 

  return (
    <Button onClick={handleSync}>Sync</Button>
  );
};

export default SyncButton;
 