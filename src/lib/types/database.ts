export type UserRole = 'owner' | 'company' | 'staff'
export type CleaningStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid'
export type PaymentStatus = 'draft' | 'confirmed' | 'paid'
export type FeeType = 'invoice' | 'payment' | 'both'
export type ExpenseCategory = 'transportation' | 'supplies' | 'other'
export type CompanyMemberRole = 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          role: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          role?: UserRole
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string
          map_url: string | null
          entry_method: string | null
          cleaning_guide: string | null
          completion_photo_url: string | null
          checkin_time: string | null
          checkout_time: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          map_url?: string | null
          entry_method?: string | null
          cleaning_guide?: string | null
          completion_photo_url?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          address?: string
          map_url?: string | null
          entry_method?: string | null
          cleaning_guide?: string | null
          completion_photo_url?: string | null
          checkin_time?: string | null
          checkout_time?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      property_owners: {
        Row: {
          id: string
          property_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      cleaning_companies: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          contact_email?: string | null
          contact_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cleaning_company_members: {
        Row: {
          id: string
          cleaning_company_id: string
          user_id: string
          role: CompanyMemberRole
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_company_id: string
          user_id: string
          role: CompanyMemberRole
          created_at?: string
        }
        Update: {
          cleaning_company_id?: string
          user_id?: string
          role?: CompanyMemberRole
        }
        Relationships: []
      }
      property_cleaning_companies: {
        Row: {
          id: string
          property_id: string
          cleaning_company_id: string
          cleaning_fee: number
          payment_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          cleaning_company_id: string
          cleaning_fee: number
          payment_rate: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          property_id?: string
          cleaning_company_id?: string
          cleaning_fee?: number
          payment_rate?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          id: string
          cleaning_company_id: string
          user_id: string | null
          name: string
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cleaning_company_id: string
          user_id?: string | null
          name: string
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          cleaning_company_id?: string
          user_id?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      cleaning_schedules: {
        Row: {
          id: string
          property_id: string
          cleaning_company_id: string
          scheduled_date: string
          status: CleaningStatus
          checkin_time: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          cleaning_company_id: string
          scheduled_date: string
          status?: CleaningStatus
          checkin_time?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          property_id?: string
          cleaning_company_id?: string
          scheduled_date?: string
          status?: CleaningStatus
          checkin_time?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
          id: string
          cleaning_schedule_id: string
          staff_id: string
          payment_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_schedule_id: string
          staff_id: string
          payment_amount: number
          created_at?: string
        }
        Update: {
          cleaning_schedule_id?: string
          staff_id?: string
          payment_amount?: number
        }
        Relationships: []
      }
      schedule_additional_fees: {
        Row: {
          id: string
          cleaning_schedule_id: string
          description: string
          amount: number
          fee_type: FeeType
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_schedule_id: string
          description: string
          amount: number
          fee_type: FeeType
          created_at?: string
        }
        Update: {
          cleaning_schedule_id?: string
          description?: string
          amount?: number
          fee_type?: FeeType
        }
        Relationships: []
      }
      cleaning_reports: {
        Row: {
          id: string
          cleaning_schedule_id: string
          staff_id: string
          notes: string | null
          started_at: string | null
          completed_at: string | null
          submitted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_schedule_id: string
          staff_id: string
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          submitted_at?: string
          created_at?: string
        }
        Update: {
          cleaning_schedule_id?: string
          staff_id?: string
          notes?: string | null
          started_at?: string | null
          completed_at?: string | null
          submitted_at?: string
        }
        Relationships: []
      }
      report_photos: {
        Row: {
          id: string
          cleaning_report_id: string
          photo_url: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_report_id: string
          photo_url: string
          display_order: number
          created_at?: string
        }
        Update: {
          cleaning_report_id?: string
          photo_url?: string
          display_order?: number
        }
        Relationships: []
      }
      checklists: {
        Row: {
          id: string
          cleaning_company_id: string
          property_id: string | null
          item_name: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_company_id: string
          property_id?: string | null
          item_name: string
          display_order: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          cleaning_company_id?: string
          property_id?: string | null
          item_name?: string
          display_order?: number
          is_active?: boolean
        }
        Relationships: []
      }
      checklist_responses: {
        Row: {
          id: string
          cleaning_report_id: string
          checklist_id: string
          is_checked: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_report_id: string
          checklist_id: string
          is_checked?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          cleaning_report_id?: string
          checklist_id?: string
          is_checked?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          cleaning_schedule_id: string
          staff_id: string
          category: ExpenseCategory
          description: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          cleaning_schedule_id: string
          staff_id: string
          category: ExpenseCategory
          description: string
          amount: number
          created_at?: string
        }
        Update: {
          cleaning_schedule_id?: string
          staff_id?: string
          category?: ExpenseCategory
          description?: string
          amount?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          cleaning_company_id: string
          owner_user_id: string
          year: number
          month: number
          total_amount: number
          status: InvoiceStatus
          issued_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cleaning_company_id: string
          owner_user_id: string
          year: number
          month: number
          total_amount: number
          status?: InvoiceStatus
          issued_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          cleaning_company_id?: string
          owner_user_id?: string
          year?: number
          month?: number
          total_amount?: number
          status?: InvoiceStatus
          issued_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          cleaning_schedule_id: string
          property_name: string
          cleaning_date: string
          amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          cleaning_schedule_id: string
          property_name: string
          cleaning_date: string
          amount: number
          description?: string | null
          created_at?: string
        }
        Update: {
          invoice_id?: string
          cleaning_schedule_id?: string
          property_name?: string
          cleaning_date?: string
          amount?: number
          description?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          cleaning_company_id: string
          staff_id: string
          year: number
          month: number
          total_amount: number
          status: PaymentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cleaning_company_id: string
          staff_id: string
          year: number
          month: number
          total_amount: number
          status?: PaymentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          cleaning_company_id?: string
          staff_id?: string
          year?: number
          month?: number
          total_amount?: number
          status?: PaymentStatus
          updated_at?: string
        }
        Relationships: []
      }
      payment_items: {
        Row: {
          id: string
          payment_id: string
          cleaning_schedule_id: string
          property_name: string
          cleaning_date: string
          amount: number
          expense_amount: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          cleaning_schedule_id: string
          property_name: string
          cleaning_date: string
          amount: number
          expense_amount?: number
          description?: string | null
          created_at?: string
        }
        Update: {
          payment_id?: string
          cleaning_schedule_id?: string
          property_name?: string
          cleaning_date?: string
          amount?: number
          expense_amount?: number
          description?: string | null
        }
        Relationships: []
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {}
  }
}
