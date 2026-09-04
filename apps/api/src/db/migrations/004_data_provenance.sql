-- Every catalogue file states when it was compiled, but nothing carried that
-- date into the database, so no figure on the site could say how old it was.
-- Roughly half the models also arrive with a caveat in `flags` ("power/torque
-- are engine-family values pending Thai spec sheet") — the site needs to be able
-- to show that where the comparison is actually made, not only on a detail page.
ALTER TABLE Bikes ADD DataGeneratedAt DATE NULL;
