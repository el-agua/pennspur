import type {Event} from '../types/general';
import EventListItem from './EventListItem';


interface EventListProps {
  events: Event[];
  activeEventId: number | null;
  handleEventClick: (event: Event) => void;
  setActiveTab: (tab: string) => void;
}


const EventList = ({events, activeEventId, handleEventClick, setActiveTab}: EventListProps) => {
  return (
    <ul>
      {events.map((event) => (
        <EventListItem 
          key={event.id}
          activeEventId={activeEventId}
          event={event}
          handleEventClick={handleEventClick} 
          setActiveTab={setActiveTab}
        />
      ))}
    </ul>
  )
}

export default EventList;
