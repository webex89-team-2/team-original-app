// import { Route, Routes } from "react-router";
// import { Route, Routes } from "react-router-dom";
// import App from "@/src/App.jsx";
// import Timeline from "@/src/pages/Timeline.jsx";
// import Search from "@/src/pages/Search.jsx";
// import Notification from "@/src/pages/Notification.jsx";
// import User from "@/src/pages/User.jsx";

//Reactの書き方
import {Routes, Route } from "react-router-dom";
import Timeline from "../pages/Timeline.jsx";
import Search  from "../pages/Search.jsx";
import Notification from "../pages/Notification.jsx";
import User from "../pages/User.jsx";
import SignIn from "../pages/SignIn.jsx";
import SignUp from "../pages/SignUp.jsx";
import Mypage from "../pages/Mypage.jsx";

export default function Router() {
  return (
    <Routes>
  <Route path="/" element={<SignIn />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/mypage" element={<Mypage />} /> 
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/search" element={<Search />} />
      <Route path="/notification" element={<Notification />} />
      <Route path="/user/:id" element={<User />} />
    </Routes>
  );
}
