import { useState } from 'react';
import { styled, alpha } from '@mui/material/styles';
import { InputBase, Box, CircularProgress, Popover, List, ListItem, ListItemText, ListItemIcon, Typography } from '@mui/material';
import { Search as SearchIcon, Description as FileIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activityService';
import { File } from '../../types';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<File[]>([]);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  
  const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchTerm(value);
    
    if (value.length < 2) {
      setResults([]);
      setAnchorEl(null);
      return;
    }
    
    setIsSearching(true);
    setAnchorEl(event.currentTarget);
    
    try {
      const response = await activityService.search(value);
      setResults(response.results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleResultClick = (fileId: string) => {
    navigate(`/files/${fileId}`);
    setSearchTerm('');
    setResults([]);
    setAnchorEl(null);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const open = Boolean(anchorEl) && (results.length > 0 || isSearching);
  
  return (
    <Box sx={{ position: 'relative', flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
      <Search>
        <SearchIconWrapper>
          {isSearching ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SearchIcon />
          )}
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search files…"
          inputProps={{ 'aria-label': 'search' }}
          value={searchTerm}
          onChange={handleSearch}
        />
      </Search>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: anchorEl?.clientWidth,
            maxHeight: 400,
            mt: 1,
            boxShadow: 3,
          }
        }}
      >
        {isSearching ? (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : results.length > 0 ? (
          <List dense>
            {results.map((file) => (
              <ListItem 
                key={file.id} 
                button 
                onClick={() => handleResultClick(file.id)}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <ListItemIcon>
                  <FileIcon 
                    fontSize="small" 
                    color={file.is_favorite ? 'secondary' : 'action'} 
                  />
                </ListItemIcon>
                <ListItemText 
                  primary={file.title} 
                  secondary={`${file.author} - ${new Date(file.uploaded_at).toLocaleDateString()}`} 
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No results found
            </Typography>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default SearchBar;