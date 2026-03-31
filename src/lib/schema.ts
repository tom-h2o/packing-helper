export interface Category {
  id?: string;
  name: string;
  user_id: string;
}

export interface Tag {
  id?: string;
  name: string;
  type: 'activity' | 'temperature' | 'general';
  user_id: string;
}

export interface Item {
  id?: string;
  name: string;
  category_id: string;
  tags: string[]; // Array of tag IDs
  user_id: string;
}

export interface Trip {
  id?: string;
  name: string;
  date_start: string;
  date_end: string;
  temperature: string; // Tag ID
  activities: string[]; // Array of tag IDs
  user_id: string;
}

export interface TripItem {
  id?: string;
  trip_id: string;
  item_id: string;
  is_packed: boolean;
}
