import React from 'react';
import { useDispatch } from 'react-redux';
import { setAllPlantData, setRoles, setPlantMacroData } from '../redux/gardenSlice';
import axios from 'axios'; 
import {   Button } from '@mui/material';

 
function imageExists(name) {
  const imagePath = `/src/assets/${name}.png`;
  const xhr = new XMLHttpRequest();

  xhr.open('HEAD', imagePath, false); 

  try {
      xhr.send();
      return (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304;
  } catch (e) {
      return false;
  }
}

const SyncButton = () => {
  const dispatch = useDispatch();

  const handleSync = async () => {
    await fetchSheetData();
  };
  //https://docs.google.com/spreadsheets/d/1evjgI_DQb4dlvvIE-fIfPmGCmJtRH796tsgyBQ-I51E/edit?usp=sharing

  const fetchSheetData = async () => {
    const apiKey = 'AIzaSyBJ06eJiBt8FGOg6KH1SQWgLXEikskMqIY'; 
    const spreadsheetId = '1evjgI_DQb4dlvvIE-fIfPmGCmJtRH796tsgyBQ-I51E'; 
    let range = 'Plant Data'; 
  
    let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  
    try {
      const response = await axios.get(url);
      let template = null;
      let plantList = [];
      let plantDictonary = {};
      for(let x = 0; x < response.data?.values.length; x++){
        let plantData = {};
        if(x === 0){
            template = response.data?.values[x];
        }else {
            let row = response.data?.values[x];
            for(let y = 0; y < template.length; y++){
                plantData[template[y]] = row[y] || null;
            }
            plantList.push(plantData)
        }
      }
      for(let x = 0; x < plantList.length; x++){
        let plant = plantList[x];
        let roles = plant["Perm Role"].includes(",") ? [...plant["Perm Role"].split(",").map(item => item = item.trim())]: [plant["Perm Role"].trim()];
        plant.sheetIndex = x;
        plant.Name = plant.Name.trim();
        for(let y = 0; y < roles.length; y++){
          if(!plantDictonary[roles[y]]){
              plantDictonary[roles[y]] = []
          }
          if (plant.Image) {
            plant.path = plant.Image;
            // console.log('Image exists.');
          } else {
            plant.path = null;
            // console.log('Image does not exist.');
          }
          plantDictonary[roles[y]].push(plant);
        }
      }
      // console.log(plantDictonary);
      dispatch(setRoles(Object.keys(plantDictonary)));
      dispatch(setAllPlantData(plantDictonary));
      range = 'Plant Macros'; 
    
      url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      let macroData = await axios.get(url);
      let plantMacroRequirements = {};
      let plantMacroSources = {};
      template = null;
      let dataSourceIndex = 0;
      for(let x = 0; x < macroData.data?.values.length; x++){
        if([0, 4].includes(x)){
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

  return (
    <Button onClick={handleSync}>Sync</Button>
  );
};

export default SyncButton;