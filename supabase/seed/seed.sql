-- Basic seed data for development

INSERT INTO products (slug, name, description, origin_country, cocoa_type, price, image_url)
VALUES
('product_amelonado','Amelonado Cocoa','A common West African cocoa variety','Cameroon','Forastero', 1200.00, '/img/product_amelonado.jpg')
ON CONFLICT DO NOTHING;

INSERT INTO buyers (name, contact_email, phone)
VALUES ('Example Buyer','buyer@example.com','+1-555-0100')
ON CONFLICT DO NOTHING;

-- Create a sample user
INSERT INTO users (email, full_name, role)
VALUES ('dev@local','Local Developer','admin')
ON CONFLICT DO NOTHING;
