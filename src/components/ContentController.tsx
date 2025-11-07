import EventList from './EventList';
import EventDetails from './EventDetails';
import type {Event} from '../types/general';
import {useMemo} from 'react';


interface ContentControllerProps {
  activeTab: string;
  events: Event[];
  activeEventId: number | null;
  handleEventClick: (event: Event) => void;
  setActiveTab: (tab: string) => void;
  userId: number;
}

const ContentController = ({activeTab, events, activeEventId, handleEventClick, setActiveTab, userId}: ContentControllerProps) => {
  const activeEvent = useMemo(() => {
    return events.find(event => event.id === activeEventId) || null;
  }, [events, activeEventId]);
  switch (activeTab) {
    case 'event':
      if (!activeEvent) {
        return <div>No event selected.</div>;
      }
      return <EventDetails event={activeEvent} setActiveTab={setActiveTab} userId={userId}/>;
    case 'events':
      return <EventList activeEventId={activeEventId} events={events} handleEventClick={handleEventClick} setActiveTab={setActiveTab}/>; 
    case 'profile':
      return <div>User Profile Content</div>;
    default:
      return <div>Default Content</div>;
  }
}

export default ContentController;
