import type {Event} from '../types/general';
import supabase from '../services/service';

interface EventDetailsProps {
  event: Event;
  setActiveTab: (tab: string) => void;
  userId: number;
}


const EventDetails = ({event, setActiveTab, userId}: EventDetailsProps) => {
  const requestToJoinEvent = async () => {
    const { data, error } = await supabase
      .from('event_requests')
      .insert([
        {
          event_id: event.id,
          user_id: userId,
          status: 'pending'
        }
      ]);

    if (error) {
      console.error('Error creating join request:', error);
      return null;
    }

    console.log('Join request created:', data);
    alert('Join request sent!');
    return data;
  } 
  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-xl font-display font-semibold mb-2">Host: {event.user}</h2>
        <button className="bg-blue-400 rounded-lg p-2 text-sm cursor-pointer hover:bg-blue-500 hover:scale-110 transition-all" onClick={() => setActiveTab("events")}>Close</button>
      </div>
      <h2 className="text-xl font-display mb-4">{event.name}</h2>
      <p className="mb-2">Time Remaining: 2 hours</p>
      <div className="rounded-lg bg-blue-100 p-4">
        <p className="mb-2">{event.description}</p>
      </div>

      <button 
        className="bg-green-100 rounded-lg p-2 mt-2 cursor-pointer text-sm hover:bg-green-300 hover:scale-110 transition-all"
        onClick={requestToJoinEvent}
      >
        Join Event
      </button>
    </div>
  )
}

export default EventDetails;
