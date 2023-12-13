import React from 'react';
import { useDispatch } from 'react-redux';
import {   Button } from '@mui/material';


const SyncButton = ({disabled, fetchSheetData, sx}) => {
  const dispatch = useDispatch();

  const handleSync = async () => {
    await fetchSheetData();
  };
  


  return (
    <Button sx onClick={handleSync} disabled={disabled}>Sync</Button>
  );
};

export default SyncButton;
 