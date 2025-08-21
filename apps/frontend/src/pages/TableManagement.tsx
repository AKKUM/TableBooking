import React from 'react';

const TableManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
        <p className="text-gray-600">Create, edit, and manage restaurant tables.</p>
      </div>
      
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Tables</h3>
          <button className="btn-primary">Add New Table</button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">No tables configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">Start by adding your first table.</p>
        </div>
      </div>
    </div>
  );
};

export default TableManagement;
