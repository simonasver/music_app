import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { applyDesignVars } from "./config/apply-design";

applyDesignVars();

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <h1>Hello from React</h1>
    </React.StrictMode>,
);
