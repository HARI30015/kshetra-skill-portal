-- Private profile pictures: owners can manage files in their own user-id folder;
-- lecturers can read profile pictures for administrative workflows.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  false,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_pictures_read_owner_or_lecturer" ON storage.objects;
CREATE POLICY "profile_pictures_read_owner_or_lecturer"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profile-pictures'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_lecturer()
    )
  );

DROP POLICY IF EXISTS "profile_pictures_insert_owner" ON storage.objects;
CREATE POLICY "profile_pictures_insert_owner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_pictures_update_owner" ON storage.objects;
CREATE POLICY "profile_pictures_update_owner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "profile_pictures_delete_owner" ON storage.objects;
CREATE POLICY "profile_pictures_delete_owner"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-pictures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
