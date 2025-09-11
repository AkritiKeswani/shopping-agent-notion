export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Searching for deals...</p>
      <p className="text-sm text-gray-500 mt-2">
        This may take a few minutes as we scrape the websites
      </p>
    </div>
  );
}
