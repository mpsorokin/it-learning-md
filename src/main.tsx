import React from "react";
import { createRoot } from "react-dom/client";
import "@/i18n";
import { App } from "@/app/App";
import "./styles/fonts.css";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("IT Theory could not find its application root.");

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
