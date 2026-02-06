# Supabase Storage policies for avatars

This project expects avatar uploads to be saved in:

- Bucket: `avatar`
- Object path: `profiles/<userId>/avatar`

Because Supabase hosted projects often don't allow creating `storage.objects` policies from the SQL Editor (you'll see `must be owner of table objects`), create these policies in the Dashboard UI:

`Storage` → `Policies` → select the `objects` table → `New policy`.

## Read

If your bucket is **Public**, you can usually rely on public object URLs for reads. If you also want authenticated API reads/listing, add:

- **SELECT** (role: `public`)
  - `USING`: `bucket_id = 'avatar'`

## Write (required for client-side uploads)

Add these policies for role `authenticated`:

- **INSERT**
  - `WITH CHECK`:
    - `bucket_id = 'avatar'`
    - `(storage.foldername(name))[1] = 'profiles'`
    - `(storage.foldername(name))[2] = auth.uid()::text`

- **UPDATE**
  - `USING` and `WITH CHECK`:
    - `bucket_id = 'avatar'`
    - `(storage.foldername(name))[1] = 'profiles'`
    - `(storage.foldername(name))[2] = auth.uid()::text`

- **DELETE**
  - `USING`:
    - `bucket_id = 'avatar'`
    - `(storage.foldername(name))[1] = 'profiles'`
    - `(storage.foldername(name))[2] = auth.uid()::text`
