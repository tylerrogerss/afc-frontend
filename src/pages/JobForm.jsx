import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from '../Spinner'; // <-- correct path for your structure

const API_URL = "https://afc-proposal.onrender.com";

const JobForm = () => {
  const [formData, setFormData] = useState({
    proposal_to: "",
    phone: "",
    email: "",
    job_address: "",
    job_name: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // start spinner
    try {
      const response = await fetch(`${API_URL}/new_bid/job_details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        navigate("/fence-details", { state: { job_id: result.job_id } });
      } else {
        setError(result.detail || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setIsLoading(false); // stop spinner
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <h1 className="text-2xl font-semibold mb-4">New Job Form</h1>

          {error && <div className="text-red-500 mb-3">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              Proposal To:
              <input
                type="text"
                name="proposal_to"
                value={formData.proposal_to}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              Phone:
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              Job Address:
              <input
                type="text"
                name="job_address"
                value={formData.job_address}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              Job Name:
              <input
                type="text"
                name="job_name"
                value={formData.job_name}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
                required
              />
            </label>

            <label className="block">
              Notes (Optional):
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full mt-1 border px-3 py-2"
                rows="3"
              />
            </label>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Submit Job Details
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default JobForm;
