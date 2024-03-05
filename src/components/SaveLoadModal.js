import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Select, MenuItem, TextField, Button } from '@mui/material';

import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


const DualPurposeModal = ({ modalData, session, retrieveData }) => {
  const { type, selectionData, confirmFunction, open, handleClose } = modalData;
  const [selectedOption, setSelectedOption] = useState('');
  const [newName, setNewName] = useState('');
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
    if (type === 'S' && event.target.value === 'Save New') {
      setIsConfirmDisabled(newName.length < 3);
    } else {
      setIsConfirmDisabled(false);
    }
  };

  const handleNameChange = (event) => {
    event.stopPropagation();
    setNewName(event.target.value);
    setIsConfirmDisabled(event.target.value.length < 3);
  };

  const handleConfirm = () => {
    if (type === 'S' && (selectedOption === 'Save New' || session.name === null)) {
      confirmFunction(newName, true);
    } else {
      confirmFunction(selectedOption);
    }
    handleClose();
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6">{type === 'S' ? 'Save' : 'Load'}</Typography>
        <Select
          value={selectedOption}
          MenuProps={{
            PaperProps: { sx: { maxHeight: 200 }}
          }}
          onChange={handleSelectChange}
          fullWidth
        >
          {type === 'S' && <MenuItem value="Save New">Save New</MenuItem>}
          {selectionData?.map((option, index) => (
            <MenuItem key={index} value={option}>{option}</MenuItem>
          ))}
        </Select>
        {type === 'S' && (selectedOption === 'Save New' || session.name === null) && (
          <TextField
            label="New Name"
            variant="outlined"
            value={newName}
            onChange={handleNameChange}
            fullWidth
          />
        )}
        {type ==='L' && <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>
          Upload file
          <VisuallyHiddenInput type="file" accept=".json,application/json" onChange={(event)=>{
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const text = e.target.result;
                try {
                  const obj = JSON.parse(text);
                  let jsonValue = JSON.parse(localStorage.getItem("GardenPlanStorage"));
                  console.log(obj, jsonValue)
                  for(let x = 0; x < obj.length; x++){
                    if(!jsonValue.find(item => item.id === obj[x].id)){
                      jsonValue.push(obj[x])
                    }else {
                      let index = jsonValue.findIndex(item => item.id === obj[x].id);
                      jsonValue[index] = {...jsonValue[index], ...obj[x]};
                    }
                  }
                  localStorage.setItem("GardenPlanStorage", JSON.stringify(jsonValue));
                  console.log('STORED JSON object:', jsonValue);
                  handleClose();
                  retrieveData();
                  // Handle the parsed object here (e.g., setting state or calling a prop function)
                } catch (error) {
                  console.error('Error parsing JSON:', error);
                  // Handle errors here
                }
              };
              reader.readAsText(file);
            }
          }}/>
        </Button>}
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
        >
          Confirm
        </Button>
      </Box>
    </Modal>
  );
};

export default DualPurposeModal;