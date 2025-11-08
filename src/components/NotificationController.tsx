import React, {useState} from 'react';
import type {Notification} from '../types/general';
import {useMemo} from 'react';

interface NotificationControllerProps {
  queue: Array<Notification>;
}
const NotificationController = ({queue}: NotificationControllerProps) => {
  const [ack, setAck] = useState<Array<number>>([]);

  const handleDismiss = (key: number) => {
    setAck((prevAck) => [...prevAck, key]);

  };

  const topNotificationIndex = useMemo(() => {
    console.log('Calculating topNotificationIndex with queue:', queue, 'and ack:', ack);
    return queue.findIndex((notification) => !ack.includes(notification.key))
  }, [queue, ack]);

  if (topNotificationIndex === -1) {
    return <></>; // No notifications to show
  }
  return (
    <div className="absolute top-2 left-2 rounded-lg z-100 bg-white p-4 w-3/4 shadow-lg">
      {topNotificationIndex >= 0 ? queue[topNotificationIndex].component : <></>}
      <div className="mt-4">
        <button 
          className="bg-red-300 text-sm rounded-lg p-2 hover:scale-110 transition-all"
          onClick={() => handleDismiss(queue[topNotificationIndex].key)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
export default NotificationController;

