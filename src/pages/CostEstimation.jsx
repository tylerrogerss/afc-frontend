import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = "https://afc-proposal.onrender.com";

const formatNumber = (value) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function CostEstimation() {
  const { state } = useLocation();
  const jobId = state?.job_id;

  const [formData, setFormData] = useState({
    daily_rate: 150,
    pricing_strategy: "Master Halco Pricing",
    dirt_complexity: "soft",
    grade_of_slope_complexity: 0.0,
    productivity: 1.0
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const preventScroll = (e) => e.target.blur();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/new_bid/cost_estimation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          ...formData,
          material_prices: {}
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Cost estimation response:", data);
        setResult(data);
      } else {
        setError(data.detail || "Error estimating cost.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server.");
    }
  };

  const handleGenerateProposal = async () => {
    if (!jobId) {
      alert("Missing Job ID.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/generate_proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate proposal.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "AFC_Job_Proposal.pdf";
      link.click();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Cost Estimation</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Daily Labor Rate:
          <input
            type="number"
            name="daily_rate"
            value={formData.daily_rate}
            onChange={handleChange}
            onWheel={preventScroll}
            className="w-full border px-3 py-2"
          />
        </label>

        <label className="block">
          Pricing Strategy:
          <select
            name="pricing_strategy"
            value={formData.pricing_strategy}
            onChange={handleChange}
            className="w-full border px-3 py-2"
          >
            <option value="Master Halco Pricing">Master Halco Pricing</option>
            <option value="Fence Specialties Pricing">Fence Specialties Pricing</option>
          </select>
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
            onWheel={preventScroll}
            className="w-full border px-3 py-2"
          />
        </label>

        <label className="block">
          Productivity (0.01 - 1.00):
          <input
            type="number"
            name="productivity"
            step="0.01"
            min="0.01"
            max="1.00"
            value={formData.productivity}
            onChange={handleChange}
            onWheel={preventScroll}
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

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {result && (
        <div className="mt-6 space-y-6">
          {/* === Materials Breakdown Table === */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📦 Materials Breakdown</h3>
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
                {Object.entries(result.costs.detailed_costs).map(([material, data]) => (
                  <tr key={material}>
                    <td className="border px-2 py-1">{material}</td>
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
              Material Total: ${formatNumber(result.costs.material_total)}
            </div>
          </div>

          {/* === Labor Cost Options Table === */}
          {result.costs.labor_cost_options && (
            <div>
              <h3 className="text-lg font-semibold mb-2">👷 Labor Cost Options</h3>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Crew Size</th>
                    <th className="border px-2 py-1">Days Required</th>
                  </tr>
                </thead>
                <tbody>
                  {result.costs.labor_cost_options.map((option, index) => (
                    <tr key={index}>
                      <td className="border px-2 py-1">{option.crew_size}</td>
                      <td className="border px-2 py-1">{formatNumber(option.days_required)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* === Summary Breakdown === */}
          <div className="bg-gray-50 p-4 border rounded">
            <h3 className="text-lg font-semibold mb-2">🧾 Summary</h3>
            <p><strong>Material Total:</strong> ${formatNumber(result.costs.material_total)}</p>
            <p><strong>Material Tax:</strong> ${formatNumber(result.costs.material_tax)}</p>
            <p><strong>Delivery Charge:</strong> ${formatNumber(result.costs.delivery_charge)}</p>
            <p><strong>Labor Cost:</strong> ${formatNumber(result.costs.labor_costs.total_labor_cost)}</p>
            <p><strong>Total Cost:</strong> ${formatNumber(result.costs.total_cost)}</p>
            <p><strong>Cost Per Linear Foot:</strong> ${formatNumber(result.price_per_linear_foot)}</p>
          </div>

          {/* === Profit Margin Table === */}
          <div>
            <h3 className="text-lg font-semibold mb-2">💰 Profit Margin Projections</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Margin</th>
                  <th className="border px-2 py-1">Revenue</th>
                  <th className="border px-2 py-1">Profit</th>
                  <th className="border px-2 py-1">Cost Per LF</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.costs.profit_margins).map(([margin, values]) => (
                  <tr key={margin}>
                    <td className="border px-2 py-1">{margin}</td>
                    <td className="border px-2 py-1">${formatNumber(values.revenue)}</td>
                    <td className="border px-2 py-1">${formatNumber(values.profit)}</td>
                    <td className="border px-2 py-1">${formatNumber(values.price_per_linear_foot)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleGenerateProposal}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Job Bid
          </button>
        </div>
      )}
    </div>
  );
}

export default CostEstimation;
