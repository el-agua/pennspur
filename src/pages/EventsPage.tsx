import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/service";
import type { Event, User } from "../types/general";

const EventsPage = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const [events, setEvents] = useState<Event[]>([]);
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
    supabase
      .from("events")
      .select(
        `
        id,
        title,
        description,
        latitude,
        longitude,
        created_at,
        place,
        emoji,
        start_time,
        active,
        host:host_id ( id, username ),
        event_requests (
          user_id,
          status,
          user:users ( id, username )
        )
      `,
      )
      .eq("active", true)
      .then(({ data, error }) => {
        if (error) {
          setLoading(false);
          return;
        };
        setEvents(
          data!.map((item) => ({
            active: item.active,
            id: item.id,
            name: item.title,
            user: item.host.username,
            description: item.description,
            location: { lat: item.latitude, lng: item.longitude },
            startTime: new Date(item.start_time),
            requests: item.event_requests.map((req) => ({
              status: req.status,
              user: {
                id: req.user.id,
                username: req.user.username,
              },
            })),
            place: item.place,
            emoji: item.emoji,
          })),
        );
        setLoading(false);
      });
  }, []);

  const hostingActive = useMemo(() => {
    return events.filter(
      (ev) => ev.user === user.username && ev.startTime <= new Date(),
    );
  }, [events, user]);

  const hostingUpcoming = useMemo(() => {
    return events.filter(
      (ev) => ev.user === user.username && ev.startTime > new Date(),
    );
  }, [events, user]);

  const requestedJoin = useMemo(() => {
    return events.filter((ev) => {
      return ev.requests.some(
        (r) => r.user.id === user.id && r.status === "accepted",
      );
    });
  }, [events, user]);

  const pendingRequests = useMemo(() => {
    return events.filter((ev) => {
      return ev.requests.some(
        (r) => r.user.id === user.id && r.status === "pending",
      );
    });
  }, [events, user]);

  const handleToggleActive = async (ev) => {
    await supabase
      .from("events")
      .update({ active: !ev.active })
      .eq("id", ev.id);
    window.location.reload();
  };

  const Section = ({ title, data }) =>
    data.length === 0 ? (
      <></>
    ) : (
      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
        <div className="space-y-3">
          {data.map((ev) => (
            <div
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}`)}
              className="cursor-pointer bg-white/70 backdrop-blur-md border border-white/30 p-4 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div className="w-48">
                  <div className="text-2xl">{ev.emoji ?? "🎉"}</div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {ev.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{ev.description}</p>
                </div>
                {title.includes("Hosting") &&
                  (ev.startTime <= new Date() ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(ev);
                      }}
                      className="px-4 py-2 bg-red-300 text-white text-xs rounded-xl shadow hover:scale-105 transition"
                    >
                      End Event
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(ev);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white text-xs rounded-xl shadow hover:scale-105 transition"
                    >
                      Delete Event
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (loading) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
          <div className="animate-spin h-10 w-10 border-4 border-blue-400 rounded-full border-t-transparent"></div>
        </div>
      );
    }

  return (
    <div className="min-h-[100dvh] p-6 bg-gradient-to-b from-blue-50 to-white flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800">Your Events</h1>

      <Section title="Active Events You're Hosting" data={hostingActive} />
      <Section title="Upcoming Events You're Hosting" data={hostingUpcoming} />
      <Section title="Events You're Attending" data={requestedJoin} />
      <Section title="Pending Requests" data={pendingRequests} />
      <div id="blank-space" className="h-48"></div>
    </div>
  );
};

export default EventsPage;
