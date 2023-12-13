import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSession: {},
  permRoles: [],
  selectedPermRole: null,
  selectedPlants: [],
  selectedPlant: null,
  plants: null,
  isVisible: true,
  plantMacros: null,
  astroData: null,
  almanacData: null,
  historicalData: null,
  plantsInGarden: [],
  gardenAnalysis: null
};

export const gardenSlice = createSlice({
  name: 'garden',
  initialState,
  reducers: {
    setPermRole: (state, action) => {
        state.selectedPermRole = action.payload;
        if(state.plants)
            state.selectedPlants = state.plants[action.payload];
    },
    setGardenAnalysis: (state, action) => {
        state.gardenAnalysis = action.payload;
    },
    setPlantsInGarden: (state, action) => {
        state.plantsInGarden = action.payload;
    },
    setSelectedPlant: (state, action) => {
      let local = action.payload?.local;
      state.selectedPlant = action.payload;
      if(local){
        // console.log(action.payload)
        let roles = Object.keys(state.plants);
        // console.log(roles)
        for(let x = 0; x < roles.length; x++){
          let plants = state.plants[roles[x]];
          // console.log(plants)
          for(let y = 0; y < plants.length; y++){
            // console.log(plants[y].sheetIndex, state.selectedPlant.sheetIndex)
            if(plants[y].sheetIndex === state.selectedPlant.sheetIndex){
              // console.log("FOUND ORG");
              state.plants[roles[x]][y] = action.payload;
              state.selectedPlants[y] = action.payload;
              return;
            }
          }
        }
      }

    },
    setAstroData: (state, action) => {
        state.astroData = action.payload;
    },
    setAlmanacData: (state, action) => {
        state.almanacData = action.payload;
    },
    setHistoricalData: (state, action) => {
        state.historicalData = action.payload;
    },
    toggleVisibility: (state) => {
        state.isVisible = !state.isVisible;
    },
    setAllPlantData: (state, action) => {
      let localdata = {...action.payload};
      if(localdata.local){
        delete localdata.local;
        let roles = Object.keys(localdata);
        state.permRoles = roles;
        state.selectedPermRole = roles[0];
        state.selectedPlants = localdata[roles[0]];
      }
      state.plants = localdata;
    },
    setRoles: (state, action) => {
      state.permRoles = action.payload;
    },
    setPlantMacroData: (state, action) => {
      state.plantMacros = action.payload;
    },
    setCurrentSession: (state, action) => {
      // console.log(setCurrentSession, action)
      state.currentSession = action.payload.data;
      // setTimeout(() => {
      //   if(action.payload.storeSession)
      //     action.payload.storeSession(true);
      // }, 50)
    },
  },
});
 
  
  export const { setPermRole, setPlantMacroData, setGardenAnalysis, setPlantsInGarden,  toggleVisibility, setAllPlantData, setRoles, setSelectedPlant, setCurrentSession, setAstroData, setAlmanacData, setHistoricalData} = gardenSlice.actions;
  
  export default gardenSlice.reducer;