import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import supabase from "../services/service";
import type { User } from "../types/general";
import "mapbox-gl/dist/mapbox-gl.css";
import "react-map-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiZHl6aGFvNzM3OSIsImEiOiJjbTEybWdwY3QwYzd2MmlvamdyMTZ6Z2p0In0.bBlKaVU-2ZO7gWdv1UHdEg";

const EMOJI_OPTIONS = [
  "🎉",
  "🎈",
  "🎤",
  "🍕",
  "☕",
  "🎵",
  "🏞️",
  "🎓",
  "🎨",
  "🚀",
];

const UNIVERSITY_CITY_UPENN = { lat: 39.9522, lng: -75.1932 };

const CreateEvent = () => {
  const [user, setUser] = useState<User>({ id: -1, username: "" });
  const offset = new Date().getTimezoneOffset();

  const getLocalDateTimeString = () => {
    const now = new Date();
    now.setSeconds(0, 0); // Inputs don't show seconds

    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    latitude: UNIVERSITY_CITY_UPENN.lat.toString(),
    longitude: UNIVERSITY_CITY_UPENN.lng.toString(),
    emoji: EMOJI_OPTIONS[0],
    // Default is now
    start_time: getLocalDateTimeString(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      reverseGeocode(
        parseFloat(formData.latitude),
        parseFloat(formData.longitude),
      ).then((name) => setLocationName(name));
    } else {
      setLocationName("");
    }
  }, []);

  // Controls view: Form (false) vs. Map Picker (true)
  const [openMap, setOpenMap] = useState(false);

  const [viewState, setViewState] = useState({
    longitude: -74.006, // Default NYC
    latitude: 40.7128,
    zoom: 11,
  });

  const reverseGeocode = async (lat: number, lng: number) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (err) {
      console.error("Reverse geocode error:", err);
    }
    return "Unknown location";
  };

  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const navigate = useNavigate();
  const mapRef = useRef(null);

  // --- Auth Effect ---
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
          navigate("/landing");
        }
      });
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      emoji: EMOJI_OPTIONS[currentEmojiIndex],
    }));
  }, [currentEmojiIndex]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleMapMove = useCallback(
    (evt: any) => {
      setViewState(evt.viewState);
      // When the map is open and moving, update the form data immediately to the center of the viewport
      if (openMap) {
        setFormData((prev) => ({
          ...prev,
          latitude: evt.viewState.latitude.toFixed(6),
          longitude: evt.viewState.longitude.toFixed(6),
        }));
      }
    },
    [openMap],
  );

  const handleOpenMapPicker = () => {
    setOpenMap(true);
    // Fly to current selection or default view when opening map
    if (mapRef.current) {
      const targetLng = parseFloat(
        formData.longitude || viewState.longitude.toString(),
      );
      const targetLat = parseFloat(
        formData.latitude || viewState.latitude.toString(),
      );
      // @ts-ignore
      mapRef.current.flyTo({
        center: [targetLng, targetLat],
        zoom: 13,
        duration: 1000,
      });
      setViewState((prev) => ({
        ...prev,
        longitude: targetLng,
        latitude: targetLat,
        zoom: 13,
      }));
    }
  };

  const handleConfirmLocation = async () => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    const name = await reverseGeocode(lat, lng);
    setLocationName(name);
    setOpenMap(false);
  };

  const handleNextEmoji = () => {
    setCurrentEmojiIndex((prevIndex) => (prevIndex + 1) % EMOJI_OPTIONS.length);
  };

  const handlePreviousEmoji = () => {
    setCurrentEmojiIndex(
      (prevIndex) =>
        (prevIndex - 1 + EMOJI_OPTIONS.length) % EMOJI_OPTIONS.length,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !formData.title.trim() ||
      !formData.latitude ||
      !formData.emoji ||
      !formData.start_time
    ) {
      setError("Title, Location, Start Time, and Icon are required");
      setLoading(false);
      return;
    }
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    try {
      const { error } = await supabase
        .from("events")
        .insert([
          {
            title: formData.title,
            description: formData.description,
            latitude: lat,
            longitude: lng,
            host_id: user.id,
            emoji: formData.emoji,
            place: locationName,
            start_time: new Date(new Date(formData.start_time).getTime()),
          },
        ])
        .select();

      if (error) throw error;

      setSuccess("Event created successfully!");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const bottomPaddingClass = "pb-12";

  return (
    <div className={`min-h-screen relative overflow-hidden`}>
      <div
        className={`absolute inset-0 transition-filter transition-transform duration-1000 ease-in-out ${
          !openMap ? "filter blur-lg scale-105" : "filter blur-none scale-100"
        }`}
      >
        <Map
          ref={mapRef}
          {...viewState}
          onMove={handleMapMove}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {/* Marker for the selected location on the blurred background map */}
          {!openMap && formData.latitude && formData.longitude && (
            <Marker
              longitude={parseFloat(formData.longitude)}
              latitude={parseFloat(formData.latitude)}
              anchor="bottom"
              color="#3b82f6"
            />
          )}
        </Map>
      </div>

      <div
        className={`relative z-10 w-full min-h-screen pt-4 flex justify-center items-start 
                      transition-opacity duration-700 ease-in-out ${bottomPaddingClass} ${
                        openMap
                          ? "opacity-0 pointer-events-none"
                          : "opacity-100"
                      }`}
      >
        <div
          className="w-full max-w-lg p-6 
                         bg-white/70 backdrop-blur-md rounded-3xl 
                         border border-white/30 shadow-xl mx-4 sm:mx-0"
        >
          <h1 className="text-2xl font-bold mb-2 text-gray-700">
            Create New Event
          </h1>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300 flex items-center gap-2">
              <CheckCircleIcon fontSize="small" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} id="create-event-form">
            {/* Event Emoji Slideshow/Picker */}
            <div className="mb-4">
              <span className="text-gray-700 font-medium block mb-2">
                Event Icon
              </span>
              <div className="flex items-center justify-center p-3 rounded-xl bg-white/90 border border-gray-300 relative">
                <button
                  type="button"
                  onClick={handlePreviousEmoji}
                  className="absolute left-2 text-gray-600 hover:text-blue-500 transition-colors z-10 p-1 rounded-full bg-white/50"
                  aria-label="Previous emoji"
                >
                  <ChevronLeftIcon />
                </button>
                <span
                  className="text-5xl transition-transform duration-300 transform scale-100 hover:scale-110 cursor-pointer"
                  onClick={() => setShowEmojiPicker(true)}
                >
                  {formData.emoji}
                </span>
                <button
                  type="button"
                  onClick={handleNextEmoji}
                  className="absolute right-2 text-gray-600 hover:text-blue-500 transition-colors z-10 p-1 rounded-full bg-white/50"
                  aria-label="Next emoji"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>

            {showEmojiPicker && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Choose an Emoji
                  </h3>
                  <div className="grid grid-cols-5 gap-3 max-h-72 overflow-y-auto p-2">
                    {EMOJI_OPTIONS.map((emoji, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, emoji }));
                          setCurrentEmojiIndex(index);
                          setShowEmojiPicker(false);
                        }}
                        className={`p-2 text-4xl rounded-xl hover:bg-gray-200 transition-all ${
                          formData.emoji === emoji
                            ? "bg-blue-100 ring-2 ring-blue-500"
                            : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition"
                    aria-label="Close picker"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
            )}

            <label className="block mb-4">
              <span className="text-gray-700 font-medium">Event Title</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="The best meeting ever"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl 
                                    bg-white/90 backdrop-blur-sm shadow-inner focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </label>

            <label className="block mb-4">
              <span className="text-gray-700 font-medium">Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={1}
                disabled={loading}
                placeholder="Details about the event..."
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl 
                                    bg-white/90 backdrop-blur-sm shadow-inner focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
            </label>

            <label className="block mb-4">
              <span className="text-gray-700 font-medium">Start Time</span>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                disabled={loading}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl 
                   bg-white/90 backdrop-blur-sm shadow-inner focus:ring-blue-500 
                   focus:border-blue-500 disabled:opacity-50"
              />
            </label>

            <div className="mb-6">
              <button
                type="button"
                onClick={handleOpenMapPicker}
                disabled={loading}
                className="w-full h-10 flex items-center justify-center gap-2 
                                  bg-blue-500 text-white font-semibold rounded-xl transition 
                                  hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 py-2 text-sm"
              >
                <LocationOnIcon sx={{ fontSize: 18 }} />
                {locationName
                  ? locationName.length > 28
                    ? locationName.slice(0, 28) + "…"
                    : locationName
                  : formData.latitude
                    ? "Location Selected"
                    : "Select Location on Map"}
              </button>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                disabled={loading || !formData.latitude}
                className="flex-1 px-4 py-2 font-semibold rounded-xl transition duration-200 
                                    bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 text-sm"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                disabled={loading}
                className="flex-1 px-4 py-2 font-semibold rounded-xl transition duration-200 
                                    bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
            </div>
            <div className="h-4"></div>
          </form>
        </div>
      </div>

      {openMap && (
        <div className="fixed inset-0 z-[90]">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={handleMapMove}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="bottom-right" />
          </Map>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-50">
            <LocationOnIcon sx={{ fontSize: 40, color: "red" }} />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 z-[95] flex justify-center">
            <div className="w-full max-w-md bg-white/70 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/30">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  disabled={!formData.latitude}
                  className="flex-1 px-4 py-2 font-semibold rounded-xl transition duration-200 
                                        bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 text-sm"
                >
                  Confirm Selection
                </button>
                <button
                  type="button"
                  onClick={() => setOpenMap(false)}
                  className="flex-1 px-4 py-2 font-semibold rounded-xl transition duration-200 
                                        bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
              </div>
              <div className="text-center text-xs text-gray-600 mt-2">
                Current Center: {viewState.latitude.toFixed(4)},{" "}
                {viewState.longitude.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEvent;
