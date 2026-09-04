-- Reference data only. The bikes themselves live in db/seed/*.json, one file per
-- brand, so a brand's spec sheet can be re-imported without touching this file.
MERGE BikeClasses AS target
USING (VALUES (N'Naked'), (N'Sport'), (N'Adventure'), (N'Cruiser'), (N'Scooter')) AS source (Name)
  ON target.Name = source.Name
WHEN NOT MATCHED BY TARGET THEN
  INSERT (Name) VALUES (source.Name);
