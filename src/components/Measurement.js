import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Select, MenuItem, Button, Box, Modal, TextField, Typography, Menu, IconButton } from '@mui/material'; 

import MenuList from '@mui/material/MenuList'; 
import Paper from '@mui/material/Paper';
import ListItemIcon from '@mui/material/ListItemIcon'; 
  
import DraftsIcon from '@mui/icons-material/Drafts';
import SendIcon from '@mui/icons-material/Send';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';


const Measurement = ({ item, listIndex, isSelected, adjustedEdgeVertSize, adjustedStrokeSize, handlePointMouseDown, conversionFactors, gardenDimensions, calculateDistance, adjustedFontSize, handleMeasurementWidget, widgetWidth, setSelectedMeasurement }) => { 
    let centerPt = null;

    if(isSelected && item.points.length > 2){
        centerPt = { x: 0, y: 0};
        item.points.map((pt) => {
            centerPt.x += pt.x;
            centerPt.y += pt.y;
        })
        centerPt.x /= item.points.length;
        centerPt.y /= item.points.length; 
    } 


    return(
        <React.Fragment key={listIndex}>

        {item.points.length > 0 && (
            <polygon 
            onMouseDown={(e) =>{
                if(!isSelected)
                    setSelectedMeasurement(item)
                else{
                    handleMeasurementWidget(listIndex, e, "center", item)
                }
            }}
            points={item.points.map(p => `${p.x},${p.y}`).join(' ')} style={{ fill: isSelected ? 'rgba(255, 255, 53, 0.3)' : item.colour.rgbString ?? 'rgba(53, 81, 92, 0.3)', stroke: 'blue', strokeWidth: 1 }} />
        )}
        {centerPt && <rect 
            x={centerPt.x - (widgetWidth / 4)} 
            y={centerPt.y - (widgetWidth / 4)} 
            width={(widgetWidth / 2)} 
            height={(widgetWidth / 2)} 
            zIndex={100} 
            strokeWidth={adjustedStrokeSize} 
            onMouseDown={(e) => handleMeasurementWidget(listIndex, e, "center", item)}
            fill={"rgba(0, 0, 127, 0.75)"} 
            />}
        {isSelected && item.points.length > 0 && item.points.map((point, index) => (
            <circle
            key={index}
            cx={point.x}
            cy={point.y}
            zIndex={100}
            r={widgetWidth / 2}
            fill={index === item.lastSelectedPointIndex ? "rgba(127, 0, 0, 0.5)" : "rgba(0, 0, 127, 0.5)"}
            stroke="blue"
            strokeWidth={adjustedStrokeSize}
            onMouseDown={(e) => handlePointMouseDown(index, e, "edge", true, listIndex)}
            // onDoubleClick={() => handlePointDoubleClick(index)}
            style={{ cursor: 'pointer' }}
            />
        ))}
        {isSelected && item.points.length > 0 && item.points.map((point, index) => {
            const nextPoint = item.points[index + 1] || item.points[0];  
            const distance = (calculateDistance(point, nextPoint).toFixed(2) * conversionFactors[gardenDimensions.unit]).toFixed(1); // Adjust decimal places as needed

            // Calculate midpoint for text placement
            const midX = (point.x + nextPoint.x) / 2;
            const midY = (point.y + nextPoint.y) / 2;

            return (
            <g key={index}>
                <line x1={point.x} y1={point.y} x2={nextPoint.x} y2={nextPoint.y}/>
                <text x={midX} y={midY} style={{ fontSize: `${adjustedFontSize}px` }}>
                {distance}
                </text>
            </g>
            );
        })}
        {item.lastSelectedPointIndex != null  && item.lastSelectedPointIndex < item.points.length && (
            <line
            x1={item.points[item.lastSelectedPointIndex].x}
            y1={item.points[item.lastSelectedPointIndex].y}
            x2={item.points[item.lastSelectedPointIndex !== 0 ? item.lastSelectedPointIndex - 1 : item.points.length - 1].x}
            y2={item.points[item.lastSelectedPointIndex !== 0 ? item.lastSelectedPointIndex - 1 : item.points.length - 1].y}
            style={{ stroke: 'yellow', strokeWidth: adjustedStrokeSize }}
            />
        )}
        </React.Fragment >
    )
}


export default Measurement;