export const metadata = {
  title: "Blog | Gaurav.one",
  description: "Insights, tutorials, and articles",
};

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-6xl mb-6">✍️</div>
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-gray-400 text-lg mb-8">Insights, tutorials, and tech articles</p>
        <div className="inline-block px-6 py-3 bg-gray-800 rounded-lg text-gray-300">
          Coming Soon
        </div>
      </div>
    </main>
  );
}
