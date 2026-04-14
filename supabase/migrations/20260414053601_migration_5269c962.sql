-- Add printer configuration to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS printer_width VARCHAR(10) DEFAULT '80mm';

COMMENT ON COLUMN businesses.printer_width IS 'Thermal printer paper width: 58mm or 80mm';

-- Update existing businesses to have default 80mm
UPDATE businesses 
SET printer_width = '80mm' 
WHERE printer_width IS NULL;