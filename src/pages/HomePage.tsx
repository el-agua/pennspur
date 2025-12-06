import { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Event } from "../types/general";
import type { Notification } from "../types/general";
import NotificationController from "../components/NotificationController";
import type { User } from "../types/general";
import supabase from "../services/service";
import { useNavigate } from "react-router";
import EventCard from "../components/EventCard";
import "../styles/mapStyles.css";

const UNIVERSITY_CITY_UPENN = { lat: 39.9522, lng: -75.1932 };

function HomePage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  }>(UNIVERSITY_CITY_UPENN);
  const [locationFetched, setLocationFetched] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cleared, setCleared] = useState<boolean>(false);

  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const [events, setEvents] = useState<Event[]>([]);

  const [groups, setGroups] = useState<
    { id: number; name: string; user_id: number }[]
  >([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const navigate = useNavigate();

  //Auth
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
        active,
        host:host_id (id, username),
        event_attendees (user_id, user:users (id, username)),
        event_requests (user_id, status, user:users (id, username))
      `,
      )
      .eq("active", true)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching events:", error);
        } else {
          setEvents(
            data!.map((item) => ({
              id: item.id,
              name: item.title,
              // @ts-ignore
              user: item.host.username,
              // @ts-ignore
              user_id: item.host.id,
              description: item.description,
              location: { lat: item.latitude, lng: item.longitude },
              startTime: new Date(item.start_time),
              requests: item.event_requests.map((req) => ({
                event_id: item.id,
                status: req.status,
                user: { id: req.user.id, username: req.user.username },
              })),
              place: item.place,
              emoji: item.emoji,
            })),
          );
        }
      });
  }, []);

  useEffect(() => {
    if (user.id === -1) return;

    supabase
      .from("groups")
      .select("user_id, id, name, group_user(user_id)")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          console.log(data);
          setGroups(
            data.map((row) => ({
              id: row.id,
              name: row.name,
              user_id: row.user_id,
              members: row.group_user.map((gu: any) => gu.user_id),
            })),
          );
        }
      });
  }, [user]);

  useEffect(() => {
    const notificationsTemp: Notification[] = [];
    events.forEach((event) => {
      if (event.user === user.username) {
        const pendingRequests = event.requests.filter(
          (request) => request.status === "pending",
        );
        pendingRequests.forEach((request) => {
          const notif: Notification = {
            key: `${event.id}-${request.user.id}`,
            component: (
              <div className="flex justify-center">
                <p className="text-sm">
                  <strong className="text-blue-400">
                    {request.user.username}
                  </strong>{" "}
                  has requested to join{" "}
                  <strong className="text-blue-400">{event.name}</strong>
                </p>
              </div>
            ),
          };
          notificationsTemp.push(notif);
        });
      }
    });
    setNotifications(notificationsTemp);
  }, [events, user]);

  useEffect(() => getUserLocation(), []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationFetched(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationFetched(true);
        },
      );
    } else {
      setLocationFetched(true);
    }
  };

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoiZHl6aGFvNzM3OSIsImEiOiJjbTEybWdwY3QwYzd2MmlvamdyMTZ6Z2p0In0.bBlKaVU-2ZO7gWdv1UHdEg";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      style: "mapbox://styles/mapbox/streets-v12",
    });

    const wrapper = document.createElement("div");
    const el = document.createElement("div");
    el.className = "pulse-marker";
    wrapper.appendChild(el);

    new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText("Your Location"))
      .addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [locationFetched, userLocation]);

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup =
      selectedGroupIds.length === 0 ||
      groups
        .filter((g) => selectedGroupIds.includes(g.id))
        .some((g) => g.members && g.members.includes(event.user_id));

    return matchesSearch && matchesGroup;
  });

  useEffect(() => {
    if (!mapRef.current) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const randomEmojis = ["🎉", "🎊", "🥳", "🎈", "🍾", "✨"];

    filteredEvents.forEach((event) => {
      const wrapper = document.createElement("div");
      const el = document.createElement("div");
      el.className = "emoji-marker bounce rotate-2";
      el.textContent = event.emoji
        ? event.emoji
        : randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
      wrapper.appendChild(el);

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: "center" })
        .setLngLat([event.location.lng, event.location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 24 }).setHTML(`
            <div class="p-3 bg-white/70 backdrop-blur-md border border-white/30 shadow-lg rounded-xl min-w-32">
              <h3 class="text-base font-semibold text-gray-800">${event.name}</h3>
              <p class="text-xs text-gray-600 mt-1">${event.description}</p>
            </div>
          `),
        )
        .addTo(mapRef.current);

      markersRef.current[event.id] = marker;

      const markerEl = marker.getElement();

// For touchscreen: tap should behave like click
markerEl.addEventListener("touchstart", (e) => {
  e.preventDefault();        // stops hover state
  markerEl.click();          // triggers the click stack
});

// Optional fallback if you want click too:
markerEl.addEventListener("click", () => {
  setActiveEventId(event.id);
});
    });
  }, [filteredEvents]);

  useEffect(() => {
    if (activeEventId !== null && mapRef.current) {
      const activeEvent = filteredEvents.find(
        (event) => event.id === activeEventId,
      );
      const marker = markersRef.current[activeEventId];

      Object.entries(markersRef.current).forEach(([id, m]) => {
        if (m && m.getPopup().isOpen()) {
          m.togglePopup();
        }
      });

      if (activeEvent && marker) {
        mapRef.current.flyTo({
          center: [activeEvent.location.lng, activeEvent.location.lat],
          zoom: 16,
          duration: 1000,
        });

        marker.togglePopup();
      }
    }
  }, [activeEventId, filteredEvents]);

  return (
   <div id="container" className="min-h-[100dvh] w-screen relative overflow-hidden">
      <NotificationController queue={notifications} setCleared={setCleared} />

      <div className="absolute top-12 w-full px-4 z-[60] pointer-events-none">
        {cleared || notifications.length === 0 ? (
          <input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pointer-events-auto z-[99] relative rounded-xl bg-white/80 backdrop-blur-md shadow-lg px-4 py-3 text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
          />
        ) : (
          <input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`mt-8 w-full pointer-events-auto z-[99] relative rounded-xl bg-white/80 backdrop-blur-md shadow-lg px-4 py-3 text-gray-800 placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
          />
        )}

        <div className="mt-2 w-full z-[60] pointer-events-none">
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            {groups.map((g) => {
              const active = selectedGroupIds.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() =>
                    setSelectedGroupIds((old) =>
                      old.includes(g.id)
                        ? old.filter((id) => id !== g.id)
                        : [...old, g.id],
                    )
                  }
                  className={`
                  px-3 py-1 rounded-full text-sm transitionbackdrop-blur-md shadow-lg  
                  ${active ? "bg-blue-500 text-white" : " bg-white/80  text-gray-700"}
                `}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id="map-container"
        className="h-full w-full"
        ref={mapContainerRef}
      ></div>

      <EventCard event={events.find((event) => event.id === activeEventId)} />
    </div>
  );
}

export default HomePage;
