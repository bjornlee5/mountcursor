import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { logOut } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                AI Image Generator
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-500"
              >
                Generate
              </Link>
              <Link
                href="/my-images"
                className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-gray-500"
              >
                My Images
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={logOut}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 