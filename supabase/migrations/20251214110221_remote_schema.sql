drop extension if exists "pg_net";

drop policy "Instructors can view their students" on "public"."profiles";

drop policy "Managers can view all profiles" on "public"."profiles";

drop policy "Users can select their own profile" on "public"."profiles";

alter table "public"."bookings" add column "weather_data" jsonb;

alter table "public"."customer_details" add column "phone" text;

alter table "public"."profiles" drop column "phone";


  create policy "Managers can all customer_details"
  on "public"."customer_details"
  as permissive
  for all
  to public
using ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'manager'::text));



  create policy "Managers can all instructor_details"
  on "public"."instructor_details"
  as permissive
  for all
  to public
using ((( SELECT profiles.role
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) = 'manager'::text));



  create policy "Users can select their own profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



