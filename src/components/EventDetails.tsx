import type {Event} from '../types/general';
import supabase from '../services/service';
import {useMemo} from 'react';

interface EventDetailsProps {
  event: Event;
  userId: number;
}

const EventDetails = ({event, userId}: EventDetailsProps) => {

  const eventStatus = useMemo(() => event.requests.find(request => request.user.id === userId)?.status, [event, userId]);
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
      <p className="mb-2">Started {Math.round((new Date().getTime() - event.startTime.getTime()) / (1000 * 60))  } minutes ago</p>
      <div className="rounded-lg bg-blue-100 p-4">
        <p className="mb-2">{event.description}</p>
      </div>
      {
        (eventStatus === 'accepted') ? (
          <p className="mt-4 font-semibold text-green-600">You are attending this event.</p>
        ) : (eventStatus === 'pending') ? (
          <p className="mt-4 font-semibold text-yellow-600">Your request to join is pending.</p>
        ) : (eventStatus === 'rejected') ? (
          <p className="mt-4 font-semibold text-red-600">Your request to join was rejected.</p>
        ) : (
          <button 
            className="mt-4 bg-green-500 text-white rounded-lg p-2 cursor-pointer hover:bg-green-600 hover:scale-105 transition-all"
            onClick={requestToJoinEvent}
          >
            Request to Join Event
          </button>
        )
      }
    </div>
  )
}

export default EventDetails;
