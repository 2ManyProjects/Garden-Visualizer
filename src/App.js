import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import Garden from './components/Garden';
import './App.css';

function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [clearGarden, setClearGarden] = useState(false);
  const [openFeedBackModal, setOpenFeedBackModal] = useState(false);
  const [openPlantModal, setOpenPlantModal] = useState(false);
  const [gardenDimensions, setGardenDimensions] = useState({  unit: null });
  const [openHeightMap, setOpenHeightMap] = useState(false);
  const [areaStr, setAreaStr] = useState(''); 
  const [scale, setScale] = useState(1);
  const [showShadows, setShowShadows] = useState(true);
 
  const handleGardenDimensionsChange = (unit) => {
    setGardenDimensions({  unit });
  };

  return (
    <div className="App">
      <Toolbar 
      setEditing={setIsEditing} 
      clearGarden={setClearGarden} 
      showShadows={showShadows}
      setShowShadows={setShowShadows}
      onGardenDimensionsChange={handleGardenDimensionsChange} 
      setOpenHeightMap={setOpenHeightMap}
      openHeightMap={openHeightMap}
      setOpenFeedBackModal={setOpenFeedBackModal}
      openFeedBackModal={openFeedBackModal}
      setOpenPlantModal={setOpenPlantModal}
      openPlantModal={openPlantModal}
      areaStr={areaStr}
      />
      <Garden
      showShadows={showShadows}
      setShowShadows={setShowShadows}
      setGlobalScale={setScale}
      isEditing={isEditing} 
      clearGarden={clearGarden}
      openHeightMap={openHeightMap}
      setOpenHeightMap={setOpenHeightMap}
      gardenDimensions={gardenDimensions}
      setOpenFeedBackModal={setOpenFeedBackModal}
      openFeedBackModal={openFeedBackModal} 
      areaStr={areaStr}
      setAreaStr={setAreaStr}/>
    </div>
  );
}

export default App;