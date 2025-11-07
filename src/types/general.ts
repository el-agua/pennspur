export interface Event {
  id: number;
  name: string;
  user: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
}


