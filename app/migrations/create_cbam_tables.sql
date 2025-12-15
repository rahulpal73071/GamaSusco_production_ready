-- CBAM (Carbon Border Adjustment Mechanism) Database Migration
-- Creates all necessary tables for CBAM reporting
-- Run this script to add CBAM functionality to your database

-- CBAM Installation tracking
CREATE TABLE IF NOT EXISTS cbam_installations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    operator_name VARCHAR(255),
    address TEXT,
    economic_activity VARCHAR(255),
    un_locode VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbam_installations_company_id ON cbam_installations(company_id);
CREATE INDEX IF NOT EXISTS idx_cbam_installations_country_code ON cbam_installations(country_code);

-- CBAM Goods Categories
CREATE TABLE IF NOT EXISTS cbam_goods (
    id SERIAL PRIMARY KEY,
    cn_code VARCHAR(20) UNIQUE NOT NULL,
    goods_category VARCHAR(50) NOT NULL,
    description TEXT,
    is_complex_good BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbam_goods_cn_code ON cbam_goods(cn_code);
CREATE INDEX IF NOT EXISTS idx_cbam_goods_category ON cbam_goods(goods_category);

-- CBAM Emissions Data
CREATE TABLE IF NOT EXISTS cbam_emissions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id INTEGER NOT NULL REFERENCES cbam_installations(id) ON DELETE CASCADE,
    goods_id INTEGER NOT NULL REFERENCES cbam_goods(id),
    reporting_period DATE NOT NULL,
    
    -- Emissions data (in tCO2e)
    direct_emissions NUMERIC(15,3),
    indirect_emissions NUMERIC(15,3),
    total_embedded_emissions NUMERIC(15,3),
    
    -- Activity data
    quantity_imported NUMERIC(15,3),
    quantity_unit VARCHAR(20),
    
    -- Carbon pricing
    carbon_price_paid NUMERIC(15,2),
    carbon_price_currency VARCHAR(3) DEFAULT 'EUR',
    carbon_price_country VARCHAR(3),
    
    -- Calculation method
    calculation_method VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    verifier_name VARCHAR(255),
    verification_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbam_emissions_company_id ON cbam_emissions(company_id);
CREATE INDEX IF NOT EXISTS idx_cbam_emissions_installation_id ON cbam_emissions(installation_id);
CREATE INDEX IF NOT EXISTS idx_cbam_emissions_goods_id ON cbam_emissions(goods_id);
CREATE INDEX IF NOT EXISTS idx_cbam_emissions_reporting_period ON cbam_emissions(reporting_period);

-- CBAM Precursors (for complex goods)
CREATE TABLE IF NOT EXISTS cbam_precursors (
    id SERIAL PRIMARY KEY,
    parent_emission_id INTEGER NOT NULL REFERENCES cbam_emissions(id) ON DELETE CASCADE,
    precursor_goods_id INTEGER NOT NULL REFERENCES cbam_goods(id),
    precursor_quantity NUMERIC(15,3),
    precursor_emissions NUMERIC(15,3),
    calculation_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbam_precursors_parent_emission_id ON cbam_precursors(parent_emission_id);
CREATE INDEX IF NOT EXISTS idx_cbam_precursors_precursor_goods_id ON cbam_precursors(precursor_goods_id);

-- CBAM Quarterly Reports
CREATE TABLE IF NOT EXISTS cbam_quarterly_reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL CHECK (quarter IN (1,2,3,4)),
    year INTEGER NOT NULL,
    submission_date DATE,
    submission_deadline DATE,
    status VARCHAR(20) DEFAULT 'draft',
    
    total_direct_emissions NUMERIC(15,3),
    total_indirect_emissions NUMERIC(15,3),
    total_embedded_emissions NUMERIC(15,3),
    
    report_file_url TEXT,
    xml_export TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(company_id, quarter, year)
);

CREATE INDEX IF NOT EXISTS idx_cbam_quarterly_reports_company_id ON cbam_quarterly_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_cbam_quarterly_reports_quarter_year ON cbam_quarterly_reports(quarter, year);

-- Seed CBAM Goods Catalog with common goods
INSERT INTO cbam_goods (cn_code, goods_category, description, is_complex_good) VALUES
-- Cement
('2523', 'cement', 'Portland cement, aluminous cement, slag cement and similar', false),
('2523 10', 'cement', 'Cement clinkers', false),
('2523 21', 'cement', 'White Portland cement', false),
('2523 29', 'cement', 'Other Portland cement', false),

-- Iron and Steel
('7201', 'steel', 'Pig iron and spiegeleisen in pigs, blocks or other primary forms', false),
('7202', 'steel', 'Ferro-alloys', false),
('7203', 'steel', 'Ferrous products obtained by direct reduction of iron ore', false),
('7204', 'steel', 'Ferrous waste and scrap', false),
('7205', 'steel', 'Granules and powders of pig iron, spiegeleisen, iron or steel', false),
('7206', 'steel', 'Iron and non-alloy steel in ingots or other primary forms', false),
('7207', 'steel', 'Semi-finished products of iron or non-alloy steel', false),
('7208', 'steel', 'Flat-rolled products of iron or non-alloy steel', false),
('7209', 'steel', 'Flat-rolled products of iron or non-alloy steel, of a width of 600 mm or more', false),
('7210', 'steel', 'Flat-rolled products of iron or non-alloy steel, of a width of less than 600 mm', false),
('7211', 'steel', 'Flat-rolled products of iron or non-alloy steel, plated or coated', false),
('7212', 'steel', 'Flat-rolled products of iron or non-alloy steel, not further worked than hot-rolled', false),
('7213', 'steel', 'Bars and rods, hot-rolled, in irregularly wound coils, of iron or non-alloy steel', false),
('7214', 'steel', 'Other bars and rods of iron or non-alloy steel', false),
('7215', 'steel', 'Angles, shapes and sections of iron or non-alloy steel', false),
('7216', 'steel', 'Angles, shapes and sections of iron or non-alloy steel, not further worked than hot-rolled', false),
('7217', 'steel', 'Wire of iron or non-alloy steel', false),
('7218', 'steel', 'Stainless steel in ingots or other primary forms', false),
('7219', 'steel', 'Flat-rolled products of stainless steel', false),
('7220', 'steel', 'Bars and rods, hot-rolled, in irregularly wound coils, of stainless steel', false),
('7221', 'steel', 'Other bars and rods of stainless steel', false),
('7222', 'steel', 'Other bars and rods of stainless steel, angles, shapes and sections', false),
('7223', 'steel', 'Wire of stainless steel', false),
('7224', 'steel', 'Other alloy steel in ingots or other primary forms', false),
('7225', 'steel', 'Flat-rolled products of other alloy steel', false),
('7226', 'steel', 'Bars and rods, hot-rolled, in irregularly wound coils, of other alloy steel', false),
('7227', 'steel', 'Other bars and rods of other alloy steel', false),
('7228', 'steel', 'Other bars and rods of other alloy steel, angles, shapes and sections', false),
('7229', 'steel', 'Wire of other alloy steel', false),

-- Aluminium
('7601', 'aluminium', 'Unwrought aluminium', false),
('7602', 'aluminium', 'Aluminium waste and scrap', false),
('7603', 'aluminium', 'Aluminium powders and flakes', false),
('7604', 'aluminium', 'Aluminium bars, rods and profiles', false),
('7605', 'aluminium', 'Aluminium wire', false),
('7606', 'aluminium', 'Aluminium plates, sheets and strip', false),
('7607', 'aluminium', 'Aluminium foil', false),
('7608', 'aluminium', 'Aluminium tubes and pipes', false),
('7609', 'aluminium', 'Aluminium tube or pipe fittings', false),

-- Fertilizers
('3102', 'fertilizers', 'Mineral or chemical fertilizers, nitrogenous', false),
('3103', 'fertilizers', 'Mineral or chemical fertilizers, phosphatic', false),
('3104', 'fertilizers', 'Mineral or chemical fertilizers, potassic', false),
('3105', 'fertilizers', 'Mineral or chemical fertilizers containing two or three of the fertilizing elements nitrogen, phosphorus and potassium', false),

-- Electricity
('2716', 'electricity', 'Electrical energy', false),

-- Hydrogen
('2804', 'hydrogen', 'Hydrogen', false)
ON CONFLICT (cn_code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE cbam_installations IS 'CBAM installations - production facilities outside EU';
COMMENT ON TABLE cbam_goods IS 'CBAM goods catalog - goods subject to CBAM regulation';
COMMENT ON TABLE cbam_emissions IS 'CBAM emissions - embedded emissions in imported goods';
COMMENT ON TABLE cbam_precursors IS 'CBAM precursors - precursor materials for complex goods';
COMMENT ON TABLE cbam_quarterly_reports IS 'CBAM quarterly reports - generated quarterly reports for EU submission';

