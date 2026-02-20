# Storage Setup for Verification Documents

Run the migration first:

```bash
supabase db push
# or apply via Supabase Dashboard > SQL Editor
```

Then create the storage bucket manually:

1. Go to **Supabase Dashboard** > **Storage** > **New bucket**
2. Name: `verification-documents`
3. **Public**: OFF (private)
4. **File size limit**: 5 MB
5. **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`

## Policy: Users can upload to their own folder

Add policy for **INSERT**:

- Policy name: `Users can upload own verification docs`
- Target: `storage.objects`
- Operation: INSERT
- Policy definition:
  ```sql
  (bucket_id = 'verification-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)
  ```

## Policy: Users can read their own uploads

Add policy for **SELECT**:

- Policy name: `Users can read own verification docs`
- Target: `storage.objects`
- Operation: SELECT
- Policy definition:
  ```sql
  (bucket_id = 'verification-documents') AND ((storage.foldername(name))[1] = auth.uid()::text)
  ```

Path format: `{user_id}/{document_type}_{timestamp}.{ext}`
