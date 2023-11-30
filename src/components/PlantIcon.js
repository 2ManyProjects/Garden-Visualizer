import React from 'react';
import Button from '@mui/material/Button';
import TreeIcon from '@mui/icons-material/EmojiNature';

const PlantIcon = ({ Name }) => {
  return (
    <Button
      variant="contained"
      startIcon={<TreeIcon />}
      style={{ maxWidth: 200, maxHeight: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '1px' }}
      sx={{noWrap: true}}
    >
      {Name.length > 15 ? `${Name.substring(0, 15)}...` : Name }
    </Button>
  );
};

export default PlantIcon;