-- The catalogue schema, consolidated.
--
-- The SQL Server migrations this replaces described the same schema arrived at
-- in four steps; replaying that history on a database that has never existed
-- buys nothing, so this is the shape they added up to.
--
-- Identifiers are snake_case because Postgres folds unquoted names to lower
-- case: `BikeId` in a query comes back as `bikeid` regardless, and pretending
-- otherwise means quoting every identifier forever.

CREATE TABLE brands (
  brand_id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         varchar(80) NOT NULL UNIQUE,
  country_code char(2),
  slug         varchar(80) NOT NULL UNIQUE
);

CREATE TABLE bike_classes (
  class_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name     varchar(40) NOT NULL UNIQUE
);

CREATE TABLE bikes (
  bike_id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_id             integer NOT NULL REFERENCES brands(brand_id) ON DELETE CASCADE,
  class_id             integer NOT NULL REFERENCES bike_classes(class_id),
  name                 varchar(120) NOT NULL,
  slug                 varchar(140) NOT NULL UNIQUE,
  model_year           smallint NOT NULL,

  -- A published price is prose as often as it is a number: "THB 69,900 / 79,900"
  -- is two variants. price_text is what gets shown; price_amount is the base
  -- figure parsed out of it, for sorting only.
  price_amount         numeric(12,2),
  price_currency       char(3),
  price_market         varchar(8),
  price_text           varchar(200),
  price_is_approximate boolean NOT NULL DEFAULT false,

  image_url            varchar(400),
  variants             varchar(300),
  notes                varchar(400),
  flags                varchar(400),   -- source caveats worth surfacing
  source_url           varchar(400),
  price_source_url     varchar(400),   -- often a dealer, not the manufacturer
  data_generated_at    date,           -- when the catalogue was compiled
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bike_specs (
  bike_id             integer PRIMARY KEY REFERENCES bikes(bike_id) ON DELETE CASCADE,
  engine              varchar(200),
  displacement_cc     numeric(7,1),
  bore_stroke_mm      varchar(40),
  compression         varchar(20),
  power_hp            numeric(6,1),
  power_kw            numeric(6,1),
  power_rpm           integer,
  torque_nm           numeric(6,1),
  torque_rpm          integer,
  fuel_system         varchar(120),
  transmission        varchar(120),
  clutch              varchar(120),
  final_drive         varchar(40),
  frame               varchar(120),
  front_suspension    varchar(200),
  rear_suspension     varchar(200),
  brake_front         varchar(200),
  brake_rear          varchar(200),
  tyre_front          varchar(60),
  tyre_rear           varchar(60),
  wheelbase_mm        integer,
  seat_height_mm      integer,
  ground_clearance_mm integer,
  kerb_weight_kg      numeric(6,1),
  fuel_tank_l         numeric(5,1),
  fuel_economy        varchar(40),
  battery_kwh         numeric(6,2),
  range_km            integer,
  charging            varchar(200),
  rider_aids          varchar(200),
  display             varchar(80)
);

-- Every market a model is sold in.
CREATE TABLE bike_markets (
  bike_id     integer NOT NULL REFERENCES bikes(bike_id) ON DELETE CASCADE,
  market_code varchar(8) NOT NULL,
  PRIMARY KEY (bike_id, market_code)
);

-- Published prices in other markets, so an import loses nothing.
CREATE TABLE bike_prices (
  bike_id     integer NOT NULL REFERENCES bikes(bike_id) ON DELETE CASCADE,
  market_code varchar(8) NOT NULL,
  currency    char(3),
  amount      numeric(12,2),
  raw_text    varchar(200) NOT NULL,
  PRIMARY KEY (bike_id, market_code)
);

CREATE INDEX ix_bikes_brand ON bikes(brand_id);
CREATE INDEX ix_bikes_class ON bikes(class_id);
CREATE INDEX ix_bikes_price ON bikes(price_amount);
CREATE INDEX ix_bike_specs_displacement ON bike_specs(displacement_cc);
