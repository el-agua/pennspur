import React, { useState, useMemo, useEffect } from "react";
import SwipeNotification from "./SwipeNotification";
import type { EventRequest, Notification } from "../types/general";
import supabase from "../services/service";

interface NotificationControllerProps {
  queue: Array<Notification>;
  setCleared: (cleared: boolean) => void;
}

const NotificationController = ({
  queue,
  setCleared,
}: NotificationControllerProps) => {
  const acceptRequest = async (key: string) => {
    await supabase
      .from("event_requests")
      .update({ status: "accepted" })
      .eq("event_id", key.split("-")[0])
      .eq("user_id", key.split("-")[1]);
    await dismiss(key);
    console.log(`Accepted notification with key: ${key}`);
  };

  const denyRequest = async (key: string) => {
    await supabase
      .from("event_requests")
      .update({ status: "rejected" })
      .eq("event_id", key.split("-")[0])
      .eq("user_id", key.split("-")[1]);
    await dismiss(key);
    console.log(`Denied notification with key: ${key}`);
  };

  const [item, setItem] = useState<Notification | null>(null);
  console.log(queue);

  const [ack, setAck] = useState<string[]>([]);

  const dismiss = async (key: string) => {
    setAck((prev) => [...prev, key]);
  };

  useEffect(() => {
    if (ack.length === queue.length && queue.length > 0) {
      setCleared(true);
    }
  }, [ack, queue, setCleared]);

  useEffect(() => {
    setItem(
      queue.find((item: Notification) => !ack.includes(item.key)) ?? null,
    );
  }, [queue, ack]);

  console.log(item);

  return item ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md">
      <SwipeNotification
        key={item.key}
        onAccept={() => acceptRequest(item.key)}
        onDeny={() => denyRequest(item.key)}
      >
        {item.component}
      </SwipeNotification>
    </div>
  ) : (
    <div></div>
  );
};

export default NotificationController;
