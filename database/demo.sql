-- =============================================================================
-- ArcadiaDimension — demo data
--
-- Run AFTER database/schema.sql. Re-running it resets the demo warehouses.
--
--   Email:      demo@arcadiadimension.app
--   Contraseña: demo1234
-- =============================================================================

begin;

-- Demo account (password: demo1234, bcrypt cost 10)
insert into users (id, email, name, password_hash)
values (
  'de300000-0000-4000-8000-000000000001',
  'demo@arcadiadimension.app',
  'Usuario Demo',
  '$2b$10$kr0KvgvZauEGYOIFo0yMoeRAvzGO673nTFhR9jGbVl6NlEyAp1svu'
)
on conflict ((lower(email))) do update
  set name = excluded.name,
      password_hash = excluded.password_hash;

-- Start from a clean state (cascades to elements, locations and contents)
delete from warehouses
where id in ('de300000-0000-4000-8000-000000000002', 'de300000-0000-4000-8000-000000000003');

insert into warehouses (id, owner_id, name, description, width, height, layout_version, created_at, updated_at)
select v.id::uuid, u.id, v.name, v.description, v.width, v.height, 1, v.updated_at, v.updated_at
from users u
cross join (values
  ('de300000-0000-4000-8000-000000000002', 'Almacén Demo Valencia',
   'Centro logístico regional con recepción, control de calidad, picking y expediciones.',
   120, 80, now()),
  ('de300000-0000-4000-8000-000000000003', 'Nave Sagunto',
   'Nave auxiliar de reposición para el área de Valencia.',
   60, 40, now() - interval '2 days')
) as v(id, name, description, width, height, updated_at)
where lower(u.email) = 'demo@arcadiadimension.app';

-- -----------------------------------------------------------------------------
-- Almacén Demo Valencia (120 × 80 m). Docks sit on the top façade (y = 0).
-- -----------------------------------------------------------------------------
insert into warehouse_elements
  (id, warehouse_id, type, name, x, y, width, height, rotation, color, properties, sort_order)
