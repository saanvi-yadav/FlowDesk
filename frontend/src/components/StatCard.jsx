import { Box, Typography } from "@mui/material";

function StatCard({ title, value, gradient }) {
  return (
    <Box
      sx={{
        padding: 3,
        borderRadius: 4,
        background: gradient,
        color: "white",
        boxShadow: 4,
        transition: "0.3s",
        "&:hover": {
          transform: "scale(1.05)"
        }
      }}
    >
      <Typography variant="h6">{title}</Typography>
      <Typography variant="h3">{value}</Typography>
    </Box>
  );
}

export default StatCard;