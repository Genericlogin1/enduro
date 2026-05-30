CREATE TABLE IF NOT EXISTS bike_brands (
    id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT    NOT NULL UNIQUE,
    country TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS bike_models (
    id         UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id   UUID     NOT NULL REFERENCES bike_brands(id) ON DELETE CASCADE,
    model      TEXT     NOT NULL,
    bike_type  TEXT     NOT NULL DEFAULT 'enduro', -- enduro, cross, trial, adventure, dual-sport
    engine_cc  SMALLINT NOT NULL DEFAULT 0,
    year_from  SMALLINT NOT NULL DEFAULT 0,
    year_to    SMALLINT NOT NULL DEFAULT 0,
    UNIQUE(brand_id, model, engine_cc)
);

CREATE INDEX IF NOT EXISTS idx_bike_models_brand ON bike_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_bike_models_type  ON bike_models(bike_type);

-- Seed: major enduro brands and popular models
INSERT INTO bike_brands (name, country) VALUES
  ('KTM',       'Austria'),
  ('Husqvarna', 'Sweden'),
  ('Beta',      'Italy'),
  ('Honda',     'Japan'),
  ('Yamaha',    'Japan'),
  ('Kawasaki',  'Japan'),
  ('Suzuki',    'Japan'),
  ('Gas Gas',   'Spain'),
  ('Sherco',    'France'),
  ('TM Racing', 'Italy'),
  ('Fantic',    'Italy'),
  ('GASGAS',    'Spain'),
  ('Rieju',     'Spain')
ON CONFLICT (name) DO NOTHING;

-- KTM models
INSERT INTO bike_models (brand_id, model, bike_type, engine_cc, year_from, year_to)
SELECT b.id, m.model, m.bike_type, m.engine_cc, m.year_from, m.year_to
FROM bike_brands b,
(VALUES
  ('EXC 125', 'enduro', 125, 2015, 0),
  ('EXC 150', 'enduro', 150, 2017, 0),
  ('EXC 250', 'enduro', 250, 2010, 0),
  ('EXC 300', 'enduro', 300, 2010, 0),
  ('EXC-F 250', 'enduro', 250, 2012, 0),
  ('EXC-F 350', 'enduro', 350, 2012, 0),
  ('EXC-F 450', 'enduro', 450, 2012, 0),
  ('EXC-F 500', 'enduro', 500, 2012, 0),
  ('SX 125', 'cross', 125, 2010, 0),
  ('SX 250', 'cross', 250, 2010, 0),
  ('SX-F 250', 'cross', 250, 2010, 0),
  ('SX-F 350', 'cross', 350, 2011, 0),
  ('SX-F 450', 'cross', 450, 2010, 0),
  ('Freeride 250R', 'enduro', 250, 2014, 0),
  ('Freeride 350', 'enduro', 350, 2012, 0)
) AS m(model, bike_type, engine_cc, year_from, year_to)
WHERE b.name = 'KTM'
ON CONFLICT DO NOTHING;

-- Husqvarna
INSERT INTO bike_models (brand_id, model, bike_type, engine_cc, year_from, year_to)
SELECT b.id, m.model, m.bike_type, m.engine_cc, m.year_from, m.year_to
FROM bike_brands b,
(VALUES
  ('TE 150', 'enduro', 150, 2017, 0),
  ('TE 250', 'enduro', 250, 2014, 0),
  ('TE 300', 'enduro', 300, 2014, 0),
  ('FE 250', 'enduro', 250, 2014, 0),
  ('FE 350', 'enduro', 350, 2014, 0),
  ('FE 450', 'enduro', 450, 2014, 0),
  ('FE 501', 'enduro', 501, 2014, 0),
  ('TC 125', 'cross', 125, 2014, 0),
  ('TC 250', 'cross', 250, 2014, 0),
  ('FC 250', 'cross', 250, 2014, 0),
  ('FC 350', 'cross', 350, 2014, 0),
  ('FC 450', 'cross', 450, 2014, 0)
) AS m(model, bike_type, engine_cc, year_from, year_to)
WHERE b.name = 'Husqvarna'
ON CONFLICT DO NOTHING;

-- Beta
INSERT INTO bike_models (brand_id, model, bike_type, engine_cc, year_from, year_to)
SELECT b.id, m.model, m.bike_type, m.engine_cc, m.year_from, m.year_to
FROM bike_brands b,
(VALUES
  ('RR 125', 'enduro', 125, 2013, 0),
  ('RR 200', 'enduro', 200, 2018, 0),
  ('RR 250', 'enduro', 250, 2013, 0),
  ('RR 300', 'enduro', 300, 2013, 0),
  ('RR-S 350', 'enduro', 350, 2015, 0),
  ('RR-S 390', 'enduro', 390, 2015, 0),
  ('RR-S 430', 'enduro', 430, 2015, 0),
  ('RR-S 480', 'enduro', 480, 2015, 0),
  ('Xtrainer 300', 'enduro', 300, 2016, 0)
) AS m(model, bike_type, engine_cc, year_from, year_to)
WHERE b.name = 'Beta'
ON CONFLICT DO NOTHING;

-- Honda
INSERT INTO bike_models (brand_id, model, bike_type, engine_cc, year_from, year_to)
SELECT b.id, m.model, m.bike_type, m.engine_cc, m.year_from, m.year_to
FROM bike_brands b,
(VALUES
  ('CRF 125F', 'cross', 125, 2014, 0),
  ('CRF 150F', 'cross', 150, 2003, 0),
  ('CRF 250F', 'cross', 250, 2019, 0),
  ('CRF 250R', 'cross', 250, 2004, 0),
  ('CRF 250RX', 'enduro', 250, 2019, 0),
  ('CRF 300L', 'dual-sport', 300, 2021, 0),
  ('CRF 450R', 'cross', 450, 2002, 0),
  ('CRF 450RX', 'enduro', 450, 2017, 0),
  ('CRF 450L', 'dual-sport', 450, 2019, 0)
) AS m(model, bike_type, engine_cc, year_from, year_to)
WHERE b.name = 'Honda'
ON CONFLICT DO NOTHING;

-- Yamaha
INSERT INTO bike_models (brand_id, model, bike_type, engine_cc, year_from, year_to)
SELECT b.id, m.model, m.bike_type, m.engine_cc, m.year_from, m.year_to
FROM bike_brands b,
(VALUES
  ('YZ 125', 'cross', 125, 2005, 0),
  ('YZ 250', 'cross', 250, 2005, 0),
  ('YZ 250F', 'cross', 250, 2001, 0),
  ('YZ 450F', 'cross', 450, 2003, 0),
  ('WR 250F', 'enduro', 250, 2001, 0),
  ('WR 450F', 'enduro', 450, 2003, 0),
  ('Tenere 700', 'adventure', 689, 2019, 0)
) AS m(model, bike_type, engine_cc, year_from, year_to)
WHERE b.name = 'Yamaha'
ON CONFLICT DO NOTHING;

-- Gas Gas / GASGAS
INSERT INTO bike_models (brand_id, model, bike_type, engine_cc, year_from, year_to)
SELECT b.id, m.model, m.bike_type, m.engine_cc, m.year_from, m.year_to
FROM bike_brands b,
(VALUES
  ('EC 250', 'enduro', 250, 2021, 0),
  ('EC 300', 'enduro', 300, 2021, 0),
  ('ECF 250', 'enduro', 250, 2021, 0),
  ('ECF 350', 'enduro', 350, 2021, 0),
  ('ECF 450', 'enduro', 450, 2021, 0),
  ('MC 125', 'cross', 125, 2021, 0),
  ('MC 250', 'cross', 250, 2021, 0),
  ('MCF 250', 'cross', 250, 2021, 0),
  ('MCF 350', 'cross', 350, 2021, 0),
  ('MCF 450', 'cross', 450, 2021, 0)
) AS m(model, bike_type, engine_cc, year_from, year_to)
WHERE b.name = 'GASGAS'
ON CONFLICT DO NOTHING;
