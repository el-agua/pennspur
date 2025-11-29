import type { Event } from "../types/general";
import supabase from "../services/service";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import type { User } from "../types/general";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const EventDetails = () => {
  const eventId = useParams().eventId;

  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const [events, setEvents] = useState<Event[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const username = sessionStorage.getItem("auth_user");
    const password = sessionStorage.getItem("auth_password");
    if (!username || !password) {
      navigate("/login");
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
        if (error) {
          alert("Error during authentication:" + error);
          navigate("/login");
        }
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
        host:host_id ( id, username ),
        event_requests (
          user_id,
          status,
          user:users ( id, username )
        )
      `,
      )
      .then(({ data, error }) => {
        if (!error && data) {
          setEvents(
            data.map((item) => ({
              id: item.id,
              name: item.title,
              user: item.host.username,
              userId: item.host.id,
              description: item.description,
              location: { lat: item.latitude, lng: item.longitude },
              startTime: new Date(item.start_time),
              requests: item.event_requests.map((req) => ({
                status: req.status,
                user: req.user,
              })),
              place: item.place,
              emoji: item.emoji,
            })),
          );
        }
      });
  }, []);

  const event = useMemo(
    () => events.find((ev) => ev.id === parseInt(eventId || "")),
    [events, eventId],
  );

  const eventStatus = useMemo(() => {
    if (!event) return null;
    const req = event.requests.find((r) => r.user.id === user.id);
    return req ? req.status : null;
  }, [event, user]);

  const requestToJoinEvent = async () => {
    if (!eventId) return;
    const { error } = await supabase.from("event_requests").insert([
      {
        event_id: parseInt(eventId),
        user_id: user.id,
        status: "pending",
      },
    ]);
    if (error) return console.error(error);

    setSuccess(true);
    setTimeout(() => navigate("/"), 1500);
  };

  const changeRequestStatus = async (
    targetUserId: number,
    newStatus: string,
  ) => {
    await supabase
      .from("event_requests")
      .update({ status: newStatus })
      .eq("event_id", event!.id)
      .eq("user_id", targetUserId);

    const updated = await supabase
      .from("event_requests")
      .select("user_id, status, user:users ( id, username )")
      .eq("event_id", event!.id);

    if (updated.data) {
      event!.requests = updated.data.map((req) => ({
        status: req.status,
        user: req.user,
      }));
    }

    setEvents([...events]);
  };

  const accepted = event?.requests.filter((r) => r.status === "accepted") || [];
  const pending = event?.requests.filter((r) => r.status === "pending") || [];
  const rejected = event?.requests.filter((r) => r.status === "rejected") || [];

  const isHost = user.id === event?.userId;

  if (!event)
    return (
      <div className="p-8 text-center text-gray-600">Event not found.</div>
    );

  const timeMessage = () => {
    var number = Math.round((Date.now() - event.startTime.getTime()) / 60000);
    var unit = "min";
    if (number >= 60 || number <= -60) {
      number = Math.round(number / 60);
      unit = "hour" + (Math.abs(number) !== 1 ? "s" : "");
    }
    if (number < 0) return `Will start in ${Math.abs(number)} ${unit}`;
    if (number >= 1) return `Started ${number} ${unit} ago`;
    return "Started just now";
  };

  return (
    <div className="relative flex flex-col items-center p-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <button
        onClick={() => navigate("/events")}
        className="absolute right-4 top-4 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-gray-200 hover:scale-105 transition"
      >
        Close
      </button>

      <div className="mt-12 w-full max-w-xl bg-white/70 backdrop-blur-xl shadow-lg border border-white/30 rounded-2xl p-6 animate-fadeIn">
        {success && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300 flex items-center gap-2">
            <CheckCircleIcon fontSize="small" /> Request sent!
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">{event.emoji ?? "🎉"}</div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {event.name}
            </h2>
            <p className="text-gray-500 text-sm">
              Hosted by{" "}
              <span className="text-blue-500 font-medium">
                {isHost ? "me" : event.user}
              </span>
            </p>
          </div>
        </div>

        {event.place && (
          <p className="mt-2 text-gray-700 text-sm">📍 {event.place}</p>
        )}

        <p className="mt-3 text-gray-600 text-sm">{timeMessage()}</p>

        <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
          <p className="text-gray-700">{event.description}</p>
        </div>

        <div className="mt-6">
          {!eventStatus && !isHost && (
            <button
              onClick={requestToJoinEvent}
              className="w-full mt-3 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 hover:scale-[1.03] transition shadow-md"
            >
              Request to Join
            </button>
          )}
        </div>

        {/* Attendee Section */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Attendees
          </h3>

          {/* Accepted - visible to everyone */}
          <div>
            <h4 className="font-medium text-green-700 mb-1">Accepted</h4>
            <div className="space-y-2">
              {accepted.map((r) => (
                <div
                  key={r.user.id}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg text-gray-700"
                >
                  {r.user.username}
                </div>
              ))}
              {accepted.length === 0 && (
                <p className="text-gray-400 text-sm">No accepted attendees.</p>
              )}
            </div>
          </div>

          {/* Pending & Rejected - only visible to host */}
          {isHost && (
            <>
              <div className="mt-6">
                <h4 className="font-medium text-yellow-700 mb-1">Pending</h4>
                <div className="space-y-2">
                  {pending.map((r) => (
                    <div
                      key={r.user.id}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center"
                    >
                      <span className="text-gray-700">{r.user.username}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            changeRequestStatus(r.user.id, "accepted")
                          }
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            changeRequestStatus(r.user.id, "rejected")
                          }
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {pending.length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No pending requests.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-red-700 mb-1">Rejected</h4>
                <div className="space-y-2">
                  {rejected.map((r) => (
                    <div
                      key={r.user.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-gray-700"
                    >
                      {r.user.username}
                    </div>
                  ))}
                  {rejected.length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No rejected attendees.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
