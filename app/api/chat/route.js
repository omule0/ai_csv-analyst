import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req) {
  const body = await req.json();
  const { messages } = body;
  const csvData = body.csvData;

  console.log('API Route Received Request:', {
    hasMessages: !!messages,
    messageCount: messages?.length,
    hasCsvData: !!csvData,
    csvDataSize: csvData?.length,
    firstRow: csvData?.[0],
  });

  // Get column information
  const columns = csvData && csvData[0] ? Object.keys(csvData[0]) : [];
  
  // Create a data summary with all fields from the CSV
  const dataSummary = csvData ? csvData.map(row => {
    const rowSummary = {};
    columns.forEach(col => {
      rowSummary[col] = row[col];
    });
    return rowSummary;
  }) : [];

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

  // Create a system message that adapts to the CSV structure
  const systemMessage = `You are a helpful AI assistant specialized in analyzing CSV data. 
  You have access to a dataset with ${csvData?.length || 0} records containing the following columns:

  ${columnDescriptions}

  Sample of the data:
  ${JSON.stringify(dataSummary.slice(0, 2), null, 2)}

  When analyzing this data, you can:
  - List and summarize records
  - Analyze patterns and trends
  - Compare different entries
  - Answer questions about specific fields
  - Provide statistical insights
  - Find unique or notable entries
  
  Always provide clear, concise responses using the specific data provided above.
  If asked about specific columns, use the exact column names as shown above.`;

  try {
    console.log('Preparing to stream response with context:', {
      contextDataSize: csvData?.length,
      systemMessageLength: systemMessage.length,
    });

    // Add the data context as the first assistant message
    const contextMessage = {
      role: 'assistant',
      content: `I have loaded the CSV data with ${csvData?.length} records. The dataset contains information about ${columns.join(', ')}. How can I help you analyze this information?`
    };

    const enhancedMessages = [
      contextMessage,
      ...convertToCoreMessages(messages)
    ];

    // Create dynamic summary based on data types
    const dataSummaryByType = {};
    columns.forEach(col => {
      if (columnTypes[col] === 'number') {
        const values = csvData?.map(row => parseFloat(row[col])).filter(n => !isNaN(n));
        dataSummaryByType[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length
        };
      } else {
        const values = csvData?.map(row => row[col]);
        dataSummaryByType[col] = {
          uniqueValues: [...new Set(values)].length,
          mostCommon: values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {})
        };
      }
    });

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemMessage,
      messages: enhancedMessages,
      context: {
        csvData: dataSummary,
        summary: {
          totalRecords: csvData?.length || 0,
          columns: columns,
          columnTypes: columnTypes,
          statistics: dataSummaryByType
        }
      }
    });

    console.log('Stream response created successfully');
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in API route:', error);
    throw error;
  }
} 