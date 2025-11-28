export interface Event {
  id: number;
  name: string;
  user: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  startTime: Date;
  requests: EventRequest[];
  emoji?: string;
  place?: string;
}

export interface Notification {
  key: string;
  component: React.ReactNode;
}


export interface EventRequest {
  status: 'pending' | 'accepted' | 'rejected';
  user: User;
  event_id: number;
}


export interface User {
  id: number;
  username: string;
}


