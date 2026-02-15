-- CleanSync Database Schema
-- 民泊清掃管理アプリ

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. users（ユーザー）
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'company', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. properties（物件）
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  map_url TEXT,
  entry_method TEXT,
  cleaning_guide TEXT,
  completion_photo_url TEXT,
  checkin_time TIME,
  checkout_time TIME,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. property_owners（物件-オーナー紐付け）
-- ============================================
CREATE TABLE property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, user_id)
);

-- ============================================
-- 4. cleaning_companies（清掃会社）
-- ============================================
CREATE TABLE cleaning_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. cleaning_company_members（清掃会社メンバー）
-- ============================================
CREATE TABLE cleaning_company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cleaning_company_id, user_id)
);

-- ============================================
-- 6. property_cleaning_companies（物件-清掃会社紐付け）
-- ============================================
CREATE TABLE property_cleaning_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  cleaning_fee DECIMAL(10,2) NOT NULL,
  payment_rate DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, cleaning_company_id)
);

-- ============================================
-- 7. staff（清掃スタッフ）
-- ============================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. cleaning_schedules（清掃予定）
-- ============================================
CREATE TABLE cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  checkin_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedules_property_date ON cleaning_schedules(property_id, scheduled_date);
CREATE INDEX idx_schedules_company_date ON cleaning_schedules(cleaning_company_id, scheduled_date);
CREATE INDEX idx_schedules_date ON cleaning_schedules(scheduled_date);

-- ============================================
-- 9. staff_assignments（スタッフアサイン）
-- ============================================
CREATE TABLE staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_schedule_id UUID NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  payment_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cleaning_schedule_id, staff_id)
);

-- ============================================
-- 10. schedule_additional_fees（追加料金）
-- ============================================
CREATE TABLE schedule_additional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_schedule_id UUID NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('invoice', 'payment', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 11. cleaning_reports（清掃報告）
-- ============================================
CREATE TABLE cleaning_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_schedule_id UUID NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 12. report_photos（清掃報告写真）
-- ============================================
CREATE TABLE report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_report_id UUID NOT NULL REFERENCES cleaning_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 13. checklists（チェックリスト項目定義）
-- ============================================
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 14. checklist_responses（チェックリスト回答）
-- ============================================
CREATE TABLE checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_report_id UUID NOT NULL REFERENCES cleaning_reports(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cleaning_report_id, checklist_id)
);

-- ============================================
-- 15. expenses（経費）
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_schedule_id UUID NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('transportation', 'supplies', 'other')),
  description VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 16. invoices（請求書）
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid')),
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cleaning_company_id, owner_user_id, year, month)
);

-- ============================================
-- 17. invoice_items（請求書明細）
-- ============================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  cleaning_schedule_id UUID NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  property_name VARCHAR(100) NOT NULL,
  cleaning_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 18. payments（支払い）
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaning_company_id UUID NOT NULL REFERENCES cleaning_companies(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cleaning_company_id, staff_id, year, month)
);

-- ============================================
-- 19. payment_items（支払い明細）
-- ============================================
CREATE TABLE payment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  cleaning_schedule_id UUID NOT NULL REFERENCES cleaning_schedules(id) ON DELETE CASCADE,
  property_name VARCHAR(100) NOT NULL,
  cleaning_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_properties BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_cleaning_companies BEFORE UPDATE ON cleaning_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_property_cleaning_companies BEFORE UPDATE ON property_cleaning_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_staff BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_cleaning_schedules BEFORE UPDATE ON cleaning_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_invoices BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_cleaning_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: users
