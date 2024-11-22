'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export function AIInsights({ data, columns }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const analyzeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data, columns }),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const result = await response.json();
        setAnalysis(result.analysis);
      } catch (err) {
        setError(err.message);
        console.error('Analysis error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (data && columns) {
      analyzeData();
    }
  }, [data, columns]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error analyzing data: {error}
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none">
      {analysis ? (
        <ReactMarkdown>{analysis}</ReactMarkdown>
      ) : (
        <p>No analysis available</p>
      )}
    </div>
  );
} 