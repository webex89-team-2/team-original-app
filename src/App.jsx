import { Route, Routes } from "react-router-dom";
// import App from "@/src/App.jsx";
import Timeline from "@/src/pages/Timeline.jsx";
import Search from "@/src/pages/Search.jsx";
import Notification from "@/src/pages/Notification.jsx";
import User from "@/src/pages/User.jsx";
import Router from "./routes/route.jsx"

export default function App(){
  return <Router />;
}

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<App />} />
//         <Route path="/pages/SignIn" element={<SignIn />} />
//         <Route path="/pages/SingUp" element={<SignUp />} />
//         <Route path="/timeline" element={<Timeline />} />
//         <Route path="/search" element={<Search />} />
//         <Route path="/notification" element={<Notification />} />
//         <Route path="/user/:id" element={<User />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }
