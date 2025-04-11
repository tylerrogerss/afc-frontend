// src/pages/FenceDetails.jsx
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
    height: 6,
    option_d: "Yes",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!jobId) {
      setError("Missing Job ID from previous form.");
      return;
    }

    const payload = {
      job_id: jobId,
      ...formData,
      linear_feet: parseFloat(formData.linear_feet),
      corner_posts: parseInt(formData.corner_posts),
      end_posts: parseInt(formData.end_posts),
      height: parseInt(formData.height),
    };

    try {
      const response = await fetch(`${API_URL}/new_bid/fence_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        navigate("/cost-estimation", { state: { job_id: payload.job_id } });
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
          <select
            name="fence_type"
            value={formData.fence_type}
            onChange={handleChange}
            className="w-full mt-1 border px-3 py-2"
          >
            <option>Chain Link</option>
            <option>SP Wrought Iron</option>
            <option>Vinyl</option>
            <option>Wood</option>
          </select>
        </label>

        <label className="block">
          Linear Feet:
          <input
            type="number"
            name="linear_feet"
            value={formData.linear_feet}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full mt-1 border px-3 py-2"
            required
          />
        </label>

        <label className="block">
          Corner Posts:
          <input
            type="number"
            name="corner_posts"
            value={formData.corner_posts}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full mt-1 border px-3 py-2"
          />
        </label>

        <label className="block">
          End Posts:
          <input
            type="number"
            name="end_posts"
            value={formData.end_posts}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full mt-1 border px-3 py-2"
          />
        </label>

        <label className="block">
          Height (ft):
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className="w-full mt-1 border px-3 py-2"
          />
        </label>

        <label className="block">
          Option D (Top Rail):
          <select
            name="option_d"
            value={formData.option_d}
            onChange={handleChange}
            className="w-full mt-1 border px-3 py-2"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Fence Details
        </button>
      </form>
    </div>
  );
}

export default FenceDetails;
