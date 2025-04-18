// === FenceDetails.jsx ===
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = "https://afc-proposal.onrender.com";

function FenceDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const jobId = state?.job_id;

  const [formData, setFormData] = useState({
    fence_type: "Chain Link",
    linear_feet: "",
    corner_posts: "",
    end_posts: "",
    height: "6",
    top_rail: "Yes",
  });

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      job_id: jobId,
      fence_type: formData.fence_type,
      linear_feet: parseFloat(formData.linear_feet),
      corner_posts: parseInt(formData.corner_posts),
      end_posts: parseInt(formData.end_posts),
      height: parseInt(formData.height),
      top_rail: formData.top_rail === "Yes",
    };

    try {
      const response = await fetch(`${API_URL}/new_bid/fence_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setSubmitted(true);
        const materialRes = await fetch(`${API_URL}/new_bid/material_costs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            material_prices: {},
            pricing_strategy: "Master Halco Pricing",
          }),
        });

        if (materialRes.ok) {
          const materialData = await materialRes.json();
          navigate("/cost-estimation", {
            state: {
              job_id: jobId,
              linear_feet: formData.linear_feet,
              materialBreakdown: materialData,
            },
          });
        } else {
          console.warn("Failed to fetch material breakdown");
        }
      } else {
        setError(result.detail || "Submission failed.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Fence Details</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Fence Type:
          <select name="fence_type" value={formData.fence_type} onChange={handleChange} className="w-full mt-1 border px-3 py-2">
            <option>Chain Link</option>
            <option>SP Wrought Iron</option>
            <option>Vinyl</option>
            <option>Wood</option>
          </select>
        </label>

        <label className="block">
          Height:
          <select name="height" value={formData.height} onChange={handleChange} className="w-full mt-1 border px-3 py-2">
            <option value="4">4 ft</option>
            <option value="5">5 ft</option>
            <option value="6">6 ft</option>
          </select>
        </label>

        <label className="block">
          Top Rail:
          <select name="top_rail" value={formData.top_rail} onChange={handleChange} className="w-full mt-1 border px-3 py-2">
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>

        {["linear_feet", "corner_posts", "end_posts"].map((field) => (
          <label className="block" key={field}>
            {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
            <input
              type="number"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              onWheel={(e) => e.target.blur()}
              className="w-full mt-1 border px-3 py-2"
              required={field !== "corner_posts" && field !== "end_posts"}
            />
          </label>
        ))}

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4">
          Submit Fence Details
        </button>
      </form>
    </div>
  );
}

export default FenceDetails;
