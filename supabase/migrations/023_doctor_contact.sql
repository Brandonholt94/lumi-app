-- Doctor contact info stored on profiles
alter table profiles
  add column if not exists doctor_name  text,
  add column if not exists doctor_email text;
