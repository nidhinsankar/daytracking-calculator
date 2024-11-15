// app/page.js
"use client";

import { useState } from "react";

export default function DaypartingCalculator() {
  const [file, setFile] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [gptAnalysis, setGptAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Process data
      const processResponse = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!processResponse.ok) {
        throw new Error("Data processing failed");
      }

      const { processedData } = await processResponse.json();
      setProcessedData(processedData);

      // Send to ChatGPT for analysis
      const gptResponse = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: JSON.stringify({ processedData }),
      });

      if (!gptResponse.ok) {
        throw new Error("GPT analysis failed");
      }

      const { analysis } = await gptResponse.json();
      setGptAnalysis(analysis);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during processing or analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dayparting Calculator</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".csv,.txt"
          className="mb-4"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={!file || isLoading}
        >
          Process and Analyze Data
        </button>
      </form>
      {isLoading && <p>Processing and analyzing data...</p>}
      {processedData && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">
            Processed Data (First 5 entries)
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(processedData.slice(0, 5), null, 2)}
          </pre>
        </div>
      )}
      {gptAnalysis && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">ChatGPT Analysis</h2>
          <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {gptAnalysis}
          </div>
        </div>
      )}
    </div>
  );
}
