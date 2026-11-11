-- Private source-file storage used by the tenant-scoped Elastic evidence index.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('paypilot-evidence-private', 'paypilot-evidence-private', false, 8388608,
        array['application/pdf', 'text/plain', 'text/markdown', 'text/csv'])
on conflict (id) do update set public = false, file_size_limit = 8388608,
  allowed_mime_types = excluded.allowed_mime_types;

create policy paypilot_evidence_upload_for_workspace_members
on storage.objects for insert to authenticated
with check (
  bucket_id = 'paypilot-evidence-private'
  and exists (
    select 1
    from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id
    where w.id::text = (storage.foldername(name))[1]
      and (w.created_by = (select auth.uid()) or (wm.user_id = (select auth.uid()) and wm.status = 'active'))
  )
);

create policy paypilot_evidence_read_for_workspace_members
on storage.objects for select to authenticated
using (
  bucket_id = 'paypilot-evidence-private'
  and exists (
    select 1
    from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id
    where w.id::text = (storage.foldername(name))[1]
      and (w.created_by = (select auth.uid()) or (wm.user_id = (select auth.uid()) and wm.status = 'active'))
  )
);
