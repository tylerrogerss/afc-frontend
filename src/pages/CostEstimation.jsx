// Full working version with Generate Job Bid and all result sections visible

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = "https://afc-proposal.onrender.com";

const formatNumber = (val) =>
  Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });

function CostEstimation() {
  const { state } = useLocation();
  const jobId = state?.job_id;

  const pricingOptions = ["Master Halco Pricing", "Fence Specialties Pricing"];

  const [formData, setFormData] = useState({
    daily_rate: 150,
    pricing_strategy: "Master Halco Pricing",
    dirt_complexity: "soft",
    grade_of_slope_complexity: 0.0,
    productivity: 1.0,
  });

  const [materialBreakdown, setMaterialBreakdown] = useState(null);
  const [result, setResult] = useState(null);
  const [customCrewSize, setCustomCrewSize] = useState("");
  const [customDays, setCustomDays] = useState(null);
  const [selectedProfitMargin, setSelectedProfitMargin] = useState(null);
  const [selectedCrewSize, setSelectedCrewSize] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) return;
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`${API_URL}/new_bid/material_costs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            material_prices: {},
            pricing_strategy: formData.pricing_strategy,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setMaterialBreakdown(data);
        } else {
          console.error("Failed to fetch material breakdown.");
        }
      } catch (err) {
        console.error("Error fetching material breakdown:", err);
      }
    };

    fetchMaterials();
  }, [jobId, formData.pricing_strategy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePricingToggle = (option) => {
    setFormData((prev) => ({ ...prev, pricing_strategy: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCustomDays(null);

    try {
      const response = await fetch(`${API_URL}/new_bid/cost_estimation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          ...formData,
          material_prices: {},
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.detail || "Failed to estimate cost.");
      }
    } catch (err) {
      console.error("Error estimating cost:", err);
      setError("Failed to connect to server.");
    }
  };

  const handleCrewSizeInput = (e) => {
    const value = parseInt(e.target.value);
    setCustomCrewSize(e.target.value);

    if (!isNaN(value) && value > 0 && result?.costs?.labor_costs?.num_days) {
      const baseDays = result.costs.labor_costs.num_days;
      const baseCrew = 3;
      const estimated = baseDays * (baseCrew / value);
      setCustomDays(estimated);
    } else {
      setCustomDays(null);
    }
  };

  const handleGenerateProposal = async () => {
    try {
      const response = await fetch(`${API_URL}/generate_proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "AFC_Job_Proposal.pdf";
      link.click();
    } catch (err) {
      console.error("Failed to generate job proposal:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Cost Estimation</h2>

      {materialBreakdown && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">📦 Materials Breakdown</h3>
            <div className="flex space-x-2">
              {pricingOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handlePricingToggle(option)}
                  className={`px-3 py-1 rounded border text-sm ${
                    formData.pricing_strategy === option
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Material</th>
                <th className="border px-2 py-1">Quantity</th>
                <th className="border px-2 py-1">Unit Size</th>
                <th className="border px-2 py-1">Order Size</th>
                <th className="border px-2 py-1">Unit Price</th>
                <th className="border px-2 py-1">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(materialBreakdown.detailed_costs).map(([material, data]) => (
                <tr key={material}>
                  <td className="border px-2 py-1">{material.replace(/_/g, ' ')}</td>
                  <td className="border px-2 py-1">{data.quantity}</td>
                  <td className="border px-2 py-1">{data.unit_size}</td>
                  <td className="border px-2 py-1">{data.order_size}</td>
                  <td className="border px-2 py-1">${formatNumber(data.unit_price)}</td>
                  <td className="border px-2 py-1">${formatNumber(data.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-2 font-semibold">
            Material Total: ${formatNumber(materialBreakdown.material_total)}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Daily Labor Rate:
          <input
            type="number"
            name="daily_rate"
            value={formData.daily_rate}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          />
        </label>

        <label className="block">
          Dirt Complexity:
          <select
            name="dirt_complexity"
            value={formData.dirt_complexity}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          >
            <option value="soft">Soft</option>
            <option value="hard">Hard</option>
            <option value="core drill">Core Drill</option>
            <option value="jack hammer">Jack Hammer</option>
          </select>
        </label>

        <label className="block">
          Grade of Slope Complexity (%):
          <input
            type="number"
            name="grade_of_slope_complexity"
            value={formData.grade_of_slope_complexity}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          />
        </label>

        <label className="block">
          Productivity (0.01 - 1.00):
          <input
            type="number"
            step="0.01"
            name="productivity"
            value={formData.productivity}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Estimate Cost
        </button>
      </form>

      {result?.costs?.labor_duration_options && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">👷 Labor Duration Options</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Crew Size</th>
                <th className="border px-2 py-1">Estimated Days</th>
              </tr>
            </thead>
            <tbody>
              {result.costs.labor_duration_options.map((option, idx) => (
                <tr
                  key={idx}
                  className={`cursor-pointer ${selectedCrewSize === option.crew_size ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedCrewSize(option.crew_size)}
                >
                  <td className="border px-2 py-1">{option.crew_size}</td>
                  <td className="border px-2 py-1">{formatNumber(option.estimated_days)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Custom Crew Size</label>
            <input
              type="number"
              value={customCrewSize}
              onChange={handleCrewSizeInput}
              className="w-full border px-3 py-2"
              placeholder="Enter crew size..."
            />
            {customDays && (
              <p className="mt-2 font-semibold text-gray-700">
                Estimated Completion Time: {formatNumber(customDays)} days
              </p>
            )}
          </div>
        </div>
      )}

      {result?.costs?.profit_margins && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">💰 Profit Margin Projections</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Margin</th>
                <th className="border px-2 py-1">Revenue</th>
                <th className="border px-2 py-1">Profit</th>
                <th className="border px-2 py-1">Profit Per LF</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.costs.profit_margins).map(([margin, values]) => (
                <tr
                  key={margin}
                  className={`cursor-pointer ${selectedProfitMargin === margin ? 'bg-green-100' : ''}`}
                  onClick={() => setSelectedProfitMargin(margin)}
                >
                  <td className="border px-2 py-1">{margin}</td>
                  <td className="border px-2 py-1">${formatNumber(values.revenue)}</td>
                  <td className="border px-2 py-1">${formatNumber(values.profit)}</td>
                  <td className="border px-2 py-1">${formatNumber(values.price_per_linear_foot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result?.costs && (
        <>
          <div className="mt-8 bg-gray-50 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-2">🧾 Summary</h3>
            <p><strong>Material Total:</strong> ${formatNumber(result.costs.material_total)}</p>
            <p><strong>Material Tax:</strong> ${formatNumber(result.costs.material_tax)}</p>
            <p><strong>Delivery Charge:</strong> ${formatNumber(result.costs.delivery_charge)}</p>
            <p><strong>Labor Cost:</strong> ${formatNumber(result.costs.labor_costs.total_labor_cost)}</p>
            <p><strong>Total Cost:</strong> ${formatNumber(result.costs.total_cost)}</p>
            <p><strong>Price Per Linear Foot:</strong> ${formatNumber(result.price_per_linear_foot)}</p>
            {selectedCrewSize && <p><strong>Selected Crew Size:</strong> {selectedCrewSize} workers</p>}
            {selectedProfitMargin && <p><strong>Selected Profit Margin:</strong> {selectedProfitMargin}</p>}
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerateProposal}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Generate Job Bid
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CostEstimation;


