import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import { applyDesignVars } from "./config/apply-design";
import { App } from "./App";

applyDesignVars();

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
