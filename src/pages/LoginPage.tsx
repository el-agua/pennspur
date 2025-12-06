import { useState } from "react";
import supabase from "../services/service";
import { useNavigate } from "react-router";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password);

    if (data && data.length > 0) {
      sessionStorage.setItem("auth_user", username);
      sessionStorage.setItem("auth_password", password);
      navigate("/");
    } else {
      alert("Invalid username or password");
    }
    if (error) {
      alert("Error during login:" + error);
    }
  };

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 relative">
      <div
        className="
        w-[90%] max-w-md
        bg-white/70 
        backdrop-blur-xl 
        border border-white/40 
        rounded-2xl 
        shadow-xl 
        px-8 py-10
        flex flex-col gap-6
      "
      >
        <h1 className="text-2xl font-semibold text-gray-800 text-center">
          Welcome Back
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="
            w-full px-4 py-3 
            rounded-xl
            bg-white/70 
            backdrop-blur-md
            border border-gray-300
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition
            text-gray-700
          "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full px-4 py-3 
            rounded-xl
            bg-white/70 
            backdrop-blur-md
            border border-gray-300
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition
            text-gray-700
          "
        />

        <button
          onClick={() => login(username, password)}
          className="
            w-full py-3 
            bg-blue-500 
            text-white 
            rounded-xl 
            font-medium
            shadow-md
            hover:bg-blue-600
            transition
          "
        >
          Login
        </button>

        <p className="text-center text-gray-700">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-500 font-medium hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
