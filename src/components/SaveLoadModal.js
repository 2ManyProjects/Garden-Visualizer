import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Select, MenuItem, TextField, Button } from '@mui/material';

const DualPurposeModal = ({ modalData, session }) => {
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