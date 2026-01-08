export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          seconds: number
          amount: number | null
          status: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_payment_intent: string | null
          video_url: string | null
          video_filename: string | null
          prompt: string | null
          model: string
          video_storage_path: string | null
          report_storage_path: string | null
          analysis_status: string
          analysis_started_at: string | null
          analysis_completed_at: string | null
          analysis_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          seconds: number
          amount?: number | null
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_payment_intent?: string | null
          video_url?: string | null
          video_filename?: string | null
          prompt?: string | null
          model?: string
          video_storage_path?: string | null
          report_storage_path?: string | null
          analysis_status?: string
          analysis_started_at?: string | null
          analysis_completed_at?: string | null
          analysis_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          seconds?: number
          amount?: number | null
          status?: 'pending' | 'paid' | 'failed' | 'refunded'
          stripe_payment_intent?: string | null
          video_url?: string | null
          video_filename?: string | null
          prompt?: string | null
          model?: string
          video_storage_path?: string | null
          report_storage_path?: string | null
          analysis_status?: string
          analysis_started_at?: string | null
          analysis_completed_at?: string | null
          analysis_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          upload_id: string | null
          user_id: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          started_at: string | null
          completed_at: string | null
          result_data: any | null
          frames_analyzed: number | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          upload_id?: string | null
          user_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
          result_data?: any | null
          frames_analyzed?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          upload_id?: string | null
          user_id?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          started_at?: string | null
          completed_at?: string | null
          result_data?: any | null
          frames_analyzed?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}