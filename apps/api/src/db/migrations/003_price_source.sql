-- Where a price came from is not always where the specs came from: Thai list
-- prices are often taken from a dealer or aggregator page while the spec sheet
-- is the manufacturer's. Keeping both lets the site say which is which.
ALTER TABLE Bikes ADD PriceSourceUrl NVARCHAR(400) NULL;
