-- Reference data only. The bikes themselves live in db/seed/*.json, one file per
-- brand per market, so a catalogue can be re-imported without touching this.
INSERT INTO bike_classes (name)
VALUES ('Naked'), ('Sport'), ('Adventure'), ('Cruiser'), ('Scooter')
ON CONFLICT (name) DO NOTHING;
