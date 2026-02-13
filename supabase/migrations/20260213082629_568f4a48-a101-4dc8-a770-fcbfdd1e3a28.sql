
-- Create batches table (fixed, cannot delete)
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read batches" ON public.batches FOR SELECT USING (true);

-- Insert fixed batches
INSERT INTO public.batches (name, subject) VALUES
  ('3:30 PM – 5:30 PM', NULL),
  ('6:30 PM – 8:30 PM', NULL);

-- Access keys table
CREATE TABLE public.access_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate keys" ON public.access_keys FOR SELECT USING (true);

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT,
  batch_id UUID REFERENCES public.batches(id),
  parent_name TEXT,
  parent_phone TEXT,
  monthly_fee NUMERIC NOT NULL DEFAULT 0,
  joined_on DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  priority_tag TEXT DEFAULT 'normal' CHECK (priority_tag IN ('normal', 'important', 'warning')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete students" ON public.students FOR DELETE USING (true);

-- Fees table
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  paid_on DATE,
  payment_mode TEXT DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'bank', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fees" ON public.fees FOR SELECT USING (true);
CREATE POLICY "Anyone can insert fees" ON public.fees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update fees" ON public.fees FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete fees" ON public.fees FOR DELETE USING (true);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete attendance" ON public.attendance FOR DELETE USING (true);

-- Tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  marks NUMERIC,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tests" ON public.tests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tests" ON public.tests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tests" ON public.tests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tests" ON public.tests FOR DELETE USING (true);

-- Class history table
CREATE TABLE public.class_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  batch_id UUID NOT NULL REFERENCES public.batches(id),
  topic TEXT,
  homework TEXT,
  teacher_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read class_history" ON public.class_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert class_history" ON public.class_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update class_history" ON public.class_history FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete class_history" ON public.class_history FOR DELETE USING (true);
