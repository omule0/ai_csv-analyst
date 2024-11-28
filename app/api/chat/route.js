import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
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

  // Create a data summary message
  const dataSummary = csvData ? csvData.map(car => ({
    name: car.modelName,
    price: car['current price'],
    mileage: car.Mileage,
    year: car.Year,
    category: car.mainCategory
  })) : [];

  // Create a system message that includes CSV data information
  const systemMessage = `You are a helpful AI assistant specialized in analyzing car data. 
  You have access to data about ${csvData?.length || 0} cars with the following details:

  ${JSON.stringify(dataSummary, null, 2)}

  When analyzing this data, you can:
  - List available cars and their details
  - Summarize car specifications
  - Compare different models
  - Answer questions about prices, features, and availability
  - Provide insights about the inventory
  
  Always provide clear, concise responses using the specific data provided above.`;

  try {
    console.log('Preparing to stream response with context:', {
      contextDataSize: csvData?.length,
      systemMessageLength: systemMessage.length,
    });

    // Add the data context as the first assistant message
    const contextMessage = {
      role: 'assistant',
      content: `I have loaded the car data with ${csvData?.length} vehicles. Each car has details including model name, price, mileage, year, and features. How can I help you analyze this information?`
    };

    const enhancedMessages = [
      contextMessage,
      ...convertToCoreMessages(messages)
    ];

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemMessage,
      messages: enhancedMessages,
      context: {
        csvData: dataSummary,
        summary: {
          totalCars: csvData?.length || 0,
          categories: [...new Set(csvData?.map(car => car.mainCategory) || [])],
          brands: [...new Set(csvData?.map(car => car.modelName?.split(' ')[1] || '') || [])]
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