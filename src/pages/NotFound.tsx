import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center px-6 max-w-lg">
        {/* Large Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-emerald-50 animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center">
            <Search className="h-20 w-20 text-emerald-500 opacity-80" />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-7xl font-bold text-gray-900 tracking-tight mb-4">
          404
        </h1>

        {/* Friendly Message */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Page not found
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          <br className="hidden sm:block" />
          Don't worry — let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg shadow-sm"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg"
          >
            <Link to="/contact">
              <HelpCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back to previous page
        </button>

        {/* Path Info (subtle debug) */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-300">
            Requested: <code className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-400">{location.pathname}</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
