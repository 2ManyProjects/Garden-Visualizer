import React, { useState } from 'react';
import Toolbar from './components/Toolbar';
import Garden from './components/Garden';
import './App.css';

function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [clearGarden, setClearGarden] = useState(false);
  const [gardenDimensions, setGardenDimensions] = useState({  unit: null });
 
  const handleGardenDimensionsChange = (unit) => {
    setGardenDimensions({  unit });
  };

  return (
    <div className="App">
      <Toolbar 
      setEditing={setIsEditing} 
      clearGarden={setClearGarden} 
      onGardenDimensionsChange={handleGardenDimensionsChange} 
      />
      <Garden 
      isEditing={isEditing} 
      clearGarden={clearGarden}
      gardenDimensions={gardenDimensions} />
    </div>
  );
}

export default App;