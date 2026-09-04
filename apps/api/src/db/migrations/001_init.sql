CREATE TABLE Brands (
  BrandId      INT IDENTITY PRIMARY KEY,
  Name         NVARCHAR(80)  NOT NULL UNIQUE,
  CountryCode  CHAR(2)       NOT NULL,
  Slug         NVARCHAR(80)  NOT NULL UNIQUE
);

CREATE TABLE BikeClasses (
  ClassId INT IDENTITY PRIMARY KEY,
  Name    NVARCHAR(40) NOT NULL UNIQUE      -- Naked, Sport, Adventure, Cruiser, Scooter
);

CREATE TABLE Bikes (
  BikeId        INT IDENTITY PRIMARY KEY,
  BrandId       INT NOT NULL REFERENCES Brands(BrandId),
  ClassId       INT NOT NULL REFERENCES BikeClasses(ClassId),
  Name          NVARCHAR(120) NOT NULL,
  Slug          NVARCHAR(140) NOT NULL UNIQUE,
  ModelYear     SMALLINT      NOT NULL,
  PriceUsd      DECIMAL(10,2) NOT NULL,
  ImageUrl      NVARCHAR(400) NULL,
  CreatedAt     DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE BikeSpecs (               -- one row per bike, wide table for fast compare
  BikeId          INT PRIMARY KEY REFERENCES Bikes(BikeId) ON DELETE CASCADE,
  Engine          NVARCHAR(200),
  DisplacementCc  INT,
  PowerHp         DECIMAL(6,1),
  TorqueNm        DECIMAL(6,1),
  Transmission    NVARCHAR(120),
  FrontSuspension NVARCHAR(200),
  RearSuspension  NVARCHAR(200),
  Brakes          NVARCHAR(200),
  Tyres           NVARCHAR(80),
  WheelbaseMm     INT,
  KerbWeightKg    DECIMAL(6,1),
  SeatHeightMm    INT,
  FuelTankL       DECIMAL(5,1),
  RiderAids       NVARCHAR(200),
  Display         NVARCHAR(80)
);

CREATE INDEX IX_Bikes_Brand ON Bikes(BrandId);
CREATE INDEX IX_Bikes_Class ON Bikes(ClassId);
CREATE INDEX IX_Bikes_Price ON Bikes(PriceUsd);
