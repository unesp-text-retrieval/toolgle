import Sidebar from "@/components/Sidebar"; // Import the Sidebar component

export default function Models() {
  return (
    <div className="h-screen flex">
      <Sidebar /> {/* Add the Sidebar component */}
      <div className="flex-1 flex flex-col justify-between bg-gray-100 p-4">

        {/* Models Section */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold mb-4 text-center">Models</h2>
          <div className="p-3 border border-gray-300 rounded-md bg-white shadow-md">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">Elastic BM25</h3>
            <p className="text-green-600 font-semibold">Active - Running</p>
          </div>
        </div>

        
      </div>
    </div>
  );
}