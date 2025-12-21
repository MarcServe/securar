// Auto-generated types from Supabase schema
// Run `supabase gen types typescript` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgRole = "admin" | "contributor" | "viewer" | "consultant";
export type AssessmentStatus = "draft" | "collecting" | "analysing" | "completed" | "archived";
export type ControlStatus = "compliant" | "partial" | "gap" | "not_applicable" | "unknown";
export type EvidenceStatus = "uploaded" | "parsing" | "parsed" | "failed";

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          country: string | null;
          size_band: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          country?: string | null;
          size_band?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          country?: string | null;
          size_band?: string | null;
          created_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: OrgRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: OrgRole;
          created_at?: string;
        };
      };
      assessments: {
        Row: {
          id: string;
          org_id: string;
          target_frameworks: string[];
          status: AssessmentStatus;
          readiness_score: number | null;
          score_breakdown: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          target_frameworks?: string[];
          status?: AssessmentStatus;
          readiness_score?: number | null;
          score_breakdown?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          target_frameworks?: string[];
          status?: AssessmentStatus;
          readiness_score?: number | null;
          score_breakdown?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          framework_tag: string | null;
          domain: string;
          question_text: string;
          help_text: string | null;
          answer_type: string;
          choices: Json;
          control_refs: string[];
          role_target: string | null;
          org_size_relevance: string[] | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          framework_tag?: string | null;
          domain: string;
          question_text: string;
          help_text?: string | null;
          answer_type?: string;
          choices?: Json;
          control_refs?: string[];
          role_target?: string | null;
          org_size_relevance?: string[] | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          framework_tag?: string | null;
          domain?: string;
          question_text?: string;
          help_text?: string | null;
          answer_type?: string;
          choices?: Json;
          control_refs?: string[];
          role_target?: string | null;
          org_size_relevance?: string[] | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          assessment_id: string;
          question_id: string;
          answered_by: string | null;
          answer: Json;
          confidence: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          question_id: string;
          answered_by?: string | null;
          answer: Json;
          confidence?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          question_id?: string;
          answered_by?: string | null;
          answer?: Json;
          confidence?: string | null;
          created_at?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          assessment_id: string;
          org_id: string;
          file_path: string;
          file_name: string;
          file_type: string | null;
          status: EvidenceStatus;
          parsed_text: string | null;
          ai_summary: string | null;
          ai_analysis: Json;
          meta: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          org_id: string;
          file_path: string;
          file_name: string;
          file_type?: string | null;
          status?: EvidenceStatus;
          parsed_text?: string | null;
          ai_summary?: string | null;
          ai_analysis?: Json;
          meta?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          org_id?: string;
          file_path?: string;
          file_name?: string;
          file_type?: string | null;
          status?: EvidenceStatus;
          parsed_text?: string | null;
          ai_summary?: string | null;
          ai_analysis?: Json;
          meta?: Json;
          created_by?: string | null;
          created_at?: string;
        };
      };
      controls: {
        Row: {
          id: string;
          framework: string;
          control_code: string;
          domain: string;
          title: string;
          description: string | null;
          guidance: string | null;
          evidence_types: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          framework: string;
          control_code: string;
          domain: string;
          title: string;
          description?: string | null;
          guidance?: string | null;
          evidence_types?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          framework?: string;
          control_code?: string;
          domain?: string;
          title?: string;
          description?: string | null;
          guidance?: string | null;
          evidence_types?: string[] | null;
          created_at?: string;
        };
      };
      control_results: {
        Row: {
          id: string;
          assessment_id: string;
          control_id: string;
          status: ControlStatus;
          reasoning: string | null;
          evidence_refs: Json;
          confidence: string | null;
          source_inputs: Json;
          human_override: boolean;
          override_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          control_id: string;
          status?: ControlStatus;
          reasoning?: string | null;
          evidence_refs?: Json;
          confidence?: string | null;
          source_inputs?: Json;
          human_override?: boolean;
          override_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          control_id?: string;
          status?: ControlStatus;
          reasoning?: string | null;
          evidence_refs?: Json;
          confidence?: string | null;
          source_inputs?: Json;
          human_override?: boolean;
          override_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      risks: {
        Row: {
          id: string;
          assessment_id: string;
          title: string;
          description: string | null;
          severity: string;
          likelihood: string | null;
          impact: string | null;
          recommendation: string | null;
          remediation_timeframe: string | null;
          risk_references: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          title: string;
          description?: string | null;
          severity: string;
          likelihood?: string | null;
          impact?: string | null;
          recommendation?: string | null;
          remediation_timeframe?: string | null;
          risk_references?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          title?: string;
          description?: string | null;
          severity?: string;
          likelihood?: string | null;
          impact?: string | null;
          recommendation?: string | null;
          remediation_timeframe?: string | null;
          risk_references?: Json;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          assessment_id: string;
          org_id: string;
          version: number;
          pdf_path: string | null;
          summary: Json;
          executive_summary: string | null;
          generated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          org_id: string;
          version?: number;
          pdf_path?: string | null;
          summary?: Json;
          executive_summary?: string | null;
          generated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          org_id?: string;
          version?: number;
          pdf_path?: string | null;
          summary?: Json;
          executive_summary?: string | null;
          generated_at?: string;
          created_by?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          org_id: string | null;
          actor_user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          actor_user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      is_org_member: {
        Args: { p_org: string };
        Returns: boolean;
      };
      has_org_role: {
        Args: { p_org: string; p_roles: OrgRole[] };
        Returns: boolean;
      };
    };
    Enums: {
      org_role: OrgRole;
      assessment_status: AssessmentStatus;
      control_status: ControlStatus;
      evidence_status: EvidenceStatus;
    };
  };
}

// Helper types for easier access
export type Organisation = Database["public"]["Tables"]["organisations"]["Row"];
export type Assessment = Database["public"]["Tables"]["assessments"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type Response = Database["public"]["Tables"]["responses"]["Row"];
export type Evidence = Database["public"]["Tables"]["evidence"]["Row"];
export type Control = Database["public"]["Tables"]["controls"]["Row"];
export type ControlResult = Database["public"]["Tables"]["control_results"]["Row"];
export type Risk = Database["public"]["Tables"]["risks"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];

