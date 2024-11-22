'use client';

import { useState, useCallback } from 'react';
import { read, utils } from 'xlsx';
import { cn } from "@/lib/utils";

export function FileUpload({ onDataParsed, className }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  // Handle file parsing
  const parseFile = async (file) => {
    try {
      // Check file type
      if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
        throw new Error('Please upload a CSV or Excel file');
      }

      // Read file
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('The file appears to be empty');
      }

      // Pass the parsed data up to parent component
      onDataParsed({
        data: jsonData,
        fileName: file.name,
        totalRows: jsonData.length,
        columns: Object.keys(jsonData[0])
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error parsing file:', err);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      parseFile(file);
    }
  }, []);

  // Handle file input change
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseFile(file);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-12 text-center transition-colors",
          isDragging && "border-blue-500 bg-blue-50",
          "hover:border-blue-500 hover:bg-blue-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
        />
        
        <label 
          htmlFor="fileInput"
          className="cursor-pointer"
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upload your CSV/Excel file</h2>
            <p className="text-gray-500">
              {isDragging ? 'Drop your file here' : 'Drag and drop your file here or click to browse'}
            </p>
            <button 
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              onClick={() => document.getElementById('fileInput').click()}
            >
              Select File
            </button>
          </div>
        </label>

        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
} 