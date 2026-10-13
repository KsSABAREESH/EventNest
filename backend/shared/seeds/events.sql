INSERT INTO events (
  seed_key, title, category, city, starts_at, price_paise, description, image_url, is_active
)
SELECT
  seed_key,
  title,
  category::event_category,
  city,
  (date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata')
    + make_interval(days => day_offset, hours => start_hour, mins => start_minute))
    AT TIME ZONE 'Asia/Kolkata',
  price_paise,
  description,
  image_url,
  is_active
FROM (VALUES
  ('seed-01', 'Sunset Rooftop Sessions', 'Music', 'Chennai', 2, 19, 0, 79900, 'An open-air evening of independent Tamil artists, warm lights, and a skyline view.', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-02', 'Block Printing for Beginners', 'Workshop', 'Coimbatore', 4, 10, 0, 45000, 'Learn hand block printing and take home a cotton tote you designed yourself.', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-03', 'Madurai Street Food Walk', 'Food', 'Madurai', 6, 18, 0, 35000, 'A guided tasting trail through beloved evening stalls and family-run kitchens.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-04', 'Marina Sunrise 5K', 'Sports', 'Chennai', 8, 6, 30, 15000, 'A friendly, all-pace community run along the coast with a post-run breakfast.', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-05', 'Little Makers Science Lab', 'Kids', 'Bengaluru', 11, 11, 0, 25000, 'Curious young builders make simple, safe experiments with a hands-on host.', 'https://images.unsplash.com/photo-1560785496-3c9d27877182?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-06', 'Indie Night at the Mill', 'Music', 'Coimbatore', 14, 19, 30, 65000, 'Three emerging bands bring guitar-led indie sounds to a restored mill venue.', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-07', 'Coastal Table Food Fair', 'Food', 'Kochi', 17, 12, 0, 0, 'A relaxed afternoon of coastal recipes, local produce, and small food makers.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-08', 'Clay and Coffee Pottery Session', 'Workshop', 'Mysuru', 20, 15, 0, 55000, 'Try the potter''s wheel in a beginner-friendly studio session with coffee included.', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-09', 'Neighbourhood Badminton Social', 'Sports', 'Coimbatore', 23, 16, 0, 20000, 'Casual doubles games for all skill levels, with rackets available to borrow.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-10', 'Storytime Under the Banyan', 'Kids', 'Chennai', 26, 11, 0, 0, 'Local storytellers share folk tales, songs, and a small craft activity for children.', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=85', FALSE),
  ('seed-11', 'Blue Room Jazz Evening', 'Music', 'Mumbai', 28, 20, 0, 120000, 'An intimate live jazz set from a contemporary quartet in a listening room.', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-12', 'Jaipur Plant-Based Kitchen', 'Food', 'Jaipur', 32, 17, 0, 90000, 'A chef-led tasting menu celebrating seasonal vegetables and regional spices.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-13', 'Hyderabad Paper Arts Workshop', 'Workshop', 'Hyderabad', -4, 14, 0, 30000, 'A relaxed introduction to paper cutting, folding, and handmade greeting cards.', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-14', 'Pune Community Football Match', 'Sports', 'Pune', -10, 7, 0, 0, 'A friendly five-a-side match where newcomers and regulars share the pitch.', 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=85', TRUE),
  ('seed-15', 'Harbour Folk Music Circle', 'Music', 'Kochi', -20, 18, 30, 40000, 'An easygoing acoustic folk circle beside the harbour, featuring local performers.', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=85', FALSE)
) AS sample(seed_key, title, category, city, day_offset, start_hour, start_minute, price_paise, description, image_url, is_active)
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  starts_at = EXCLUDED.starts_at,
  price_paise = EXCLUDED.price_paise,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
