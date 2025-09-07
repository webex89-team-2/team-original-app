// import { createRoot } from "react-dom/client";
import Router from "./routes/route.jsx";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>
);

// const root = createRoot(document.getElementById("root"));

// root.render(
//   <BrowserRouter>
//     <Router />
//   </BrowserRouter>
// );