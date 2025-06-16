import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Spinner from '../Spinner'; // <-- Make sure Spinner.jsx is in the same folder or update the path!

const API_URL = "https://afc-proposal.onrender.com";

const formatNumber = (val) =>
  Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 });

function CostEstimation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const jobId = state?.job_id;
  const linearFeet = state?.linear_feet;

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
  const [customMargin, setCustomMargin] = useState("");
  const [additionalLaborDays, setAdditionalLaborDays] = useState("");
  const [customProjection, setCustomProjection] = useState(null);
  const [selectedProfitMargin, setSelectedProfitMargin] = useState(null);
  const [selectedCrewSize, setSelectedCrewSize] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <-- Loading state

  // helper: which crew size will really work those extra days?
  const crewMultiplier = Math.round(
    selectedCrewSize
    ?? (customCrewSize ? Number(customCrewSize) : null)
    ?? 3
  );

  // helper: $ for the extra days
  const additionalLaborCost =
    Number(additionalLaborDays || 0) *
    Number(formData.daily_rate || 0) *
    crewMultiplier;

  useEffect(() => {
    if (!jobId) return;
    const fetchMaterials = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
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
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInternalSummary = async () => {
    const crewSize = Number(selectedCrewSize) || Number(customCrewSize) || 3;
    const estimatedDays = selectedCrewSize
      ? Math.round(
          result?.costs?.labor_duration_options?.find(
            (opt) => opt.crew_size === selectedCrewSize
          )?.estimated_days || 0
        )
      : Math.round(Number(customDays) || 0);

    // --- HIGHLIGHTED PROFIT MARGIN LOGIC ---
    let customMarginNum = undefined;
    if (selectedProfitMargin) {
      // Remove percent sign if present, parse to float, divide by 100
      customMarginNum = parseFloat(selectedProfitMargin.replace('%', '')) / 100;
    } else if (customMargin) {
      customMarginNum = parseFloat(customMargin) / 100;
    }

    const payload = {
      job_id: jobId,
      daily_rate: Number(formData.daily_rate),
      crew_size: crewSize,
      estimated_days: estimatedDays,
      additional_days: Math.round(Number(additionalLaborDays) || 0),
      custom_margin: customMarginNum,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate_internal_summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "AFC_Internal_Summary.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const errorText = await response.text();
        alert(`Failed to generate internal summary: ${errorText}`);
      }
    } catch (err) {
      console.error("Error generating internal summary:", err);
      alert("Server error while generating internal summary.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomMarginSubmit = () => {
    const marginFloat = parseFloat(customMargin);
    const totalCost = result?.costs?.total_cost;
    const linearFeet = state?.linear_feet;

    if (
      isNaN(marginFloat) ||
      !totalCost ||
      !linearFeet
    ) return;

    const costPerLF = totalCost / linearFeet;

    // NET PROFIT MARGIN revenue calc
    const revenue = totalCost / (1 - marginFloat / 100);
    const profit = revenue - totalCost;
    const pricePerLF = revenue / linearFeet;
    const profitPerLF = pricePerLF - costPerLF;

    setCustomProjection({
      revenue,
      profit,
      pricePerLF,
      profitPerLF,
    });

    setSelectedProfitMargin(`${marginFloat}%`);
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded">
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/")}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
            >
              + New Bid
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-4">Cost Estimation</h2>

          {materialBreakdown && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Materials Breakdown</h3>
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
                onWheel={(e) => e.target.blur()}
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
                onWheel={(e) => e.target.blur()}
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
                onWheel={(e) => e.target.blur()}
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
              <h3 className="text-lg font-semibold mb-2">Labor Duration Options</h3>
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
                      onClick={() =>
                        setSelectedCrewSize(
                          selectedCrewSize === option.crew_size ? null : option.crew_size
                        )
                      }
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
                  onWheel={(e) => e.target.blur()}
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

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Additional Days of Labor Needed</label>
                <input
                  type="number"
                  value={additionalLaborDays}
                  onWheel={(e) => e.target.blur()}
                  onChange={(e) => setAdditionalLaborDays(e.target.value)}
                  className="w-full border px-3 py-2"
                  placeholder="Enter number of extra days..."
                />
              </div>
            </div>
          )}

          {result?.costs?.profit_margins && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Profit Margin Projections</h3>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Margin</th>
                    <th className="border px-2 py-1">Revenue</th>
                    <th className="border px-2 py-1">Profit</th>
                    <th className="border px-2 py-1">Price Per LF</th>
                    <th className="border px-2 py-1">Profit Per LF</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.costs.profit_margins).map(([margin, values]) => {
                    const profitPerLF = values.price_per_linear_foot - result.price_per_linear_foot;
                    return (
                      <tr
                        key={margin}
                        className={`cursor-pointer ${selectedProfitMargin === margin ? 'bg-green-100' : ''}`}
                        onClick={() =>
                          setSelectedProfitMargin(
                            selectedProfitMargin === margin ? null : margin
                          )
                        }
                      >
                        <td className="border px-2 py-1">{margin}</td>
                        <td className="border px-2 py-1">${formatNumber(values.revenue)}</td>
                        <td className="border px-2 py-1">${formatNumber(values.profit)}</td>
                        <td className="border px-2 py-1">${formatNumber(values.price_per_linear_foot)}</td>
                        <td className="border px-2 py-1">${formatNumber(profitPerLF)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4">
                <h4 className="font-semibold mb-1 text-sm">Custom Profit Margin (%)</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    onWheel={(e) => e.target.blur()}
                    className="border px-3 py-1 text-sm w-32"
                    placeholder="e.g. 27.5"
                    value={customMargin}
                    onChange={(e) => setCustomMargin(e.target.value)}
                  />
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCustomMarginSubmit();
                    }}
                  >
                    Calculate
                  </button>
                </div>

                {customProjection && (
                  <div className="mt-3 text-sm border rounded p-3 bg-gray-50">
                    <p><strong>Revenue:</strong> ${formatNumber(customProjection.revenue)}</p>
                    <p><strong>Profit:</strong> ${formatNumber(customProjection.profit)}</p>
                    <p><strong>Price Per LF:</strong> ${formatNumber(customProjection.pricePerLF)}</p>
                    <p><strong>Profit Per LF:</strong> ${formatNumber(customProjection.profitPerLF)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {result?.costs && (
            <>
              <div className="mt-8 bg-gray-50 p-4 border rounded">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>

                <p><strong>Material Total:</strong> ${formatNumber(result.costs.material_total)}</p>
                <p><strong>Material Tax:</strong> ${formatNumber(result.costs.material_tax)}</p>
                <p><strong>Delivery Charge:</strong> ${formatNumber(result.costs.delivery_charge)}</p>
                <p><strong>Labor Cost:</strong> ${formatNumber(result.costs.labor_costs.total_labor_cost)}</p>

                {additionalLaborDays && (
                  <p className="ml-4 text-sm text-gray-700">
                    + ${formatNumber(additionalLaborCost)} Additional Labor Needed
                  </p>
                )}

                <p className="mt-2">
                  <strong>Total Cost:</strong> $
                  {formatNumber(
                    result.costs.total_cost + additionalLaborCost
                  )}
                </p>

                <p><strong>Cost Per Linear Foot:</strong> ${formatNumber(result.price_per_linear_foot)}</p>

                {selectedCrewSize && (() => {
                  const selectedOption = result.costs.labor_duration_options.find(
                    (option) => option.crew_size === selectedCrewSize
                  );
                  return (
                    <p>
                      <strong>Selected Crew Size:</strong> {selectedCrewSize} workers — Estimated Days: {formatNumber(selectedOption?.estimated_days || 0)}
                    </p>
                  );
                })()}

                {customCrewSize && customDays && (
                  <p>
                    <strong>Custom Crew Size:</strong> {customCrewSize} workers — Estimated Days: {formatNumber(customDays)}
                  </p>
                )}

                {selectedProfitMargin && (() => {
                  const selected = result.costs.profit_margins[selectedProfitMargin];
                  return (
                    <p>
                      <strong>Selected Profit Margin:</strong> {selectedProfitMargin} — Price Per LF: ${formatNumber(selected?.price_per_linear_foot || 0)}
                    </p>
                  );
                })()}

                {customProjection && (
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <p><strong>Custom Profit Margin:</strong> {customMargin}%</p>
                    <p><strong>Custom Price Per LF:</strong> ${formatNumber(customProjection.pricePerLF)}</p>
                    <p><strong>Custom Profit Per LF:</strong> ${formatNumber(customProjection.profitPerLF)}</p>
                    <button
                      onClick={() => {
                        setCustomMargin("");
                        setCustomProjection(null);
                      }}
                      className="mt-2 text-sm text-red-600 hover:underline"
                    >
                      ✖️ Remove Custom Profit Margin
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGenerateInternalSummary}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 mb-3"
                >
                  Generate Internal Summary
                </button>

                <button
                  onClick={handleGenerateProposal}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Generate Job Bid
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CostEstimation;
