import { useNavigate } from "react-router";
import type { Event } from "../types/general";
import { useMemo } from "react";


interface EventCardProps {
  event?: Event;
}

export default function EventCard({ event } : EventCardProps) {
  const navigate = useNavigate();


  const formattedTime = useMemo(() => {
    if (!event) return "Unknown Time";
    const date = new Date(event.startTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (date.getHours() >= 12) {
      return `${hours}:${minutes} PM`;
    } else {
      return `${hours}:${minutes} AM`;
    }
  }, [event]);

  

  return (
    event && (
    <div className="
      absolute bottom-26 left-5 right-5
      h-[90px]
      rounded-2xl
      bg-white/70
      backdrop-blur-md
      border border-white/30
      shadow-lg
      px-4 py-3
      flex items-center justify-between
      z-50
    ">
      <div className="flex flex-col">
        <span className="text-base font-semibold text-gray-800">
          {event.name}
        </span>

        <span className="text-xs text-gray-600">
          {event.place? event.place.split(",")[0] :  "Unknown Location"} - {formattedTime}
        </span>

        <span className="text-[10px] text-gray-500 mt-0.5">
          {event.user}
        </span>
      </div>

      <button
        onClick={() => navigate(`/event/${event.id}`)}
        className="
          px-3 py-1.5
          rounded-xl
          bg-blue-500/80
          backdrop-blur-sm
          text-white
          text-xs font-medium
          shadow-md
          transition
          hover:bg-blue-500
        "
      >
        Details
      </button>
    </div>)
  );
}
