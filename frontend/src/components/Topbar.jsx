import { Avatar, IconButton, Box, Typography, Button } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, clearStoredUser, getAuthHeaders } from "../utils/auth";

function Topbar(){

const navigate = useNavigate();

const user = JSON.parse(localStorage.getItem("user"));

const logout = async ()=>{
try {
await axios.post(`${API_BASE_URL}/logout`, {}, { headers: getAuthHeaders() });
} catch {
// Local logout should still clear stale or expired credentials.
}
clearStoredUser();
navigate("/");
};

return(

<Box
sx={{
height:"70px",
background:"white",
display:"flex",
alignItems:"center",
justifyContent:"space-between",
px:4,
boxShadow:"0px 2px 8px rgba(0,0,0,0.05)"
}}
>

<Typography variant="h6" fontWeight="bold">
FlowDesk
</Typography>

<Box sx={{display:"flex",alignItems:"center",gap:2}}>

<IconButton>
<NotificationsIcon/>
</IconButton>

<Typography>
{user?.name}
</Typography>

<Avatar sx={{background:"#4F46E5"}}>
{user?.name?.charAt(0)}
</Avatar>

<Button
variant="outlined"
size="small"
onClick={logout}
>
Logout
</Button>

</Box>

</Box>

);

}

export default Topbar;
