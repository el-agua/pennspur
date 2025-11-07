import type {Event} from '../types/general';
import {useMemo} from 'react';

interface EventListItemProps {
  activeEventId: number | null;
  event: Event;
  handleEventClick: (event: Event) => void;
  setActiveTab: (tab: string) => void;
}

const EventListItem = ({activeEventId, event, handleEventClick, setActiveTab}: EventListItemProps) => {
  const active = useMemo(() => activeEventId === event.id, [activeEventId, event.id]);
  return (
    <li 
        key={event.id} 
        className={`flex justify-between gap-4 items-center font-display mb-4 border-b p-4 cursor-pointer transition-all hover:bg-gray-100 p-2 rounded ${
          active ? 'bg-blue-100 border-blue-400 opacity-100' : 'opacity-50'
        }`}
        onClick={() => handleEventClick(event)}
    >
      <div id="left-side">
        <h3 className="font-semibold">{event.name}</h3>
        <p className="text-sm">{event.description}</p>
      </div>
      {active &&
        <div id="right-side">
          <button className="bg-blue-400 rounded-lg p-2 text-sm cursor-pointer hover:bg-blue-500 hover:scale-110 transition-all" onClick={() => setActiveTab("event")}>Details</button>
        </div>
      }
    </li>
  )
}

export default EventListItem;
