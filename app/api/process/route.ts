import { NextResponse } from "next/server";
import { IncomingForm } from "formidable";
import { promises as fs } from "fs";
import Papa from "papaparse";
import axiosInstance from "@/utils/axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(request, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form:", err);
        resolve(
          NextResponse.json(
            { success: false, error: "Error parsing form" },
            { status: 400 }
          )
        );
        return;
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        resolve(
          NextResponse.json(
            { success: false, error: "No file uploaded" },
            { status: 400 }
          )
        );
        return;
      }

      try {
        // Read file contents
        const fileContents = await fs.readFile(file.filepath, "utf8");

        // Parse CSV
        const { data: parsedData } = Papa.parse(fileContents, {
          header: true,
          skipEmptyLines: true,
        });

        // Analyze with GPT
        const analysisResult = await analyzeDataWithGPT(parsedData);

        resolve(NextResponse.json({ success: true, analysis: analysisResult }));
      } catch (error) {
        console.error("Error processing file:", error);
        resolve(
          NextResponse.json(
            {
              success: false,
              error: "Error processing file",
            },
            { status: 500 }
          )
        );
      } finally {
        // Clean up the temp file
        await fs.unlink(file.filepath);
      }
    });
  });
}

async function analyzeDataWithGPT(parsedData: any) {
  const prompt = `Analyze the following sales data and provide insights for dayparting:
  ${JSON.stringify(parsedData)}
  
  Please provide:
  1. The top 3 performing hours based on CTR and ROAS.
  2. The worst 3 performing hours based on CTR and ROAS.
  3. Recommendations for optimizing the advertising schedule.
  4. Any other insights or patterns you notice in the data.`;

  const maxRetries = 5;
  let retries = 0;
  let delay = 1000; // Start with a 1 second delay

  while (retries < maxRetries) {
    try {
      const response = await axiosInstance.post("/chat/completions", {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response && error.response.status === 429) {
        retries++;
        console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for the next attempt
      } else {
        console.error("Error calling GPT API:", error);
        throw new Error("Failed to analyze data with GPT");
      }
    }
  }

  throw new Error("Max retries reached. Failed to analyze data with GPT");
}
