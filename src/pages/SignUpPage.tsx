import { useState } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/service";

const SignUpPage = () => {
  const navigate = useNavigate();

  const signup = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, password }]);

    if (!error) {
      sessionStorage.setItem("auth_user", username);
      sessionStorage.setItem("auth_password", password);
      navigate("/");
    } else {
      alert("Error during signup: " + error);
    }
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
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
          Create Your Account
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
          onClick={() => signup(username, password)}
          className="
            w-full py-3 
            bg-green-500 
            text-white 
            rounded-xl 
            font-medium
            shadow-md
            hover:bg-green-600
            transition
          "
        >
          Sign Up
        </button>

        <p className="text-center text-gray-700">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 font-medium hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
