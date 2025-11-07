import { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import Navbar from './components/Navbar'
import type { Event } from './types/general';
import ContentController from './components/ContentController';
import supabase from './services/service';

const UNIVERSITY_CITY_UPENN = { lat: 39.9522, lng: -75.1932 };

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>(UNIVERSITY_CITY_UPENN);
  const [locationFetched, setLocationFetched] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(192);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('events');
  const [user, setUser] = useState<any>(4);

  const [events, setEvents] = useState<Event[]>([]);

  const COLLAPSED_HEIGHT = 180; 
  const EXPANDED_HEIGHT = 500;

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
          }
        })));
      }
    });
  }, []);

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

    new mapboxgl.Marker({ color: 'blue' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your Location'))
      .addTo(mapRef.current);

    return () => mapRef.current?.remove();
  }, [locationFetched, userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    // Add new markers
    events.forEach((event) => {
      const marker = new mapboxgl.Marker({ color: 'red' })
        .setLngLat([event.location.lng, event.location.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <h3 class="font-bold">${event.name}</h3>
            <p class="text-sm">${event.description}</p>
          </div>`
        ))
        .addTo(mapRef.current);

      markersRef.current[event.id] = marker;

      marker.getElement().addEventListener('click', () => {
        setActiveEventId(event.id);
      });
    });
  }, [events]);

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

  const handleEventClick = (event: Event) => {
    setActiveEventId(event.id);
  };

  const handleDragStart = (e: MouseEvent | TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    setStartHeight(drawerHeight);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY - clientY;
    const newHeight = Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT, startHeight + deltaY));
    setDrawerHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const midpoint = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
    if (drawerHeight < midpoint) {
      setDrawerHeight(COLLAPSED_HEIGHT);
    } else {
      setDrawerHeight(EXPANDED_HEIGHT);
    }
  };

  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const endHandler = () => handleDragEnd();
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', endHandler);
      window.addEventListener('touchmove', moveHandler);
      window.addEventListener('touchend', endHandler);
      
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', endHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('touchend', endHandler);
      };
    }
  }, [isDragging, startY, startHeight, drawerHeight]);

  return (
    <div id="container" className="h-screen w-screen relative">
      <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-90 p-2 text-sm z-10">
        {userLocation ? `User Location: Latitude ${userLocation.lat.toFixed(4)}, Longitude ${userLocation.lng.toFixed(4)}` : "Fetching user location..."}
      </div>
      <div id="map-container" className="h-full w-full" ref={mapContainerRef}></div>
      <div 
        id="event-list" 
        ref={dragRef}
        className="w-full bg-white absolute bottom-24 left-0 rounded-t-3xl shadow-top overflow-hidden"
        style={{ 
          height: `${drawerHeight}px`,
          transition: isDragging ? 'none' : 'height 0.3s ease-out'
        }}
      >
        <div 
          className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>
        <div className={`overflow-y-auto p-4`} style={{ height: `${drawerHeight - 20}px` }}>
          <ContentController 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            events={events} 
            activeEventId={activeEventId} 
            handleEventClick={handleEventClick}
            userId={user}
          />
        </div>
      </div>
      <Navbar setActiveTab={setActiveTab} activeTab={activeTab} />
    </div>
  );
}

export default App;
