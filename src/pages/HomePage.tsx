import { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Event } from '../types/general';
import type {Notification} from '../types/general';
import NotificationController from '../components/NotificationController';
import type {User} from '../types/general';
import supabase from '../services/service';
import {useNavigate} from 'react-router';
import EventCard from '../components/EventCard';
import "../styles/mapStyles.css";

const UNIVERSITY_CITY_UPENN = { lat: 39.9522, lng: -75.1932 };


function HomePage() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(UNIVERSITY_CITY_UPENN);
  const [locationFetched, setLocationFetched] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [user, setUser] = useState<User>({id: -1, username: ''});
  const [events, setEvents] = useState<Event[]>([]);

  const navigate = useNavigate();



  useEffect(() => {
    const username = sessionStorage.getItem('auth_user');
    const password = sessionStorage.getItem('auth_password');
    if (!username || !password) {
      navigate('/login');
      return;
    }
    supabase.from('users').select('*').eq('username', username).eq('password', password).then(({data, error}) => {
      if (data && data.length > 0) {
        const tempUser = data[0];
        setUser({id: tempUser.id, username: tempUser.username});
      } 

      if (error) {
        alert('Error during authentication:' + error);
        navigate('/login')
      }
    }
    )
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
    event_attendees (
      user_id,
      user:users ( id, username )
    ),
    event_requests (
      user_id,
      status,
      user:users ( id, username )
    )
  `).then(({ data, error }) => {
      if (error) {
        console.error("Error fetching events:", error);
      } else {
        console.log("Fetched events:", data);
        setEvents(data!.map((item) => ({
          id: item.id,
          name: item.title,
          // @ts-ignore
          user: item.host.username, 
          description: item.description,
          location: {
            lat: item.latitude,
            lng: item.longitude
          },
          startTime: new Date(item.created_at),
          requests: item.event_requests.map((req) => ({
            event_id: item.id,
            status: req.status,
            user: {
              // @ts-ignore
              id: req.user.id,
              // @ts-ignore
              username: req.user.username
            }
          })),
          place: item.place,
          emoji: item.emoji
        })));
      }
    });
  }, []);


  useEffect(() => {
    const notificationsTemp: Notification[] = [];
    events.forEach((event) => { 
      if (event.user === user.username) {
        const pendingRequests = event.requests.filter(request => request.status === 'pending');
        pendingRequests.forEach((request) => {
        const notif: Notification = Object.assign({}, {
            key: `${event.id}-${request.user.id}`,
            component: (
              <div className="flex justify-center">
                <p className="text-sm"><strong className="text-blue-400">{request.user.username}</strong> has requested to join <strong className="text-blue-400">{event.name}</strong></p>
              </div>
            )
          });
          notificationsTemp.push(notif);
        });
      }
    })
    setNotifications(notificationsTemp);
  }, [events, user]);

  useEffect(() => {
    getUserLocation();
  }, []);


  useEffect(() => {
    if (!locationFetched || mapRef.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoiZHl6aGFvNzM3OSIsImEiOiJjbTEybWdwY3QwYzd2MmlvamdyMTZ6Z2p0In0.bBlKaVU-2ZO7gWdv1UHdEg";
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      style: 'mapbox://styles/mapbox/streets-v12'
    });

    const wrapper = document.createElement("div");
    const el = document.createElement('div');
    el.className = 'pulse-marker';
    wrapper.appendChild(el);

    new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your Location'))
      .addTo(mapRef.current);

    return () => {
    mapRef.current?.remove()
    mapRef.current = null;
    };
  }, [locationFetched, userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    const filteredEvents = events.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );


  const randomEmojis = ['🎉', '🎊', '🥳', '🎈', '🍾', '✨'];

    // Add new markers
    
  filteredEvents.forEach((event) => {
    const wrapper = document.createElement("div");
    const el = document.createElement('div');
    el.className = 'emoji-marker bounce rotate-2';
    el.textContent = randomEmojis[event.id % randomEmojis.length];
    wrapper.appendChild(el);
  const marker = new mapboxgl.Marker({element: wrapper, anchor: 'center'})
    .setLngLat([event.location.lng, event.location.lat])
    .setPopup(
      new mapboxgl.Popup({offset: 24}).setHTML(`
        <div class="p-3 bg-white/70 backdrop-blur-md border border-white/30 shadow-lg rounded-xl">
          <h3 class="text-base font-semibold text-gray-800">${event.name}</h3>
          <p class="text-xs text-gray-600 mt-1">${event.description}</p>
        </div>
      `)
    )
    .addTo(mapRef.current);

  markersRef.current[event.id] = marker;

  marker.getElement().addEventListener("click", () => {
    setActiveEventId(event.id);
  });
});
  }, [events, searchQuery]);

   useEffect(() => {
    if (activeEventId !== null && mapRef.current) {
      const activeEvent = events.find(event => event.id === activeEventId);
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
          duration: 1000
        });

        marker.togglePopup();
      }
    }
  }, [activeEventId, events]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationFetched(true);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationFetched(true);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLocationFetched(true);
    }
  };


   return (
    <div id="container" className="h-screen w-screen relative">
      <NotificationController queue={notifications} />
      <div className="absolute top-12 w-full px-4 z-[60] pointer-events-none">
  <input
    placeholder="Search"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="
      mt-8
      w-full
      pointer-events-auto
      z-[99]
      relative
      rounded-xl
      bg-white/80
      backdrop-blur-md
      shadow-lg
      px-4
      py-3
      text-gray-800
      placeholder-gray-400
      border border-gray-200
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
      focus:border-transparent
      transition
    "
  />
</div>
      
      <div id="map-container" className="h-full w-full" ref={mapContainerRef}></div>
      <EventCard event={events.find(event => event.id === activeEventId)} /> 


    </div>
  );
}

export default HomePage;
