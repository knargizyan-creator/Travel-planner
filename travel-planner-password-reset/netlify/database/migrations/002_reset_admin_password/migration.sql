-- Temporary password reset for Travel Planner admin
UPDATE app_users
SET password_hash = '3da483a045fa6de686a09c2f8151ecb3:3c6060330bd1d1d7d7f4ccddc23966e72df6cf52ca1b8a46f01b6fb7848895cf7c3c3e647538a7155b03b94e603457e7d485f04815de0728ac4f825cf74566e4'
WHERE LOWER(email) = LOWER('knargizyan@gmail.com');
