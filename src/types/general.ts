export interface Event {
  id: number;
  name: string;
  user: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  requests: EventRequest[];
}

export interface Notification {
  key: number;
  component: React.ReactNode;
}


export interface EventRequest {
  status: 'pending' | 'accepted' | 'rejected';
  user: User;
}


export interface User {
  id: number;
  username: string;
}


