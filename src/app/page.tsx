import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">
          GrowthScript
        </h1>
        <p className="text-center text-gray-700 mb-6">
          An AI-powered performance marketing strategist. Sign in to open your
          dashboard.
        </p>
        <Link
          href="/login"
          className="block w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition text-center"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
