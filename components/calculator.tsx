// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Calculator() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/process", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error processing file:", error);
    }

    setLoading(false);
  };

  const handleBookDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/book-demo", { email });
      router.push("/thank-you");
    } catch (error) {
      console.error("Error booking demo:", error);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dayparting Calculator</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".csv,.xlsx"
          className="mb-4 block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? "Processing..." : "Calculate Dayparting"}
        </button>
      </form>

      {results && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {results}
          </pre>
        </div>
      )}

      <form onSubmit={handleBookDemo} className="mt-8">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mr-2 p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Book a Demo
        </button>
      </form>
    </main>
  );
}