-- ============================================
CREATE POLICY "users_read_own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================
-- RLS Policies: properties
-- ============================================
-- Owners can manage their own properties
CREATE POLICY "owners_manage_properties" ON properties FOR ALL USING (
  id IN (SELECT property_id FROM property_owners WHERE user_id = auth.uid())
);
-- Company members can view properties they are assigned to
CREATE POLICY "company_view_properties" ON properties FOR SELECT USING (
  id IN (
    SELECT pcc.property_id FROM property_cleaning_companies pcc
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = pcc.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);
-- Staff can view properties of their schedules
CREATE POLICY "staff_view_properties" ON properties FOR SELECT USING (
  id IN (
    SELECT cs.property_id FROM cleaning_schedules cs
    JOIN staff_assignments sa ON sa.cleaning_schedule_id = cs.id
    JOIN staff s ON s.id = sa.staff_id
    WHERE s.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: property_owners
-- ============================================
CREATE POLICY "owners_manage_property_owners" ON property_owners FOR ALL USING (
  user_id = auth.uid()
);
CREATE POLICY "company_view_property_owners" ON property_owners FOR SELECT USING (
  property_id IN (
    SELECT pcc.property_id FROM property_cleaning_companies pcc
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = pcc.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: cleaning_companies
-- ============================================
CREATE POLICY "members_view_company" ON cleaning_companies FOR SELECT USING (
  id IN (SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid())
);
CREATE POLICY "admin_manage_company" ON cleaning_companies FOR ALL USING (
  id IN (SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "owners_view_company" ON cleaning_companies FOR SELECT USING (
  id IN (
    SELECT pcc.cleaning_company_id FROM property_cleaning_companies pcc
    JOIN property_owners po ON po.property_id = pcc.property_id
    WHERE po.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: cleaning_company_members
-- ============================================
CREATE POLICY "members_view_members" ON cleaning_company_members FOR SELECT USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "admin_manage_members" ON cleaning_company_members FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- RLS Policies: property_cleaning_companies
-- ============================================
CREATE POLICY "company_manage_pcc" ON property_cleaning_companies FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "owners_view_pcc" ON property_cleaning_companies FOR SELECT USING (
  property_id IN (SELECT property_id FROM property_owners WHERE user_id = auth.uid())
);

-- ============================================
-- RLS Policies: staff
-- ============================================
CREATE POLICY "company_manage_staff" ON staff FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "staff_view_own" ON staff FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- RLS Policies: cleaning_schedules
-- ============================================
CREATE POLICY "owners_view_schedules" ON cleaning_schedules FOR SELECT USING (
  property_id IN (SELECT property_id FROM property_owners WHERE user_id = auth.uid())
);
CREATE POLICY "company_manage_schedules" ON cleaning_schedules FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "staff_view_assigned_schedules" ON cleaning_schedules FOR SELECT USING (
  id IN (
    SELECT sa.cleaning_schedule_id FROM staff_assignments sa
    JOIN staff s ON s.id = sa.staff_id
    WHERE s.user_id = auth.uid()
  )
);
CREATE POLICY "staff_update_assigned_schedules" ON cleaning_schedules FOR UPDATE USING (
  id IN (
    SELECT sa.cleaning_schedule_id FROM staff_assignments sa
    JOIN staff s ON s.id = sa.staff_id
    WHERE s.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: staff_assignments
-- ============================================
CREATE POLICY "company_manage_assignments" ON staff_assignments FOR ALL USING (
  cleaning_schedule_id IN (
    SELECT cs.id FROM cleaning_schedules cs
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = cs.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);
CREATE POLICY "staff_view_own_assignments" ON staff_assignments FOR SELECT USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "owners_view_assignments" ON staff_assignments FOR SELECT USING (
  cleaning_schedule_id IN (
    SELECT cs.id FROM cleaning_schedules cs
    JOIN property_owners po ON po.property_id = cs.property_id
    WHERE po.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: schedule_additional_fees
-- ============================================
CREATE POLICY "company_manage_fees" ON schedule_additional_fees FOR ALL USING (
  cleaning_schedule_id IN (
    SELECT cs.id FROM cleaning_schedules cs
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = cs.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: cleaning_reports
-- ============================================
CREATE POLICY "company_view_reports" ON cleaning_reports FOR SELECT USING (
  cleaning_schedule_id IN (
    SELECT cs.id FROM cleaning_schedules cs
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = cs.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);
CREATE POLICY "staff_manage_own_reports" ON cleaning_reports FOR ALL USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);
CREATE POLICY "owners_view_reports" ON cleaning_reports FOR SELECT USING (
  cleaning_schedule_id IN (
    SELECT cs.id FROM cleaning_schedules cs
    JOIN property_owners po ON po.property_id = cs.property_id
    WHERE po.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: report_photos
-- ============================================
CREATE POLICY "company_view_photos" ON report_photos FOR SELECT USING (
  cleaning_report_id IN (
    SELECT cr.id FROM cleaning_reports cr
    JOIN cleaning_schedules cs ON cs.id = cr.cleaning_schedule_id
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = cs.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);
CREATE POLICY "staff_manage_own_photos" ON report_photos FOR ALL USING (
  cleaning_report_id IN (
    SELECT id FROM cleaning_reports WHERE staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  )
);
CREATE POLICY "owners_view_photos" ON report_photos FOR SELECT USING (
  cleaning_report_id IN (
    SELECT cr.id FROM cleaning_reports cr
    JOIN cleaning_schedules cs ON cs.id = cr.cleaning_schedule_id
    JOIN property_owners po ON po.property_id = cs.property_id
    WHERE po.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: checklists
-- ============================================
CREATE POLICY "company_manage_checklists" ON checklists FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "staff_view_checklists" ON checklists FOR SELECT USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM staff WHERE user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: checklist_responses
-- ============================================
CREATE POLICY "company_view_responses" ON checklist_responses FOR SELECT USING (
  cleaning_report_id IN (
    SELECT cr.id FROM cleaning_reports cr
    JOIN cleaning_schedules cs ON cs.id = cr.cleaning_schedule_id
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = cs.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);
CREATE POLICY "staff_manage_own_responses" ON checklist_responses FOR ALL USING (
  cleaning_report_id IN (
    SELECT id FROM cleaning_reports WHERE staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  )
);
CREATE POLICY "owners_view_responses" ON checklist_responses FOR SELECT USING (
  cleaning_report_id IN (
    SELECT cr.id FROM cleaning_reports cr
    JOIN cleaning_schedules cs ON cs.id = cr.cleaning_schedule_id
    JOIN property_owners po ON po.property_id = cs.property_id
    WHERE po.user_id = auth.uid()
  )
);

-- ============================================
-- RLS Policies: expenses
-- ============================================
CREATE POLICY "company_manage_expenses" ON expenses FOR ALL USING (
  cleaning_schedule_id IN (
    SELECT cs.id FROM cleaning_schedules cs
    JOIN cleaning_company_members ccm ON ccm.cleaning_company_id = cs.cleaning_company_id
    WHERE ccm.user_id = auth.uid()
  )
);
CREATE POLICY "staff_manage_own_expenses" ON expenses FOR ALL USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- ============================================
-- RLS Policies: invoices
-- ============================================
CREATE POLICY "company_manage_invoices" ON invoices FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "owners_view_invoices" ON invoices FOR SELECT USING (
  owner_user_id = auth.uid()
);

-- ============================================
-- RLS Policies: invoice_items
-- ============================================
CREATE POLICY "company_manage_invoice_items" ON invoice_items FOR ALL USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE cleaning_company_id IN (
      SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "owners_view_invoice_items" ON invoice_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE owner_user_id = auth.uid())
);

-- ============================================
-- RLS Policies: payments
-- ============================================
CREATE POLICY "company_manage_payments" ON payments FOR ALL USING (
  cleaning_company_id IN (
    SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "staff_view_own_payments" ON payments FOR SELECT USING (
  staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
);

-- ============================================
-- RLS Policies: payment_items
-- ============================================
CREATE POLICY "company_manage_payment_items" ON payment_items FOR ALL USING (
  payment_id IN (
    SELECT id FROM payments WHERE cleaning_company_id IN (
      SELECT cleaning_company_id FROM cleaning_company_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "staff_view_own_payment_items" ON payment_items FOR SELECT USING (
  payment_id IN (SELECT id FROM payments WHERE staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid()))
);
