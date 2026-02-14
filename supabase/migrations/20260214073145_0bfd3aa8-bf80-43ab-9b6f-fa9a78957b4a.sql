
-- Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL, -- 'create', 'update', 'delete', 'restore'
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  actor_role text NOT NULL, -- 'admin' or 'teacher'
  changes jsonb, -- store old/new values
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read audit_log" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert audit_log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- Add deleted_at for soft delete on key tables
ALTER TABLE public.students ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.fees ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.attendance ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.tests ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.class_history ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Index for performance on soft delete queries
CREATE INDEX idx_students_deleted_at ON public.students(deleted_at);
CREATE INDEX idx_fees_deleted_at ON public.fees(deleted_at);
CREATE INDEX idx_attendance_deleted_at ON public.attendance(deleted_at);
CREATE INDEX idx_tests_deleted_at ON public.tests(deleted_at);
CREATE INDEX idx_class_history_deleted_at ON public.class_history(deleted_at);

-- Index on audit_log for fast lookups
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
