//Reactの書き方
import {Routes, Route } from "react-router-dom";
import Timeline from "../pages/Timeline.jsx";
import Search  from "../pages/Search.jsx";
import Notification from "../pages/Notification.jsx";
import User from "../pages/User.jsx";
import SignIn from "../pages/SignIn.jsx";
import SignUp from "../pages/SignUp.jsx";
import Calendar from "../pages/CalendarView.jsx";

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
      <Route path="/calendar" element={<Calendar />} />
    </Routes>
  );
}