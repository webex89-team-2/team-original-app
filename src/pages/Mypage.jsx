import React from "react";
import{ Link, useNavigate } from "react-router-dom";
import{BrowserRouter} from "react-router"

const Mypage =()=>{
    const  navigate = useNavigate();
    return(
        <>
        <h1>マイページ</h1>
        <button onClick = {() => navigate("/signin")}>ログアウト</button>
        </>
    );
};
    export default Mypage;

