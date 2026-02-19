-- Keep realtime enabled on the legacy rides table for compatibility.
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
