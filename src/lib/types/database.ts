/**
 * Handgeschreven typedefinitie die 1:1 aansluit op supabase/migrations/0001_init.sql.
 * Zodra `supabase` CLI met een gelinkt project beschikbaar is, kan dit bestand
 * vervangen worden door `supabase gen types typescript` — de vorm blijft gelijk.
 */

export type UserRole = "owner" | "admin" | "member" | "readonly";
export type BlockType =
  | "cover"
  | "text"
  | "gallery"
  | "packages"
  | "timeline"
  | "terms"
  | "signature";
export type QuoteStatus =
  | "concept"
  | "verzonden"
  | "bekeken"
  | "in_overleg"
  | "geaccepteerd"
  | "verlopen"
  | "geweigerd";
export type QuoteVersionReason = "sent" | "revised" | "signed";
export type CommentAuthorType = "client" | "agency";
export type ActivityEventType =
  | "sent"
  | "viewed"
  | "section_viewed"
  | "option_changed"
  | "comment_added"
  | "signed"
  | "reminder_sent"
  | "downloaded_pdf"
  | "event_reminder_sent"
  | "declined";
export type EmailTriggerType = "days_after_sent_no_reaction" | "days_before_event";
export type SignatureMethod = "canvas" | "typed";
export type PriceDisplayMode = "incl_btw" | "excl_btw";
export type OrgStatus = "proefperiode" | "actief" | "opgezegd";
export type LogoPreference = "horizontaal" | "vierkant";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          brand_name: string;
          domain: string | null;
          kvk_number: string | null;
          btw_number: string | null;
          address: Record<string, unknown> | null;
          logo_horizontal_url: string | null;
          logo_square_url: string | null;
          logo_preference: LogoPreference;
          terms_url: string | null;
          aantal_personen_actief: boolean;
          aantal_personen_kanttekening: string | null;
          brand_theme: Record<string, unknown>;
          status: OrgStatus;
          plan: string | null;
          monthly_price: number;
          iban: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      email_automation_rules: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          trigger_type: EmailTriggerType;
          trigger_days: number;
          subject: string;
          body: string;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["email_automation_rules"]["Row"]> & {
          organization_id: string;
          name: string;
          trigger_type: EmailTriggerType;
          trigger_days: number;
          subject: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_automation_rules"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string | null;
          email: string;
          role: UserRole;
          avatar_url: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          organization_id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company_name: string | null;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          organization_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          event_type: string;
          description: string | null;
          thumbnail_url: string | null;
          language: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["templates"]["Row"]> & {
          organization_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["templates"]["Row"]>;
        Relationships: [];
      };
      template_blocks: {
        Row: {
          id: string;
          template_id: string;
          type: BlockType;
          position: number;
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["template_blocks"]["Row"]
        > & { template_id: string; type: BlockType };
        Update: Partial<Database["public"]["Tables"]["template_blocks"]["Row"]>;
        Relationships: [];
      };
      block_templates: {
        Row: {
          id: string;
          organization_id: string;
          type: BlockType;
          name: string;
          content: Record<string, unknown>;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["block_templates"]["Row"]
        > & { organization_id: string; type: BlockType; name: string };
        Update: Partial<Database["public"]["Tables"]["block_templates"]["Row"]>;
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          template_id: string | null;
          title: string;
          status: QuoteStatus;
          language: string;
          currency: string;
          event_date: string | null;
          valid_until: string | null;
          price_display: PriceDisplayMode;
          subtotal: number;
          discount_amount: number;
          total: number;
          share_token: string;
          access_code: string | null;
          brand_override: Record<string, unknown>;
          selected_packages: Record<string, string | null>;
          selected_addons: Record<string, number>;
          created_by: string | null;
          sent_at: string | null;
          first_viewed_at: string | null;
          aantal_personen_actief: boolean;
          aantal_personen: number | null;
          price_per_person: boolean;
          handled_by_profile_id: string | null;
          client_display_name: string | null;
          client_display_email: string | null;
          client_display_phone: string | null;
          client_display_company: string | null;
          reference_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quotes"]["Row"]> & {
          organization_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Row"]>;
        Relationships: [];
      };
      quote_blocks: {
        Row: {
          id: string;
          quote_id: string;
          type: BlockType;
          position: number;
          content: Record<string, unknown>;
          content_en: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_blocks"]["Row"]> & {
          quote_id: string;
          type: BlockType;
        };
        Update: Partial<Database["public"]["Tables"]["quote_blocks"]["Row"]>;
        Relationships: [];
      };
      quote_packages: {
        Row: {
          id: string;
          quote_block_id: string;
          name: string;
          description: string | null;
          photo_url: string | null;
          price: number;
          is_default_selected: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["quote_packages"]["Row"]
        > & { quote_block_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["quote_packages"]["Row"]>;
        Relationships: [];
      };
      quote_addons: {
        Row: {
          id: string;
          quote_block_id: string;
          package_id: string | null;
          name: string;
          description: string | null;
          price: number;
          quantity_editable: boolean;
          default_quantity: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_addons"]["Row"]> & {
          quote_block_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_addons"]["Row"]>;
        Relationships: [];
      };
      quote_versions: {
        Row: {
          id: string;
          quote_id: string;
          version_number: number;
          snapshot: Record<string, unknown>;
          total: number;
          reason: QuoteVersionReason;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["quote_versions"]["Row"]
        > & {
          quote_id: string;
          version_number: number;
          snapshot: Record<string, unknown>;
          total: number;
          reason: QuoteVersionReason;
        };
        Update: Partial<Database["public"]["Tables"]["quote_versions"]["Row"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          quote_id: string;
          block_id: string | null;
          author_type: CommentAuthorType;
          author_name: string;
          author_user_id: string | null;
          body: string;
          resolved: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comments"]["Row"]> & {
          quote_id: string;
          author_type: CommentAuthorType;
          author_name: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>;
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          quote_id: string;
          type: ActivityEventType;
          metadata: Record<string, unknown>;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["activity_events"]["Row"]
        > & { quote_id: string; type: ActivityEventType };
        Update: Partial<Database["public"]["Tables"]["activity_events"]["Row"]>;
        Relationships: [];
      };
      signatures: {
        Row: {
          id: string;
          quote_id: string;
          quote_version_id: string;
          signer_name: string;
          signer_email: string;
          method: SignatureMethod;
          signature_image_url: string | null;
          typed_name: string | null;
          ip_address: string;
          user_agent: string;
          document_hash: string;
          certificate_pdf_url: string | null;
          signed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["signatures"]["Row"]> & {
          quote_id: string;
          quote_version_id: string;
          signer_name: string;
          signer_email: string;
          method: SignatureMethod;
          ip_address: string;
          user_agent: string;
          document_hash: string;
        };
        Update: Partial<Database["public"]["Tables"]["signatures"]["Row"]>;
        Relationships: [];
      };
      rate_limit_hits: {
        Row: {
          id: string;
          bucket: string;
          identifier: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rate_limit_hits"]["Row"]> & {
          bucket: string;
          identifier: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_hits"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
