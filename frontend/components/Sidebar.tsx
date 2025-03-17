import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-gray-800 text-white flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-4">Information Retrieval ToolKit</h2>
      <ul>
      <li className="mb-3">
        <a href="/" className="block p-3 bg-gray-700 rounded hover:bg-gray-600">
        🔎&nbsp;&nbsp;&nbsp;Queries
        </a>
      </li>
      <li className="mb-3">
        <a href="datasets" className="block p-3 bg-gray-700 rounded hover:bg-gray-600">
        📙&nbsp;&nbsp;&nbsp;Datasets
        </a>
      </li>
      <li className="mb-3">
        <a href="models" className="block p-3 bg-gray-700 rounded hover:bg-gray-600">
        📈&nbsp;&nbsp;&nbsp;Models
        </a>
      </li>
      <li className="mb-3">
        <a href="indexes" className="block p-3 bg-gray-700 rounded hover:bg-gray-600">
        🗂️&nbsp;&nbsp;&nbsp;Indexes
        </a>
      </li>
      <li className="mb-3">
        <a href="evaluate" className="block p-3 bg-gray-700 rounded hover:bg-gray-600">
        🧪&nbsp;&nbsp;&nbsp;Evaluate
        </a>
      </li>
      </ul>
    </div>
  );
};

export default Sidebar;