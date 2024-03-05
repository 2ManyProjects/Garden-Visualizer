import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Measurement from './Measurement';




const MeasurementList = ({ measurementList, adjustedEdgeVertSize, adjustedStrokeSize, handlePointMouseDown, selectedMeasurement, conversionFactors, gardenDimensions, calculateDistance, adjustedFontSize, widgetWidth, handleMeasurementWidget, setSelectedMeasurement, isEditing }) => {

  return(
      <>
          {measurementList?.map((item, listIndex) => {
        let isSelected = item.id === selectedMeasurement?.id
        return(
          <Measurement 
          item={item} 
          isEditing={isEditing}
          listIndex={listIndex}
          isSelected={isSelected} 
          setSelectedMeasurement={setSelectedMeasurement}
          selectedMeasurement={selectedMeasurement}
          adjustedEdgeVertSize={adjustedEdgeVertSize}
          adjustedStrokeSize={adjustedStrokeSize}
          handlePointMouseDown={handlePointMouseDown} 
          conversionFactors={conversionFactors}
          gardenDimensions={gardenDimensions}
          calculateDistance={calculateDistance}
          adjustedFontSize={adjustedFontSize}
          widgetWidth={widgetWidth}
          handleMeasurementWidget={handleMeasurementWidget}
           />
        )
      })}
      </>
  )
}


export default MeasurementList;