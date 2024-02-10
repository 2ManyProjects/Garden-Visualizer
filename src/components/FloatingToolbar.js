import React, { useState } from 'react';
import { Select, MenuItem, Button, Box, Modal, TextField, Typography, Menu, IconButton } from '@mui/material';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import Launch from '@mui/icons-material/Launch';
import Delete from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/Download';
import Shade from '@mui/icons-material/WbShade';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EnvironmentalDataModal } from './EnvironmentalDataModal';
import { SwatchesPicker } from 'react-color'


const FloatingToolbar = ({ measurementList, selectedMeasurement, setSelectedMeasurement, handleDeleteMeasurement, handleClearMeasurement, handleAddMeasurement, setMeasurementList, calcArea, gardenDimensions, retrieveData, storeData, clear, handleDownload, session, setLocation, clearPlantData, showShadows, setShowShadows, setMeasurementColor}) => {
  const [isVisible, setIsVisible] = useState(false);  
  const [open, setOpen] = useState(false);
  const [colour, setColour] = useState(null);
  const [showColourPicker, setShowColourPicker] = useState(false);
  const [newName, setNewName] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleConfirm = () => {
    let measurement = selectedMeasurement;
    measurement.name = newName;
    // console.log(measurement);
    setMeasurementList(list => list.map(item => {
        if(item.id === measurement.id){
            return measurement;
        }else {
            return item;
        }

    }))
    setSelectedMeasurement(measurement);
    handleClose();
  };


  const handleVisibilityClick = () => {
    setIsVisible(!isVisible);
  };
  const handleAddRemovePoints = () => {
    console.log("handleAddRemovePoints");
    let measurement = selectedMeasurement;
    measurement.addPoints = !measurement.addPoints;
    // console.log(measurement);
    setMeasurementList(list => list.map(item => {
        if(item.id === measurement.id){
            return measurement;
        }else {
            return item;
        }

    }))
    setSelectedMeasurement(measurement);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 2, backgroundColor: isVisible ? '#fff' : 'rgba(0,0,0,0)', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>


        <PopupState anchorOrigin={{ vertical: 'top', horizontal: 'left',} } variant="popover" >
              {(popupState) => (
                <Box >
                  <IconButton variant="contained" {...bindTrigger(popupState)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu {...bindMenu(popupState)} sx={{flexDirection: 'column'}}>
                    <Button
                      color="primary"
                      startIcon={<Delete />}
                      onClick={()=>{
                        popupState.close()
                        clear()
                      }}
                    />
                    <Button
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={()=>{
                        popupState.close()
                        storeData()
                      }}
                    />
                    <IconButton onClick={handleDownload} color="primary" aria-label="download json">
                      <GetAppIcon />
                    </IconButton>
                    {/* Load Button */}
                    <Button
                      color="secondary"
                      startIcon={<Launch />}
                      onClick={()=>{
                        popupState.close()
                        retrieveData()
                      }}
                    />
                    <EnvironmentalDataModal session={session} setLocation={setLocation}/>
                    <Button
                      onClick={()=>{
                        clearPlantData()
                      }}
                    >Clear Plants Config</Button>
                  </Menu>
                </Box>
              )}
        </PopupState>

        <Button onClick={handleVisibilityClick}>
          <VisibilityIcon />
        </Button>
        </Box>
      {isVisible && (
        <>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>

          {session?.data?.coords?.lon && <Button
              color="primary"
              startIcon={<Shade />}
              onClick={()=>{
                setShowShadows(!showShadows)
              }}
          />}
          {measurementList.length > 0 && <Select
            sx={{maxWidth: 100}}
            value={selectedMeasurement || ''}
            onChange={(e) => setSelectedMeasurement(e.target.value)}
            disabled={selectedMeasurement?.addPoints}
          >
          {selectedMeasurement && <MenuItem key={-5} value={null}>
             Deselect Plot
          </MenuItem>}
            {measurementList?.map(measurement => (
              <MenuItem key={measurement.id} value={measurement}>
                {measurement.name || measurement.id}
              </MenuItem>
            ))}
          </Select>}

          {selectedMeasurement && (
            <>
                <Button onClick={handleAddRemovePoints}>
                    {selectedMeasurement.addPoints ? '- Points' : '+ Points'}
                </Button> 

                <Modal
                  open={showColourPicker}
                  onClose={()=> setShowColourPicker(false)}
                  aria-labelledby="colour-modal"
                  aria-describedby="colour-modal-description"
                >
                  <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 400,
                      bgcolor: 'background.paper',
                      boxShadow: 24,
                      p: 4,
                  }}>
                    <SwatchesPicker onChangeComplete={(color) =>{setColour(color)}}/>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button onClick={()=> {
                          setColour(null);
                          setMeasurementColor(null);
                          setShowColourPicker(false);
                        }}>Cancel</Button>
                      <Button onClick={()=> {
                          setMeasurementColor(colour);
                          setShowColourPicker(false);
                        }} sx={{ ml: 1 }}>Confirm</Button>
                    </Box>
                  </Box>
                </Modal>


                <Button onClick={()=> setShowColourPicker(true)}>Set Colour</Button>
                <Button onClick={handleClearMeasurement}>Clear</Button>
                <Button onClick={handleDeleteMeasurement}>Delete</Button>
                <Button onClick={handleOpen}> Rename</Button>
                {selectedMeasurement.points.length > 3 && 
                <text fontWeight="bold" style={{ marginLeft: 2 }}>
                    {`Area: ${calcArea(selectedMeasurement.points).toFixed(2)} sq ${gardenDimensions.unit}`}
                </text>}
            </>
          )}
          </Box>
          {!selectedMeasurement && (
            <>
              <Button onClick={handleAddMeasurement}>Add Plot</Button>
            </>
          )}
        </>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="rename-modal"
        aria-describedby="rename-modal-description"
      >
        <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
        }}>
          <Typography id="rename-modal" variant="h6" component="h2">
            Enter Measurement Name
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="New Name"
            type="text"
            fullWidth
            variant="standard"
            value={newName}
            onChange={(e) => {
              e.stopPropagation();
              setNewName(e.target.value);
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleConfirm} sx={{ ml: 1 }}>Confirm</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default FloatingToolbar;