export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-white absolute top-0 left-0"></div>
      </div>
      <p className="mt-6 text-xl text-white font-medium">Searching for deals...</p>
      <p className="text-sm text-gray-400 mt-2 text-center max-w-md">
        Discovering the best deals from Aritzia, Reformation, and Free People
      </p>
    </div>
  );
}
