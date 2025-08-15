import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMobileViewport } from "./lib/mobile-viewport";

// Initialize mobile viewport handling
initMobileViewport();

createRoot(document.getElementById("root")!).render(<App />);
