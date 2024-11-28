import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';
import { z } from 'zod';

// Define schema for structured responses
const responseSchema = z.object({
  type: z.enum(['text', 'table', 'chart']),
  content: z.string(),
  data: z.object({
    headers: z.array(z.string()).optional(),
    rows: z.array(z.record(z.any())).optional(),
    chartConfig: z.object({
      type: z.enum(['bar', 'line', 'pie']).optional(),
      xAxis: z.string().optional(),
      yAxis: z.array(z.string()).optional(),
      title: z.string().optional(),
      stacked: z.boolean().optional(),
      percentage: z.boolean().optional(),
      layout: z.enum(['vertical', 'horizontal']).optional(),
    }).optional(),
  }).optional(),
});

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

export async function POST(req) {
  const body = await req.json();
  const { messages } = body;
  const csvData = body.csvData;

  // Stricter data validation
  if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
    return new Response(
      JSON.stringify({
        type: 'text',
        content: 'No data available to analyze. Please provide valid CSV data.'
      }),
      { status: 400 }
    );
  }

  console.log('API Route Received Request:', {
    hasMessages: !!messages,
    messageCount: messages?.length,
    hasCsvData: !!csvData,
    csvDataSize: csvData?.length,
  });

  // Get column information
  const columns = csvData && csvData[0] ? Object.keys(csvData[0]) : [];

  // Get data types for each column
  const columnTypes = {};
  columns.forEach(col => {
    const values = csvData?.map(row => row[col]) || [];
    const sampleValue = values.find(v => v !== null && v !== undefined);
    columnTypes[col] = typeof sampleValue;
  });

  // Create column descriptions
  const columnDescriptions = columns.map(col => {
    const uniqueValues = new Set(csvData?.map(row => row[col]));
    return `- ${col} (${columnTypes[col]}): ${
      uniqueValues.size === csvData?.length 
        ? 'unique values' 
        : `${uniqueValues.size} distinct values`
    }`;
  }).join('\n');

  // Prepare data summary with actual values
  const dataSummary = {};
  columns.forEach(col => {
    const values = csvData.map(row => row[col]).filter(v => v !== null && v !== undefined);
    dataSummary[col] = {
      totalRecords: values.length,
      uniqueValues: [...new Set(values)],
      sampleValues: values.slice(0, 5), // Provide actual samples
      type: columnTypes[col]
    };
  });

  // Enhanced system message with strict data boundaries
  const systemMessage = `You are a helpful AI assistant specialized in analyzing CSV data.
  You have access to a dataset with EXACTLY ${csvData.length} records containing the following columns:

  ${columnDescriptions}

  CRITICAL INSTRUCTIONS:
  1. You MUST ONLY use the exact values present in the dataset.
  2. For each response:
     - Include specific values from the dataset
     - Reference actual counts and numbers
     - If asked about data not in the dataset, respond with "That information is not available in the dataset"
  3. NEVER extrapolate or estimate values outside the dataset
  4. NEVER create sample or example data
  5. If unsure about any values, respond with "I need to verify the exact values in the dataset"

  Available Data Summary:
  ${JSON.stringify(dataSummary, null, 2)}

  IMPORTANT: 
  - ONLY use the data provided in the CSV file. DO NOT make up or assume any data.
  - If you cannot answer a question using the available data, respond with "I cannot answer this question with the available data."
  - Always reference specific values from the dataset in your responses.
  - When showing trends or patterns, use actual counts and values from the data.

  Format the results as either tables or charts:
  - Use tables for: displaying raw data, comparing specific records, showing detailed information
  - Use charts for: trends over time, distributions, comparisons between categories, showing patterns
  - Use text for: summaries, explanations, and analysis that doesn't require visual representation

  When responding, use the following formats:
  
  1. For tabular data:
  {
    "type": "table",
    "content": "Here's the data you requested...",
    "data": {
      "headers": ["column1", "column2"],
      "rows": [{"column1": "value1", "column2": "value2"}]
    }
  }

  2. For charts:
  {
    "type": "chart",
    "content": "Here's a visualization of...",
    "data": {
      "chartConfig": {
        "type": "bar",  // "bar" for categories, "line" for trends, "pie" for proportions
        "xAxis": "category_column_name",  // The column to use for X-axis
        "yAxis": ["value_column_name"],   // Array of columns to plot on Y-axis
        "title": "Chart Title",
        "stacked": false,                 // Optional: stack multiple bars
        "percentage": false,              // Optional: show as percentages
        "layout": "vertical"              // Optional: "vertical" or "horizontal"
      },
      "rows": [
        // Transformed data for the chart
        { "category_column_name": "value1", "value_column_name": 123 },
        { "category_column_name": "value2", "value_column_name": 456 }
      ]
    }
  }

  3. For regular text:
  {
    "type": "text",
    "content": "Your text response here"
  }

  Always structure your response according to these formats and use the exact column names as shown above.
  Provide clear, concise responses using the specific data provided.
  
  Choose the most appropriate visualization based on the question:
  - For "show me", "list", or "what are" questions -> typically use tables
  - For "trend", "compare", or "distribution" questions -> typically use charts
  - For "analyze", "explain", or "why" questions -> typically use text with supporting visuals`;

  try {
    console.log('Preparing to stream response with context:', {
      contextDataSize: csvData?.length,
      systemMessageLength: systemMessage.length,
    });

    // Add the data context as the first assistant message
    const contextMessage = {
      role: 'assistant',
      content: `I have loaded the CSV data with ${csvData?.length} records. The dataset contains information about ${columns.join(', ')}. Here is all the data: ${JSON.stringify(csvData)}. How can I help you analyze this information?`
    };

    const enhancedMessages = [
      contextMessage,
      ...convertToCoreMessages(messages)
    ];

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemMessage,
      messages: enhancedMessages,
      schema: responseSchema,
      temperature: 0,
    });

    console.log('Stream response created successfully');
    return result.toDataStreamResponse();
   

  } catch (error) {
    console.error('Error in API route:', error);
    throw error;
  }
} 