// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import JobForm from "./pages/JobForm";
import FenceDetails from "./pages/FenceDetails";
import CostEstimation from './pages/CostEstimation';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/job-form" />} />
        <Route path="/job-form" element={<JobForm />} />
        <Route path="/fence-details" element={<FenceDetails />} />
        <Route path="/cost-estimation" element={<CostEstimation />} />
      </Routes>
    </Router>
  );
}

export default App;
