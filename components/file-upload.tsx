"use client";
import { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files ? event.target.files[0] : null;
    setFile(selectedFile);
    setError(null); // Clear any previous errors
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setResult(response.data.analysis);
      } else {
        throw new Error(response.data.error || "File upload failed");
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(error.message || "An error occurred while uploading the file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Dayparting Sales Data Analysis</h1>

      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 mt-2"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Upload and Analyze"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl">Analysis Result:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
