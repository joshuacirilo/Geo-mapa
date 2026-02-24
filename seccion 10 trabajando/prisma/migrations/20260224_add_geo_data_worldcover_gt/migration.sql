CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;

CREATE SCHEMA IF NOT EXISTS geo_data;

CREATE TABLE IF NOT EXISTS geo_data.worldcover_gt (
    rid SERIAL PRIMARY KEY,
    rast raster NOT NULL,
    filename TEXT
);