values
  ('de300000-0000-4000-8000-000000000101', 'de300000-0000-4000-8000-000000000002', 'zone', 'Recepción',           4,    6,   34,   16,   0,  null, '{"category": "reception"}',  0),
  ('de300000-0000-4000-8000-000000000102', 'de300000-0000-4000-8000-000000000002', 'zone', 'Control de calidad',  42,   6,   18,   16,   0,  null, '{"category": "quality"}',    1),
  ('de300000-0000-4000-8000-000000000103', 'de300000-0000-4000-8000-000000000002', 'zone', 'Expediciones',        82,   6,   34,   16,   0,  null, '{"category": "shipping"}',   2),
  ('de300000-0000-4000-8000-000000000104', 'de300000-0000-4000-8000-000000000002', 'zone', 'Almacenaje',          38,   27,  80,   44,   0,  null, '{"category": "storage"}',    3),
  ('de300000-0000-4000-8000-000000000105', 'de300000-0000-4000-8000-000000000002', 'zone', 'Picking',             4,    58,  30,   18,   0,  null, '{"category": "picking"}',    4),

  ('de300000-0000-4000-8000-000000000106', 'de300000-0000-4000-8000-000000000002', 'dock', 'Muelle 1',            10,   0,   4,    3,    0,  null, '{"direction": "inbound"}',   5),
  ('de300000-0000-4000-8000-000000000107', 'de300000-0000-4000-8000-000000000002', 'dock', 'Muelle 2',            17,   0,   4,    3,    0,  null, '{"direction": "inbound"}',   6),
  ('de300000-0000-4000-8000-000000000108', 'de300000-0000-4000-8000-000000000002', 'dock', 'Muelle 3',            24,   0,   4,    3,    0,  null, '{"direction": "inbound"}',   7),
  ('de300000-0000-4000-8000-000000000109', 'de300000-0000-4000-8000-000000000002', 'dock', 'Muelle 4',            88,   0,   4,    3,    0,  null, '{"direction": "outbound"}',  8),
  ('de300000-0000-4000-8000-00000000010a', 'de300000-0000-4000-8000-000000000002', 'dock', 'Muelle 5',            95,   0,   4,    3,    0,  null, '{"direction": "outbound"}',  9),
  ('de300000-0000-4000-8000-00000000010b', 'de300000-0000-4000-8000-000000000002', 'dock', 'Muelle 6',            102,  0,   4,    3,    0,  null, '{"direction": "outbound"}',  10),

  ('de300000-0000-4000-8000-00000000010c', 'de300000-0000-4000-8000-000000000002', 'door', 'Puerta peatonal',     0.4,  36,  3,    0.4,  90, null, '{"kind": "personnel"}',      11),
  ('de300000-0000-4000-8000-00000000010d', 'de300000-0000-4000-8000-000000000002', 'door', 'Salida de emergencia', 58,  79.6, 3,   0.4,  0,  null, '{"kind": "emergency"}',      12),
  ('de300000-0000-4000-8000-00000000010e', 'de300000-0000-4000-8000-000000000002', 'door', 'Puerta seccional',    120,  40,  4,    0.4,  90, null, '{"kind": "sectional"}',      13),

  ('de300000-0000-4000-8000-00000000010f', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 1',       39.2, 39.4, 0.6, 0.6,  0,  null, '{"kind": "column"}',         14),
  ('de300000-0000-4000-8000-000000000110', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 2',       39.2, 52.4, 0.6, 0.6,  0,  null, '{"kind": "column"}',         15),
  ('de300000-0000-4000-8000-000000000111', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 3',       39.2, 65.4, 0.6, 0.6,  0,  null, '{"kind": "column"}',         16),
  ('de300000-0000-4000-8000-000000000112', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 4',       76.9, 39.4, 0.6, 0.6,  0,  null, '{"kind": "column"}',         17),
  ('de300000-0000-4000-8000-000000000113', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 5',       76.9, 52.4, 0.6, 0.6,  0,  null, '{"kind": "column"}',         18),
  ('de300000-0000-4000-8000-000000000114', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 6',       76.9, 65.4, 0.6, 0.6,  0,  null, '{"kind": "column"}',         19),
  ('de300000-0000-4000-8000-000000000115', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 7',       114.4, 39.4, 0.6, 0.6, 0,  null, '{"kind": "column"}',         20),
  ('de300000-0000-4000-8000-000000000116', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 8',       114.4, 52.4, 0.6, 0.6, 0,  null, '{"kind": "column"}',         21),
  ('de300000-0000-4000-8000-000000000117', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Columna 9',       114.4, 65.4, 0.6, 0.6, 0,  null, '{"kind": "column"}',         22),
  ('de300000-0000-4000-8000-000000000118', 'de300000-0000-4000-8000-000000000002', 'obstacle', 'Envolvedora',     64,   11,  6,    5,    0,  null, '{"kind": "machine"}',        23),

  ('de300000-0000-4000-8000-000000000119', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack A',              42,   32,  32.4, 2.4,  0,  null, '{"code": "A", "rows": 4, "columns": 12}', 24),
  ('de300000-0000-4000-8000-00000000011a', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack B',              80,   32,  32.4, 2.4,  0,  null, '{"code": "B", "rows": 4, "columns": 12}', 25),
  ('de300000-0000-4000-8000-00000000011b', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack C',              42,   45,  32.4, 2.4,  0,  null, '{"code": "C", "rows": 4, "columns": 12}', 26),
  ('de300000-0000-4000-8000-00000000011c', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack D',              80,   45,  32.4, 2.4,  0,  null, '{"code": "D", "rows": 4, "columns": 12}', 27),
  ('de300000-0000-4000-8000-00000000011d', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack E',              42,   58,  32.4, 2.4,  0,  null, '{"code": "E", "rows": 4, "columns": 12}', 28),
  ('de300000-0000-4000-8000-00000000011e', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack F',              80,   58,  32.4, 2.4,  0,  null, '{"code": "F", "rows": 4, "columns": 12}', 29),
  ('de300000-0000-4000-8000-00000000011f', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack G',              16,   30,  21,   2.4,  90, null, '{"code": "G", "rows": 3, "columns": 7}',  30),
  ('de300000-0000-4000-8000-000000000120', 'de300000-0000-4000-8000-000000000002', 'rack', 'Rack H',              26,   30,  21,   2.4,  90, null, '{"code": "H", "rows": 3, "columns": 7}',  31);

-- -----------------------------------------------------------------------------
-- Nave Sagunto (60 × 40 m)
-- -----------------------------------------------------------------------------
insert into warehouse_elements
  (id, warehouse_id, type, name, x, y, width, height, rotation, color, properties, sort_order)
values
  ('de300000-0000-4000-8000-000000000201', 'de300000-0000-4000-8000-000000000003', 'zone', 'Recepción',           2,    5,   18,   11,   0,  null, '{"category": "reception"}',  0),
  ('de300000-0000-4000-8000-000000000202', 'de300000-0000-4000-8000-000000000003', 'zone', 'Expediciones',        40,   5,   18,   11,   0,  null, '{"category": "shipping"}',   1),
  ('de300000-0000-4000-8000-000000000203', 'de300000-0000-4000-8000-000000000003', 'dock', 'Muelle 1',            7,    0,   4,    3,    0,  null, '{"direction": "inbound"}',   2),
  ('de300000-0000-4000-8000-000000000204', 'de300000-0000-4000-8000-000000000003', 'dock', 'Muelle 2',            47,   0,   4,    3,    0,  null, '{"direction": "outbound"}',  3),
  ('de300000-0000-4000-8000-000000000205', 'de300000-0000-4000-8000-000000000003', 'door', 'Salida de emergencia', 28,  39.6, 3,   0.4,  0,  null, '{"kind": "emergency"}',      4),
  ('de300000-0000-4000-8000-000000000206', 'de300000-0000-4000-8000-000000000003', 'obstacle', 'Columna 1',       33.2, 26.2, 0.6, 0.6,  0,  null, '{"kind": "column"}',         5),
  ('de300000-0000-4000-8000-000000000207', 'de300000-0000-4000-8000-000000000003', 'rack', 'Rack A',              6,    21,  24,   2.4,  0,  null, '{"code": "A", "rows": 3, "columns": 8}',  6),
  ('de300000-0000-4000-8000-000000000208', 'de300000-0000-4000-8000-000000000003', 'rack', 'Rack B',              6,    30,  24,   2.4,  0,  null, '{"code": "B", "rows": 3, "columns": 8}',  7),
  ('de300000-0000-4000-8000-000000000209', 'de300000-0000-4000-8000-000000000003', 'rack', 'Rack C',              36,   21,  18,   2.4,  0,  null, '{"code": "C", "rows": 3, "columns": 6}',  8);

-- -----------------------------------------------------------------------------
-- Rack locations: one row per rows × columns position
-- -----------------------------------------------------------------------------
insert into rack_locations (element_id, row_number, column_number, code)
select e.id, r.n, c.n,
       (e.properties->>'code') || '-' || lpad(r.n::text, 2, '0') || '-' || lpad(c.n::text, 2, '0')
from warehouse_elements e
cross join lateral generate_series(1, (e.properties->>'rows')::int) as r(n)
cross join lateral generate_series(1, (e.properties->>'columns')::int) as c(n)
where e.type = 'rack'
  and e.warehouse_id in ('de300000-0000-4000-8000-000000000002', 'de300000-0000-4000-8000-000000000003');

-- Well-known articles, handy for trying the search (e.g. ART-00125)
insert into location_contents (location_id, article_code, description, quantity, lot)
select l.id, v.article_code, v.description, v.quantity, v.lot
from (values
  ('de300000-0000-4000-8000-000000000002', 'A-01-03', 'ART-00125', 'Tornillo M8',         340,  'L260914'),
  ('de300000-0000-4000-8000-000000000002', 'C-02-01', 'ART-00125', 'Tornillo M8',         120,  'L260915'),
  ('de300000-0000-4000-8000-000000000002', 'D-02-07', 'ART-00340', 'Arandela DIN 125 M8', 1500, 'L260820'),
  ('de300000-0000-4000-8000-000000000002', 'G-01-04', 'ART-00340', 'Arandela DIN 125 M8', 800,  'L260821'),
  ('de300000-0000-4000-8000-000000000002', 'H-03-02', 'ART-00718', 'Tuerca hexagonal M8', 950,  null),
  ('de300000-0000-4000-8000-000000000003', 'B-02-05', 'ART-00125', 'Tornillo M8',         60,   'L260930')
) as v(warehouse_id, code, article_code, description, quantity, lot)
join warehouse_elements e on e.warehouse_id = v.warehouse_id::uuid and e.type = 'rack'
join rack_locations l on l.element_id = e.id and l.code = v.code;

-- Deterministic pseudo-random stock so each rack shows a different occupancy level
insert into location_contents (location_id, article_code, description, quantity, lot)
select l.id,
       'ART-' || (10000 + seed.article)::text,
       (array[
         'Tornillo hexagonal M10', 'Tuerca autoblocante M8', 'Arandela plana 12 mm', 'Rodamiento 6204-2RS',
         'Correa dentada HTD 5M', 'Filtro de aire industrial', 'Válvula de bola 1/2"', 'Cable H07V-K 2,5 mm²',
         'Palé europeo 1200×800', 'Film estirable 23 µm', 'Caja cartón doble canal', 'Guantes de nitrilo T9',
         'Brida inoxidable DN50', 'Sensor inductivo M18', 'Motor trifásico 1,5 kW', 'Pintura epoxi gris 5 L'
       ])[1 + seed.article % 16],
       10 + seed.quantity % 490,
       case when seed.lot % 4 = 0 then null else 'L26' || lpad((seed.lot % 10000)::text, 4, '0') end
from rack_locations l
join warehouse_elements e on e.id = l.element_id
join (values
  ('de300000-0000-4000-8000-000000000002', 'A', 92),
  ('de300000-0000-4000-8000-000000000002', 'B', 70),
  ('de300000-0000-4000-8000-000000000002', 'C', 40),
  ('de300000-0000-4000-8000-000000000002', 'D', 86),
  ('de300000-0000-4000-8000-000000000002', 'E', 18),
  ('de300000-0000-4000-8000-000000000002', 'F', 0),
  ('de300000-0000-4000-8000-000000000002', 'G', 62),
  ('de300000-0000-4000-8000-000000000002', 'H', 30),
  ('de300000-0000-4000-8000-000000000003', 'A', 55),
  ('de300000-0000-4000-8000-000000000003', 'B', 88),
  ('de300000-0000-4000-8000-000000000003', 'C', 20)
) as t(warehouse_id, rack_code, percent)
  on t.warehouse_id::uuid = e.warehouse_id and t.rack_code = e.properties->>'code'
cross join lateral (
  select abs(hashtext(l.code || e.warehouse_id::text || ':article')::bigint) % 600 as article,
         abs(hashtext(l.code || e.warehouse_id::text || ':quantity')::bigint)     as quantity,
         abs(hashtext(l.code || e.warehouse_id::text || ':lot')::bigint)          as lot,
         abs(hashtext(l.code || e.warehouse_id::text || ':fill')::bigint) % 100   as fill
) as seed
where seed.fill < t.percent
on conflict (location_id) do nothing;

commit;
