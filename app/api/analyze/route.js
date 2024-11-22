import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { data, columns } = await request.json();

    const dataAnalysis = await analyzeData(data, columns);
    return Response.json({ analysis: dataAnalysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
}

async function analyzeData(data, columns) {
  const dataStats = calculateBasicStats(data, columns);
  
  const prompt = `
    Analyze this dataset with the following information:
    
    Columns: ${columns.join(', ')}
    Number of rows: ${data.length}
    Basic statistics: ${JSON.stringify(dataStats)}
    
    Please provide:
    1. Key insights about the data
    2. Notable patterns or trends
    3. Potential anomalies or outliers
    4. Recommendations for further analysis
    
    Format the response in markdown.
  `;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4",
  });

  return completion.choices[0].message.content;
}

function calculateBasicStats(data, columns) {
  const stats = {};
  
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const numericValues = values.filter(v => !isNaN(v));
    
    if (numericValues.length > 0) {
      stats[column] = {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: numericValues.reduce((a, b) => a + Number(b), 0) / numericValues.length,
        type: 'numeric'
      };
    } else {
      const uniqueValues = new Set(values);
      stats[column] = {
        uniqueValues: uniqueValues.size,
        mostCommon: findMostCommon(values),
        type: 'categorical'
      };
    }
  });
  
  return stats;
}

function findMostCommon(arr) {
  const counts = {};
  let maxCount = 0;
  let maxValue = null;
  
  for (const value of arr) {
    counts[value] = (counts[value] || 0) + 1;
    if (counts[value] > maxCount) {
      maxCount = counts[value];
      maxValue = value;
    }
  }
  
  return maxValue;
}