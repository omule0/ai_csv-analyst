'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { DataTable } from '@/components/ui/DataTable';
import { QuickStats } from '@/components/ui/QuickStats';
import { AIInsights } from '@/components/ui/AIInsights';

export default function Home() {
  const [fileData, setFileData] = useState(null);

  const handleDataParsed = (data) => {
    setFileData(data);
    console.log('Parsed data:', data);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8">CSV Analyst</h1>
        
        {/* File Upload Section */}
        <section className="mb-8">
          <FileUpload onDataParsed={handleDataParsed} />
        </section>

        {fileData && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Preview */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Data Preview</h3>
                <div className="overflow-x-auto">
                  <DataTable 
                    data={fileData.data} 
                    columns={fileData.columns}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
                <QuickStats 
                  data={fileData.data}
                  columns={fileData.columns}
                />
              </div>
            </div>

            {/* Charts Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Visualizations</h3>
              {/* Charts will go here */}
            </div>

            {/* AI Analysis */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">AI Insights</h3>
              <AIInsights 
                data={fileData.data}
                columns={fileData.columns}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
