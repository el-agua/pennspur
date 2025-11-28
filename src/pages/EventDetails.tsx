import type { Event } from '../types/general';
import supabase from '../services/service';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { User } from '../types/general';
import CheckCircleIcon from "@mui/icons-material/CheckCircle"

const EventDetails = () => {
  const eventId = useParams().eventId;

  const [user, setUser] = useState<User>({ id: -1, username: '' });
  const [events, setEvents] = useState<Event[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const username = sessionStorage.getItem('auth_user');
    const password = sessionStorage.getItem('auth_password');
    if (!username || !password) {
      navigate('/login');
      return;
    }

    supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          const tempUser = data[0];
          setUser({ id: tempUser.id, username: tempUser.username });
        }
        if (error) {
          alert('Error during authentication:' + error);
          navigate('/login');
        }
      });
  }, []);

  useEffect(() => {
    supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        latitude,
        longitude,
        created_at,
        place,
        emoji,
        host:host_id ( id, username ),
        event_requests (
          user_id,
          status,
          user:users ( id, username )
        )
      `)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error:", error);
        } else {
          setEvents(
            data!.map((item) => ({
              id: item.id,
              name: item.title,
              user: item.host.username,
              description: item.description,
              location: { lat: item.latitude, lng: item.longitude },
              startTime: new Date(item.created_at),
              requests: item.event_requests.map((req) => ({
                status: req.status,
                user: {
                  id: req.user.id,
                  username: req.user.username,
                },
              })),
              place: item.place,
              emoji: item.emoji,
            }))
          );
        }
      });
  }, []);

  const event: Event | undefined = useMemo(() => {
    return events.find((ev) => ev.id === parseInt(eventId || ''));
  }, [events, eventId]);

  const eventStatus = useMemo(() => {
    if (!event) return null;
    const req = event.requests.find((r) => r.user.id === user.id);
    return req ? req.status : null;
  }, [event, user]);

  const requestToJoinEvent = async () => {
    if (!eventId) return;
    const { error } = await supabase.from('event_requests').insert([
      {
        event_id: parseInt(eventId),
        user_id: user.id,
        status: 'pending',
      },
    ]);
    if (error) {
      console.error(error);
      return;
    }
    setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    
  };

  if (!event) {
    return (
      <div className="p-8 text-center text-gray-600">
        Event not found.
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center p-6 min-h-screen bg-gradient-to-b from-blue-50 to-white">
      
      <button
        onClick={() => navigate("/")}
        className="absolute right-4 top-4 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl shadow-md border border-gray-200 hover:scale-105 transition"
      >
        Close
      </button>

      <div className="
        mt-12 w-full max-w-xl 
        bg-white/70 backdrop-blur-xl 
        shadow-lg border border-white/30 
        rounded-2xl p-6 animate-fadeIn
      ">
        { success && 
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300 flex items-center gap-2">
                    <CheckCircleIcon fontSize="small" /> Request sent!
        </div>
        }
        
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {event.emoji ?? "🎉"}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {event.name}
            </h2>
            <p className="text-gray-500 text-sm">
              Hosted by <span className="text-blue-500 font-medium">{event.user}</span>
            </p>
          </div>
        </div>

        {event.place && (
          <p className="mt-2 text-gray-700 text-sm">
            📍 {event.place}
          </p>
        )}

        <p className="mt-3 text-gray-600 text-sm">
          Started {Math.round((Date.now() - event.startTime.getTime()) / (1000 * 60))} min ago
        </p>

        <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
          <p className="text-gray-700">{event.description}</p>
        </div>

        <div className="mt-6">
          {eventStatus === "accepted" && (
            <p className="text-green-600 font-semibold">You are attending this event.</p>
          )}
          {eventStatus === "pending" && (
            <p className="text-yellow-600 font-semibold">Your request is pending.</p>
          )}
          {eventStatus === "rejected" && (
            <p className="text-red-600 font-semibold">Your request was rejected.</p>
          )}

          {!eventStatus && (
            <button
              onClick={requestToJoinEvent}
              className="
                w-full mt-3 py-3 
                bg-green-500 text-white 
                font-medium rounded-xl 
                hover:bg-green-600 hover:scale-[1.03] 
                transition shadow-md
              "
            >
              Request to Join
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default EventDetails;
