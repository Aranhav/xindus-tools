export interface TrackingEvent {
  date: string;
  time: string;
  office: string;
  event: string;
}

export interface TrackingResult {
  tracking_id: string;
  status: string;
  expected_delivery?: string;
  origin?: string;
  destination?: string;
  booked_on?: string;
  weight?: string;
  events: TrackingEvent[];
  error?: string;
}

export interface BulkTrackingRequest {
  tracking_ids: string[];
}

export interface BulkTrackingResponse {
  results: TrackingResult[];
}

export type TrackingStatus =
  | "Delivered"
  | "In Transit"
  | "Out for Delivery"
  | "Booked"
  | "Item Bagged"
  | "Returned"
  | "Unknown";
