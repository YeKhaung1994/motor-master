-- Reshapes the catalogue for real manufacturer data imported per market.
--
-- Three things the original schema could not hold:
--   1. Prices that are neither USD nor a single clean number. Real list prices
--      arrive as "THB 69,900 / 79,900" or "THB ~249,000 (SP)" — a range, a
--      variant split, or an approximation. We keep the raw text for display and
--      a parsed lowest figure for sorting and filtering.
--   2. A model sold in several markets, each with its own published price.
--   3. Separate front/rear brakes and tyres, plus the drivetrain, chassis and
--      electric-drivetrain fields a manufacturer sheet actually carries.

-- ---------------------------------------------------------------- Brands
-- Country of the manufacturer is not always known for an imported catalogue.
ALTER TABLE Brands ALTER COLUMN CountryCode CHAR(2) NULL;
GO

-- ---------------------------------------------------------------- Bikes
ALTER TABLE Bikes ADD
  PriceAmount        DECIMAL(12,2) NULL,   -- lowest figure parsed from PriceText
  PriceCurrency      CHAR(3)       NULL,
  PriceMarket        NVARCHAR(8)   NULL,   -- market the price belongs to, e.g. TH
  PriceText          NVARCHAR(200) NULL,   -- the source string, shown verbatim
  PriceIsApproximate BIT           NOT NULL CONSTRAINT DF_Bikes_PriceApprox DEFAULT 0,
  Variants           NVARCHAR(300) NULL,
  Notes              NVARCHAR(400) NULL,
  Flags              NVARCHAR(400) NULL,   -- source caveats worth surfacing
  SourceUrl          NVARCHAR(400) NULL;
GO

-- Carry the seeded USD prices over before the old column goes.
UPDATE Bikes
   SET PriceAmount = PriceUsd,
       PriceCurrency = 'USD',
       PriceMarket = 'US'
 WHERE PriceUsd IS NOT NULL;
GO

DROP INDEX IX_Bikes_Price ON Bikes;
ALTER TABLE Bikes DROP COLUMN PriceUsd;
CREATE INDEX IX_Bikes_Price ON Bikes(PriceAmount);
GO

-- Every market a model is sold in.
CREATE TABLE BikeMarkets (
  BikeId     INT         NOT NULL REFERENCES Bikes(BikeId) ON DELETE CASCADE,
  MarketCode NVARCHAR(8) NOT NULL,
  CONSTRAINT PK_BikeMarkets PRIMARY KEY (BikeId, MarketCode)
);

-- Published prices in other markets, kept so an import loses nothing.
CREATE TABLE BikePrices (
  BikeId     INT           NOT NULL REFERENCES Bikes(BikeId) ON DELETE CASCADE,
  MarketCode NVARCHAR(8)   NOT NULL,
  Currency   CHAR(3)       NULL,
  Amount     DECIMAL(12,2) NULL,
  RawText    NVARCHAR(200) NOT NULL,
  CONSTRAINT PK_BikePrices PRIMARY KEY (BikeId, MarketCode)
);
GO

-- ---------------------------------------------------------------- BikeSpecs
-- Displacement is fractional on small engines (124.9 cc), so INT will not do.
ALTER TABLE BikeSpecs ALTER COLUMN DisplacementCc DECIMAL(7,1) NULL;
GO

-- Front and rear are separate figures on a real spec sheet.
ALTER TABLE BikeSpecs DROP COLUMN Brakes, Tyres;
GO

ALTER TABLE BikeSpecs ADD
  BoreStrokeMm      NVARCHAR(40)  NULL,
  Compression       NVARCHAR(20)  NULL,
  PowerKw           DECIMAL(6,1)  NULL,
  PowerRpm          INT           NULL,
  TorqueRpm         INT           NULL,
  FuelSystem        NVARCHAR(120) NULL,
  Clutch            NVARCHAR(120) NULL,
  FinalDrive        NVARCHAR(40)  NULL,
  Frame             NVARCHAR(120) NULL,
  BrakeFront        NVARCHAR(200) NULL,
  BrakeRear         NVARCHAR(200) NULL,
  TyreFront         NVARCHAR(60)  NULL,
  TyreRear          NVARCHAR(60)  NULL,
  GroundClearanceMm INT           NULL,
  FuelEconomy       NVARCHAR(40)  NULL,   -- WMTC or claimed, e.g. "15.7 km/l"
  BatteryKwh        DECIMAL(6,2)  NULL,
  RangeKm           INT           NULL,
  Charging          NVARCHAR(200) NULL;
GO

CREATE INDEX IX_BikeSpecs_Displacement ON BikeSpecs(DisplacementCc);
