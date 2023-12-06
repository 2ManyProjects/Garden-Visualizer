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

  return (
    <Button onClick={handleSync}>Sync</Button>
  );
};

export default SyncButton;

/*
cropType	Unit	nReq	kReq
Moderate	g/m2	2	3
Heavy	g/m2	8	10
Annuals	g/m2	28	37
N Fixer (Full)	g/m2	-10	
N Fixer (Partial)	g/m2	-5	

Canopy Trees (Moderate to Heavy):

Trees like Willow, Slippery Elm, Alder, Black Locust, Honey Locust, Apple, Pear, Poplar, Mulberry, Chestnut, Maple, Wych Elm, Ash, Alder, Hickory, Pecan, Oak have extensive root systems that can access nutrients from deeper soil layers. Canopy trees are generally categorized as moderate to heavy feeders due to their size and growth rate.
Understory Trees and Shrubs (Moderate):

Understory plants like American Hazelnut, Siberian Hazelnut, Dwarf Apple, Japanese Angelica Tree, Linden Tree, Heartnut, Plum, Siberian Peach, Cherry, ServiceBerry, Seabuckthorn, Siberian Pea Shrub, Sumac, American Beauty Berry, Canna Lillies, Pigeon Pea often have moderate nutrient needs. They benefit from the nutrient cycling of the larger canopy trees and can be considered moderate users.
Annuals (Heavy):

Annual crops like Broccoli, Spinach, Swiss Chard, Coriander, Cucumber, Turnip, Beans, Paprika, Tivoli, Butternut, FernLeaf Dill, Mustard Green, Pickle Cucumber, Tomatillo, Tomato, Potato, Yam, Sunchoke, Sweet Corn, Grain Corn are typically heavy feeders because they have to complete their life cycle in one season, which requires a lot of nutrients.
N Fixers (N Fixer Full and Partial):

N Fixers like Alder (Grey) and Black Locust can actually add nitrogen to the soil through their root nodules housing nitrogen-fixing bacteria. They can be categorized as "N Fixer (Full)" because they contribute to the nitrogen content of the soil rather than depleting it.
Smaller N fixers or those that fix less nitrogen comparatively, like Wild Lupin and Pigeon Pea, can be categorized as "N Fixer (Partial)".
Herbaceous and Ground Cover (Moderate to Heavy):

Perennials like Sage, Wild Strawberry, Leek, Onion, Walking Onion, and herbaceous plants with shorter lifespans might fall into the moderate category due to their less intensive nutrient demands compared to annuals.
However, biennials like Swiss Chard and Leek, and annuals like Coriander, Paprika, Tivoli, Butternut, FernLeaf Dill, Mustard Green, Pickle Cucumber, Tomatillo, Tomato, Potatoe, Yam, Sunchoke, Sweet Corn, and Grain Corn are considered heavy users because of their complete lifecycle in a short period, similar to annual vegetables.
*/