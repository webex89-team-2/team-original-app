import { Route, Routes } from "react-router";
import App from "@/src/App.jsx";
import Timeline from "@/src/pages/Timeline.jsx";
import Search from "@/src/pages/Search.jsx";
import Notification from "@/src/pages/Notification.jsx";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/timeline" element={<Timeline />} />
      <Route path="/search" element={<Search />} />
      <Route path="/notification" element={<Notification />} />
    </Routes>
  );
}
