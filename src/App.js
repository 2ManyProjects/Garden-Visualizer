import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import Garden from './components/Garden';
import './App.css';

function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [clearGarden, setClearGarden] = useState(false);
  const [gardenDimensions, setGardenDimensions] = useState({  unit: null });
  const [openHeightMap, setOpenHeightMap] = useState(false);
 
  const handleGardenDimensionsChange = (unit) => {
    setGardenDimensions({  unit });
  };

  return (
    <div className="App">
      <Toolbar 
      setEditing={setIsEditing} 
      clearGarden={setClearGarden} 
      onGardenDimensionsChange={handleGardenDimensionsChange} 
      setOpenHeightMap={setOpenHeightMap}
      openHeightMap={openHeightMap}
      />
      <Garden 
      isEditing={isEditing} 
      clearGarden={clearGarden}
      openHeightMap={openHeightMap}
      setOpenHeightMap={setOpenHeightMap}
      gardenDimensions={gardenDimensions} />
    </div>
  );
}

export default App;