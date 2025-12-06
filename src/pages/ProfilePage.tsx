import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/service";
import type { User } from "../types/general";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ProfilePage = () => {
  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const [stats, setStats] = useState({ hosted: 0, joined: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const username = sessionStorage.getItem("auth_user");
    const password = sessionStorage.getItem("auth_password");
    if (!username || !password) {
      navigate("/landing");
      return;
    }

    supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          const tempUser = data[0];
          setUser({ id: tempUser.id, username: tempUser.username });
        } else {
          navigate("/login");
        }
      });

    supabase
      .from("events")
      .select("id, host_id")
      .then(({ data }) => {
        if (data) {
          const hostedCount = data.filter((e) => e.host_id === user.id).length;
          setStats((prev) => ({ ...prev, hosted: hostedCount }));
        }
      });

    supabase
      .from("event_requests")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setStats((prev) => ({
            ...prev,
            joined: data.filter((r) => r.status === "accepted").length,
          }));
        }
      });
  }, [navigate, user.id]);

  const handleLogout = () => {
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_password");
    navigate("/login");
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-50 to-white flex justify-center items-start p-6">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/30 p-6 mt-12">
        <h1 className="text-3xl font-bold text-gray-700 mb-6">Profile</h1>

        <div className="mb-4">
          <p className="text-gray-600 font-medium">Username</p>
          <p className="text-gray-800">{user.username}</p>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 font-medium">Events Hosted</p>
          <p className="text-gray-800">{stats.hosted}</p>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 font-medium">Events Joined</p>
          <p className="text-gray-800">{stats.joined}</p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition shadow-md flex items-center justify-center gap-2"
        >
          <CheckCircleIcon fontSize="small" /> Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
