'use client';

export function QuickStats({ data, columns }) {
  if (!data || !columns) {
    return null;
  }

  const getColumnStats = (column) => {
    const values = data.map(row => row[column]).filter(val => val !== undefined && val !== null);
    const numericValues = values.filter(val => !isNaN(val));

    return {
      total: values.length,
      unique: new Set(values).size,
      numeric: numericValues.length > 0,
      min: numericValues.length > 0 ? Math.min(...numericValues) : null,
      max: numericValues.length > 0 ? Math.max(...numericValues) : null,
      avg: numericValues.length > 0 
        ? (numericValues.reduce((a, b) => a + Number(b), 0) / numericValues.length).toFixed(2)
        : null
    };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600">Total Rows</h4>
          <p className="text-2xl font-semibold">{data.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-600">Total Columns</h4>
          <p className="text-2xl font-semibold">{columns.length}</p>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium mb-3">Column Statistics</h4>
        <div className="space-y-4">
          {columns.map(column => {
            const stats = getColumnStats(column);
            return (
              <div key={column} className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">{column}</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Unique Values: {stats.unique}</div>
                  {stats.numeric && (
                    <>
                      <div>Min: {stats.min}</div>
                      <div>Max: {stats.max}</div>
                      <div>Average: {stats.avg}</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 