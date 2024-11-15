// app/api/analyze/route.ts
import { NextResponse } from "next/server";
import Papa from "papaparse";
import axiosInstance from "@/utils/axios";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" });
    }

    const fileContents = await file.text();
    const { data: parsedData } = Papa.parse(fileContents, {
      header: true,
      skipEmptyLines: true,
    });

    const cleanedData = cleanData(parsedData);
    const processedData = processData(cleanedData);
    const analysisResult = await analyzeDataWithGPT(processedData);

    return NextResponse.json({ success: true, analysis: analysisResult });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json({
      success: false,
      error: "Error processing file",
    });
  }
}

function cleanData(data: any[]) {
  return data.map((row) => ({
    ...row,
    "Start Date": row["Start Date"]?.trim(),
    "Start Time": row["Start Time"]?.trim(),
    "Portfolio name": row["Portfolio name"]?.trim(),
    "Campaign Type": row["Campaign Type"]?.trim(),
    "Campaign Name": row["Campaign Name"]?.trim(),
    Country: row["Country"]?.trim(),
    Status: row["Status"]?.trim(),
    Currency: row["Currency"]?.trim(),
    Budget: parseFloat(row["Budget"]?.replace(/[^\d.-]/g, "")),
    "Targeting Type": row["Targeting Type"]?.trim(),
    "Bidding strategy": row["Bidding strategy"]?.trim(),
    Impressions: parseInt(row["Impressions"], 10) || 0,
    Clicks: parseInt(row["Clicks"], 10) || 0,
    "Click-Thru Rate (CTR)":
      parseFloat(row["Click-Thru Rate (CTR)"]?.replace("%", "")) / 100 || 0,
    Spend: parseFloat(row["Spend"].replace(/[^\d.-]/g, "")) || 0,
    "Cost Per Click (CPC)":
      parseFloat(row["Cost Per Click (CPC)"]?.replace(/[^\d.-]/g, "")) || 0,
    "14 Day Total Orders (#)":
      parseInt(row["14 Day Total Orders (#)"], 10) || 0,
    "Total Advertising Cost of Sales (ACOS)":
      parseFloat(
        row["Total Advertising Cost of Sales (ACOS)"]?.replace("%", "")
      ) / 100 || 0,
    "Total Return on Advertising Spend (ROAS)":
      parseFloat(row["Total Return on Advertising Spend (ROAS)"]) || 0,
    "14 Day Total Sales":
      parseFloat(row["14 Day Total Sales"]?.replace(/[^\d.-]/g, "")) || 0,
  }));
}

function processData(data: any[]) {
  // Group data by hour
  const hourlyData = data.reduce((acc, row) => {
    const hour = new Date(
      `${row["Start Date"]} ${row["Start Time"]}`
    ).getHours();
    if (!acc[hour]) {
      acc[hour] = {
        Impressions: 0,
        Clicks: 0,
        Spend: 0,
        Orders: 0,
        Sales: 0,
      };
    }
    acc[hour].Impressions += row.Impressions;
    acc[hour].Clicks += row.Clicks;
    acc[hour].Spend += row.Spend;
    acc[hour].Orders += row["14 Day Total Orders (#)"];
    acc[hour].Sales += row["14 Day Total Sales"];
    return acc;
  }, {});

  // Calculate metrics for each hour
  return Object.entries(hourlyData).map(([hour, data]: [string, any]) => ({
    hour: parseInt(hour),
    impressions: data.Impressions,
    clicks: data.Clicks,
    spend: data.Spend,
    orders: data.Orders,
    sales: data.Sales,
    ctr: data.Clicks / data.Impressions || 0,
    cpc: data.Spend / data.Clicks || 0,
    roas: data.Sales / data.Spend || 0,
  }));
}

async function analyzeDataWithGPT(processedData: any[]) {
  const prompt = `Analyze the following hourly advertising performance data for dayparting optimization:
  ${JSON.stringify(processedData, null, 2)}

  Please provide:
  1. The top 3 performing hours based on CTR and ROAS.
  2. The worst 3 performing hours based on CTR and ROAS.
  3. Recommendations for optimizing the advertising schedule.
  4. Any other insights or patterns you notice in the data.`;

  const maxRetries = 5;
  let retries = 0;
  let delay = 1000;

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
        delay *= 2;
      } else {
        console.error("Error calling GPT API:", error);
        throw new Error("Failed to analyze data with GPT");
      }
    }
  }

  throw new Error("Max retries reached. Failed to analyze data with GPT");
}

// The rest of the code (client-side component, axios instance, etc.) remains the same as in the previous response.
