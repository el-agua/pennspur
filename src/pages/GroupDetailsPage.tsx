import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import supabase from "../services/service";
import type { User } from "../types/general";

interface Member {
  id: number;
  username: string;
}

const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<Member[]>([]);
  const [nonMembers, setNonMembers] = useState<Member[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredUsers = nonMembers.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()),
  );

  // Load user
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

  // Load group details + members
  useEffect(() => {
    console.log("HGELLO");
    if (!id) return;

    supabase
      .from("groups")
      .select("id, name")
      .eq("id", id)
      .then(({ data }) => {
        console.log(data);
        if (data && data.length > 0) setGroupName(data[0].name);
      });

    supabase
      .from("group_user")
      .select("user:users(id, username)")
      .eq("group_id", id)
      .then(({ data }) => {
        if (data) setMembers(data.map((row) => row.user));
      });

    supabase
      .from("users")
      .select("id, username")
      .then(({ data }) => {
        console.log(data);
        if (data) setAllUsers(data);
      });
  }, [id]);

  useEffect(() => {
    setNonMembers(allUsers.filter((u) => !members.some((m) => m.id === u.id)));
  }, [allUsers, members]);

  const addUserToGroup = async () => {
    if (!selectedUserId) return;

    await supabase
      .from("group_user")
      .insert([{ group_id: Number(id), user_id: selectedUserId }]);

    const userAdded = allUsers.find((u) => u.id === selectedUserId);
    if (userAdded) setMembers((m) => [...m, userAdded]);
  };

  const removeUserFromGroup = async (userId: number) => {
    await supabase
      .from("group_user")
      .delete()
      .eq("group_id", id)
      .eq("user_id", userId);

    setMembers((m) => m.filter((u) => u.id !== userId));
  };

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <button
        onClick={() => navigate("/groups")}
        className="absolute right-4 top-4 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-gray-200 hover:scale-105 transition"
      >
        Back
      </button>
      <div className="min-h-screen p-6 bg-gradient-to-b from-blue-50 to-white flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 mt-12">{groupName}</h1>

        <div className="mt-6 w-full max-w-md bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-xl shadow space-y-3 z-20">
          <h2 className="text-lg font-semibold">Add User</h2>

          <div className="relative" ref={wrapperRef}>
            <input
              type="text"
              className="w-full p-2 border rounded-lg"
              placeholder="Type a username…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && filteredUsers.length > 0 && (
              <div
                className="
          absolute 
          top-full
          left-0
          w-full
          bg-white 
          border 
          rounded-xl 
          shadow-xl 
          max-h-60 
          overflow-y-auto 
          z-50
          mt-2 
        "
              >
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 cursor-pointer hover:bg-blue-100 transition"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setSearch(u.username);
                      setShowDropdown(false);
                    }}
                  >
                    {u.username}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="w-full bg-blue-500 text-white p-2 rounded-xl hover:opacity-90"
            onClick={addUserToGroup}
          >
            Add
          </button>
        </div>

        <div className="mt-10 w-full max-w-2xl space-y-3">
          {members.length === 0 ? (
            <p className="text-gray-600">No members yet.</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-xl shadow flex items-center justify-between"
              >
                <div className="text-lg font-semibold">{m.username}</div>
                <button
                  className="px-3 py-1 bg-red-400 text-white text-xs rounded-xl hover:scale-105 transition"
                  onClick={() => removeUserFromGroup(m.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        <div className="h-48"></div>
      </div>
    </>
  );
};

export default GroupDetailsPage;
