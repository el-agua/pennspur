import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/service";
import type { User } from "../types/general";

interface Group {
  id: number;
  name: string;
}

const GroupsPage = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

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
        }
        if (error) navigate("/login");
      });
  }, []);

  useEffect(() => {
    if (user.id === -1) return;

    supabase
      .from("groups")
      .select("id, name")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) setGroups(data);
        setLoading(false);
      });
  }, [user]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    const { data, error } = await supabase
      .from("groups")
      .insert([{ name: newGroupName, user_id: user.id }])
      .select();

    if (!error && data) {
      setGroups((g) => [...g, data[0]]);
      setNewGroupName("");
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    await supabase.from("groups").delete().eq("id", groupId);
    setGroups((g) => g.filter((x) => x.id !== groupId));
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
          <div className="animate-spin h-10 w-10 border-4 border-blue-400 rounded-full border-t-transparent"></div>
        </div>
      );
    }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-blue-50 to-white flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800">Your Groups</h1>

      <div className="mt-6 w-full max-w-md bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Create New Group</h2>
        <input
          className="w-full p-2 border rounded-lg"
          placeholder="Group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button
          className="w-full bg-blue-500 text-white p-2 rounded-xl hover:opacity-90"
          onClick={handleCreateGroup}
        >
          Create Group
        </button>
      </div>

      <div className="mt-10 w-full max-w-2xl">
        {groups.length === 0 ? (
          <p className="text-gray-600 mt-6">No groups yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                className="cursor-pointer bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-xl shadow hover:shadow-lg transition flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {g.name}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(g.id);
                  }}
                  className="px-3 py-1 bg-red-400 text-white text-xs rounded-xl hover:scale-105 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-48"></div>
    </div>
  );
};

export default GroupsPage;
