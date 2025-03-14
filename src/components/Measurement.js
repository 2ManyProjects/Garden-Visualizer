import React from 'react';



const Measurement = ({ item, listIndex, isSelected, adjustedEdgeVertSize, adjustedStrokeSize, handlePointMouseDown, conversionFactors, gardenDimensions, calculateDistance, adjustedFontSize, handleMeasurementWidget, widgetWidth, setSelectedMeasurement, selectedMeasurement, isEditing }) => { 
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
    if(item.hide)
        return null;

    return(
        <React.Fragment key={listIndex}>

        {item.points.length > 0 && (
            <polygon 
            onMouseDown={(e) =>{
                // console.log(selectedMeasurement)
                if(!isSelected){
                    if((!selectedMeasurement || !selectedMeasurement.addPoints) && !isEditing)
                        setSelectedMeasurement(item)
                }else{
                    handleMeasurementWidget(listIndex, e, "center", item)
                }
            }}
            points={item.points.map(p => `${p.x},${p.y}`).join(' ')} style={{ fill: isSelected ? 'rgba(255, 255, 53, 0.3)' : item?.colour?.rgbString ?? 'rgba(53, 81, 92, 0.3)', stroke: 'blue', strokeWidth: 1 }} />
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
                <text x={midX} y={midY} style={{ 
                    fontSize: `${adjustedFontSize}px` , 
                    userSelect: 'none', 
                    WebkitUserSelect: 'none', 
                    msUserSelect: 'none'}}>
                {distance}{gardenDimensions.unit}
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