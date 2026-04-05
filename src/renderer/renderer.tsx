import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <h1>Hello from React</h1>
    </React.StrictMode>,
);
