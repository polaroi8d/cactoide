import {
	pgTable,
	varchar,
	integer,
	date,
	time,
	timestamp,
	uuid,
	pgEnum,
	index,
	uniqueIndex,
	check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// --- Enums (matching the SQL CHECK constraints)
export const eventTypeEnum = pgEnum('event_type', ['limited', 'unlimited']);
export const visibilityEnum = pgEnum('visibility', ['public', 'private', 'invite-only']);
export const locationTypeEnum = pgEnum('location_type', ['none', 'text', 'maps']);

// --- Events table
export const events = pgTable(
	'events',
	{
		id: varchar('id', { length: 8 }).primaryKey(),
		name: varchar('name', { length: 100 }).notNull(),
		date: date('date', { mode: 'string' }).notNull(), // ISO 'YYYY-MM-DD'
		time: time('time', { withTimezone: false }).notNull(), // 'HH:MM:SS'
		location: varchar('location', { length: 200 }).notNull(),
		locationType: locationTypeEnum('location_type').notNull().default('none'),
		locationUrl: varchar('location_url', { length: 500 }),
		type: eventTypeEnum('type').notNull(),
		attendeeLimit: integer('attendee_limit'), // nullable in SQL
		userId: varchar('user_id', { length: 100 }).notNull(),
		visibility: visibilityEnum('visibility').notNull().default('public'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
	},
	(t) => ({
		// Primary key already indexes id
		idxEventsId: index('idx_events_id').on(t.id),
		idxEventsUserId: index('idx_events_user_id').on(t.userId),
		idxEventsVisibility: index('idx_events_visibility').on(t.visibility),
		// CHECK (attendee_limit > 0) like in SQL (still allows NULL)
		attendeeLimitPositive: check(
			'events_attendee_limit_positive',
			sql`${t.attendeeLimit} IS NULL OR ${t.attendeeLimit} > 0`
		)
	})
);

// --- RSVPs table
export const rsvps = pgTable(
	'rsvps',
	{
		id: uuid('id').defaultRandom().primaryKey(), // gen_random_uuid()
		eventId: varchar('event_id', { length: 8 })
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 50 }).notNull(),
		userId: varchar('user_id', { length: 100 }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(t) => ({
		idxRsvpsEventId: index('idx_rsvps_event_id').on(t.eventId),
		idxRsvpsUserId: index('idx_rsvps_user_id').on(t.userId),
		idxRsvpsCreatedAt: index('idx_rsvps_created_at').on(t.createdAt),
		// UNIQUE(event_id, name) constraint
		uqEventName: uniqueIndex('rsvps_event_id_name_unique').on(t.eventId, t.name)
	})
);

// --- Invite Tokens table
export const inviteTokens = pgTable(
	'invite_tokens',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		eventId: varchar('event_id', { length: 8 })
			.notNull()
			.references(() => events.id, { onDelete: 'cascade' }),
		token: varchar('token', { length: 32 }).notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
	},
	(t) => ({
		idxInviteTokensEventId: index('idx_invite_tokens_event_id').on(t.eventId),
		idxInviteTokensToken: index('idx_invite_tokens_token').on(t.token),
		idxInviteTokensExpiresAt: index('idx_invite_tokens_expires_at').on(t.expiresAt)
	})
);

// --- Relations (optional but handy for type safety)
import { relations } from 'drizzle-orm';

export const eventsRelations = relations(events, ({ many }) => ({
	rsvps: many(rsvps),
	inviteTokens: many(inviteTokens)
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
	event: one(events, {
		fields: [rsvps.eventId],
		references: [events.id]
	})
}));

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
	event: one(events, {
		fields: [inviteTokens.eventId],
		references: [events.id]
	})
}));

// --- Inferred types for use in the application
export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;
export type Rsvp = InferSelectModel<typeof rsvps>;
export type NewRsvp = InferInsertModel<typeof rsvps>;
export type InviteToken = InferSelectModel<typeof inviteTokens>;
export type NewInviteToken = InferInsertModel<typeof inviteTokens>;

// --- Additional utility types
export type EventWithRsvps = Event & {
	rsvps: Rsvp[];
};

export type EventWithInviteTokens = Event & {
	inviteTokens: InviteToken[];
};

export type CreateEventData = Omit<NewEvent, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateRsvpData = Omit<NewRsvp, 'id' | 'createdAt'>;
export type CreateInviteTokenData = Omit<NewInviteToken, 'id' | 'createdAt'>;
