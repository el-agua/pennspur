import { useNavigate } from "react-router";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-blue-800">PennSpur</h1>
        <p className="text-l text-gray-700 max-w-xl mx-auto">
          Your gateway to connecting, sharing, and exploring events at Penn and
          beyond. Join the community today!
        </p>
      </div>

      <div className="mt-12 flex gap-6">
        <button
          onClick={() => navigate("/signup")}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-800 transition"
        >
          Sign Up
        </button>
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-4 bg-white text-blue-600 border border-blue-800 text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-50 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
