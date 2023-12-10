import React from 'react';
import { useDispatch } from 'react-redux';
import {   Button } from '@mui/material';


const SyncButton = ({disabled, fetchSheetData}) => {
  const dispatch = useDispatch();

  const handleSync = async () => {
    await fetchSheetData();
  };
  


  return (
    <Button onClick={handleSync} disabled={disabled}>Sync</Button>
  );
};

export default SyncButton;
 