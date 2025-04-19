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
    style: "",
    bob: "false",
    with_chain_link: "Yes",
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

    if (formData.fence_type === "Wood") {
      payload.style = formData.style;
      if (formData.style === "good neighbor") {
        payload.bob = formData.bob === "true";
      }
    }

    if (formData.fence_type === "Vinyl") {
      payload.with_chain_link = formData.with_chain_link === "Yes";
    }
    

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

        {formData.fence_type === "Chain Link" && (
  <label className="block">
    Top Rail:
    <select
      name="top_rail"
      value={formData.top_rail}
      onChange={handleChange}
      className="w-full mt-1 border px-3 py-2"
    >
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  </label>
)}



        {/* Always show Linear Feet */}
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

{/* Only show Corner Posts and End Posts for Chain Link and Vinyl */}
{["Chain Link", "Vinyl"].includes(formData.fence_type) && (
  <>
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
  </>
)}


{formData.fence_type === "Wood" && (
  <>
    <label className="block">
      Style:
      <select
        name="style"
        value={formData.style}
        onChange={handleChange}
        className="w-full mt-1 border px-3 py-2"
      >
        <option value="">Select a style</option>
        <option value="good neighbor">Good Neighbor</option>
        <option value="dogeared">Dogeared</option>
      </select>
    </label>

    {formData.style === "good neighbor" && (
      <label className="block">
        Bob Option:
        <select
          name="bob"
          value={formData.bob}
          onChange={handleChange}
          className="w-full mt-1 border px-3 py-2"
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </label>
    )}
  </>
)}

{formData.fence_type === "Vinyl" && (
  <label className="block">
    With Chain Link?:
    <select
      name="with_chain_link"
      value={formData.with_chain_link}
      onChange={handleChange}
      className="w-full mt-1 border px-3 py-2"
    >
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  </label>
)}





        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4">
          Submit Fence Details
        </button>
      </form>
    </div>
  );
}

export default FenceDetails;
