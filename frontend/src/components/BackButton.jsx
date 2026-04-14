import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

function BackButton(){

const navigate = useNavigate();

return(

<Button
variant="outlined"
onClick={()=>navigate(-1)}
sx={{mb:2}}
>
← Back
</Button>

);

}

export default BackButton;