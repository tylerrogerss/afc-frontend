// Spinner.jsx
export default function Spinner() {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <style>
        {`
        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 120px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #38bdf8;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        `}
      </style>
    </div>
  );
}
