export type EventType = 'limited' | 'unlimited';
export type EventVisibility = 'public' | 'private' | 'invite-only';
export type ActionType = 'add' | 'remove';
export type LocationType = 'none' | 'text' | 'maps';

export interface Event {
	id: string;
	name: string;
	date: string;
	time: string;
	location: string;
	location_type: LocationType;
	location_url?: string;
	type: EventType;
	attendee_limit?: number;
	visibility: EventVisibility;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export interface RSVP {
	id: string;
	event_id: string;
	name: string;
	user_id: string;
	created_at: string;
}

export interface CreateEventData {
	name: string;
	date: string;
	time: string;
	location: string;
	location_type: LocationType;
	location_url?: string;
	type: EventType;
	attendee_limit?: number;
	visibility: EventVisibility;
}

export interface DatabaseEvent {
	id: string;
	name: string;
	date: string;
	time: string;
	location: string;
	location_type: LocationType;
	location_url?: string;
	type: EventType;
	attendee_limit?: number;
	visibility: EventVisibility;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export interface DatabaseRSVP {
	id: string;
	event_id: string;
	name: string;
	user_id: string;
	created_at: string;
}

export interface InviteToken {
	id: string;
	event_id: string;
	token: string;
	expires_at: string;
	created_at: string;
}
