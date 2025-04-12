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
        setSubmitted(true);
        console.log("Fence details submitted:", result);
      } else {
        setError(result.detail || "Submission failed.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    }
  };

  const handleGenerateMaterials = async () => {
    if (!jobId) {
      alert("Missing Job ID");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/generate_materials_list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate materials list.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Materials_List.pdf";
      link.click();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Fence Details</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {["fence_type", "linear_feet", "corner_posts", "end_posts", "height", "option_d"].map((field, idx) => (
          <label className="block" key={idx}>
            {field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
            {field === "fence_type" || field === "option_d" ? (
              <select
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
              >
                {field === "fence_type" ? (
                  <>
                    <option>Chain Link</option>
                    <option>SP Wrought Iron</option>
                    <option>Vinyl</option>
                    <option>Wood</option>
                  </>
                ) : (
                  <>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </>
                )}
              </select>
            ) : (
              <input
                type="number"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()}
                className="w-full mt-1 border px-3 py-2"
                required={field !== "corner_posts" && field !== "end_posts"}
              />
            )}
          </label>
        ))}

        <div className="flex flex-col gap-3 mt-6">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Submit Fence Details
          </button>

          <button
            type="button"
            onClick={handleGenerateMaterials}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Materials List
          </button>

          {submitted && (
            <button
              type="button"
              onClick={() => navigate("/cost-estimation", { state: { job_id: jobId } })}
              className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Continue to Cost Estimation
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default FenceDetails;
