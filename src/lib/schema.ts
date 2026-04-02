export interface Tag {
  id?: string;
  name: string;
  type: 'activity' | 'temperature' | 'category';
  user_id: string;
}

export interface Item {
  id?: string;
  name: string;
  tags: string[];
  quantity_relevant?: boolean;
  default_quantity?: number;
  order?: number;
  user_id: string;
}

export interface Trip {
  id?: string;
  name: string;
  country?: string;
  description?: string;
  date_start: string;
  date_end: string;
  temperature: string;
  activities: string[];
  user_id: string;
}

export interface TripItem {
  id?: string;
  trip_id: string;
  item_id: string;
  is_packed: boolean;
  quantity?: number;
}
