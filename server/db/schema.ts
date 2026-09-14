/**
 * Drizzle mapping of database/schema.sql (the SQL file is the source of truth).
 */
import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import type { ElementType } from '../../shared/elements.js'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 254 }).notNull(),
  name: varchar('name', { length: 80 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  ...timestamps,
})

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 80 }).notNull(),
  description: varchar('description', { length: 500 }),
  width: doublePrecision('width').notNull(),
  height: doublePrecision('height').notNull(),
  layoutVersion: integer('layout_version').notNull().default(0),
  ...timestamps,
})

export const warehouseElements = pgTable('warehouse_elements', {
  id: uuid('id').primaryKey(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 16 }).$type<ElementType>().notNull(),
  name: varchar('name', { length: 80 }).notNull(),
  x: doublePrecision('x').notNull(),
  y: doublePrecision('y').notNull(),
  width: doublePrecision('width').notNull(),
  height: doublePrecision('height').notNull(),
  rotation: doublePrecision('rotation').notNull().default(0),
  color: varchar('color', { length: 7 }),
  properties: jsonb('properties').$type<Record<string, unknown>>().notNull().default({}),
  sortOrder: integer('sort_order').notNull().default(0),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
})

export const rackLocations = pgTable(
  'rack_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    elementId: uuid('element_id')
      .notNull()
      .references(() => warehouseElements.id, { onDelete: 'cascade' }),
    rowNumber: smallint('row_number').notNull(),
    columnNumber: smallint('column_number').notNull(),
    code: varchar('code', { length: 24 }).notNull(),
    ...timestamps,
  },
  (table) => [unique('rack_locations_position_key').on(table.elementId, table.rowNumber, table.columnNumber)],
)

export const locationContents = pgTable('location_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id')
    .notNull()
    .unique('location_contents_location_key')
    .references(() => rackLocations.id, { onDelete: 'cascade' }),
  articleCode: varchar('article_code', { length: 40 }).notNull(),
  description: varchar('description', { length: 160 }),
  quantity: integer('quantity').notNull(),
  lot: varchar('lot', { length: 40 }),
  ...timestamps,
})

export type UserRow = typeof users.$inferSelect
export type WarehouseRow = typeof warehouses.$inferSelect
export type WarehouseElementRow = typeof warehouseElements.$inferSelect
export type LocationContentRow = typeof locationContents.$inferSelect
