export default function LoadingCard() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"/>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"/>
        <div className="h-4 bg-gray-200 rounded w-1/2"/>
        <div className="flex justify-between items-center mt-4">
          <div>
            <div className="h-3 bg-gray-200 rounded w-20 mb-1"/>
            <div className="h-4 bg-gray-200 rounded w-24"/>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24"/>
        </div>
      </div>
    </div>
  );
}

export function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {[...Array(8)].map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}