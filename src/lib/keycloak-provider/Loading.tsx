import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function CircularIndeterminate() {
  return (
    <Box sx={{ height: "100vh", width: "100vw", display: 'flex', justifyContent: "center", alignItems: "center" }}>
      <CircularProgress />
    </Box>
  );
}
