'use client';

import { useChat } from 'ai/react';
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line, Pie } from 'recharts';

function DataTable({ headers, rows }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {headers.map((header) => (
              <TableCell key={header}>{row[header]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DataChart({ config, data }) {
  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
  }[config.type];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {/* Add chart configuration based on type */}
        </ChartComponent>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  // Initialize chat with custom configuration
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    initialMessages: [],
    // Add body serializer to handle CSV data
    body: {
      csvData: null, // This will be updated when we have CSV data
    },
  });
  const [csvData, setCsvData] = useState(null);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    console.log('File selected:', file?.name);
    
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        Papa.parse(file, {
          complete: (results) => {
            const data = results.data;
            console.log('CSV Parsing Results:', {
              rowCount: data.length,
              headers: results.meta.fields,
              sampleRow: data[0],
            });
            
            setCsvData(data);
            
            // Get headers safely
            const headers = results.meta.fields || Object.keys(results.data[0] || {});
            const rowCount = results.data.length;
            
            // Create initial message about the uploaded file
            const customSubmit = async () => {
              console.log('Sending initial CSV data to API:', {
                dataSize: data.length,
                firstRow: data[0],
              });
              
              await handleSubmit(
                new CustomEvent('submit', {
                  preventDefault: () => {},
                }),
                {
                  body: {
                    csvData: data, // Pass CSV data in body instead of options
                  },
                  prefix: `I've uploaded a CSV file with ${rowCount} rows and ${headers.length} columns. The headers are: ${headers.join(', ')}. Please help me analyze this data.`,
                }
              );
            };
            
            customSubmit();
          },
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
      } else {
        alert('Please upload a CSV file');
      }
    }
  }, [handleSubmit]);

  // Custom submit handler to include CSV data with every message
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    console.log('Sending message with CSV data:', {
      messageContent: input,
      hasCsvData: !!csvData,
      csvDataSize: csvData?.length,
    });
    
    await handleSubmit(e, {
      body: {
        csvData: csvData, // Pass CSV data in body instead of options
      },
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CSV Analyst Assistant</h1>
      
      {/* File upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map(message => {
          // Try to parse the message content as JSON
          let structuredContent;
          try {
            structuredContent = JSON.parse(message.content);
          } catch (e) {
            structuredContent = { type: 'text', content: message.content };
          }

          return (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="font-medium mb-1">
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                
                {structuredContent.type === 'text' && (
                  <div className="whitespace-pre-wrap">{structuredContent.content}</div>
                )}
                
                {structuredContent.type === 'table' && structuredContent.data && (
                  <div className="mt-4">
                    <p className="mb-2">{structuredContent.content}</p>
                    <DataTable 
                      headers={structuredContent.data.headers}
                      rows={structuredContent.data.rows}
                    />
                  </div>
                )}
                
                {structuredContent.type === 'chart' && structuredContent.data && (
                  <div className="mt-4">
                    <p className="mb-2">{structuredContent.content}</p>
                    <DataChart 
                      config={structuredContent.data.chartConfig}
                      data={structuredContent.data.rows}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input form */}
      <form onSubmit={handleMessageSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask questions about your CSV data..."
          className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}
