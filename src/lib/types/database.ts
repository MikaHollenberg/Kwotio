/**
 * Handgeschreven typedefinitie die 1:1 aansluit op supabase/migrations/0001_init.sql.
 * Zodra `supabase` CLI met een gelinkt project beschikbaar is, kan dit bestand
 * vervangen worden door `supabase gen types typescript` — de vorm blijft gelijk.
 */
import type { ArrangementContentItem } from "@/lib/arrangements/types";

export type UserRole = "owner" | "admin" | "member" | "readonly";
export type PublicPageBackgroundStyle = "none" | "coastline" | "icons";
export type BlockType =
  | "cover"
  | "text"
  | "gallery"
  | "packages"
  | "timeline"
  | "terms"
  | "signature"
  | "arrangement";
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
  | "declined"
  | "review_request_sent"
  | "rebooking_reminder_sent";
export type EmailTriggerType =
  | "days_after_sent_no_reaction"
  | "days_before_event"
  | "days_after_event"
  | "days_before_event_anniversary";
export type SignatureMethod = "canvas" | "typed";
export type PriceDisplayMode = "incl_btw" | "excl_btw";
export type OrgStatus = "proefperiode" | "actief" | "opgezegd";
export type LogoPreference = "horizontaal" | "vierkant";
export type QuoteRequestStatus = "nieuw" | "in_behandeling" | "omgezet" | "genegeerd";
export type LeadPurpose = "uitje" | "arrangement" | "overig";
export type LeadStatus = "nieuw" | "gecontacteerd" | "omgezet" | "afgewezen";
export type PublicPageEventType = "page_view" | "template_opened" | "request_form_opened";
export type InvoiceStatus = "concept" | "open" | "deels_betaald" | "betaald" | "vervallen" | "geannuleerd";
export type InvoiceType = "standaard" | "aanbetaling" | "slotfactuur" | "creditnota";
export type InvoicePaymentMethod = "mollie" | "overboeking" | "pin" | "contant" | "sponsoring" | "overig";
export type InvoiceVatRateType = "hoog" | "laag" | "nul" | "aangepast";
export type ArrangementPriceUnit = "vast" | "p.p.";
export type ArrangementAvailabilityStatus = "beschikbaar" | "bijna_vol" | "vol";
/** Basisregels van een PERCENTAGE-aanbetaling (offerte-pakketten, of zelf
 * ingevulde regels bij een losse factuur) -- alleen gevuld bij mode
 * "percentage", nooit bij een vast bedrag. Voedt de voorinvulling van de
 * slotfactuur-pagina. */
export type DepositBasisLine = { description: string; quantity: number; unitPrice: number; vatRate: number };

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
          review_url: string | null;
          aantal_personen_actief: boolean;
          aantal_personen_kanttekening: string | null;
          public_slug: string;
          public_welcome_message: string | null;
          guest_count_field_active: boolean;
          guest_count_field_label: string | null;
          brand_theme: Record<string, unknown>;
          closed_weekdays: number[];
          public_page_background_style: PublicPageBackgroundStyle;
          location_photo_url: string | null;
          location_caption: string | null;
          status: OrgStatus;
          plan: string | null;
          monthly_price: number;
          iban: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          archived_at: string | null;
          invoice_number_prefix: string | null;
          next_invoice_number: number;
          invoice_number_reset_year: number | null;
          invoice_vat_rate_high: number;
          invoice_vat_rate_low: number;
          invoice_due_days: number;
          invoice_auto_send: boolean;
          invoice_reminder_enabled: boolean;
          mollie_api_key: string | null;
          invoice_extra_logo_urls: string[];
          next_client_number: number;
          invoice_sent_email_subject: string | null;
          invoice_sent_email_body: string | null;
          invoice_reminder_email_subject: string | null;
          invoice_reminder_email_body: string | null;
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
          onboarding_tour_seen_at: string | null;
          notifications_seen_at: string;
          dismissed_notification_ids: string[];
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
          client_number: number | null;
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
          is_publicly_visible: boolean;
          archived_at: string | null;
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
          selected_packages: Record<string, string[]>;
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
          decline_reason: string | null;
          decline_note: string | null;
          internal_notes: string | null;
          deposit_invoice_id: string | null;
          deposit_amount: number | null;
          deposit_paid_at: string | null;
          reminder_date: string | null;
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
      quote_contact_logs: {
        Row: {
          id: string;
          quote_id: string;
          author_name: string;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_contact_logs"]["Row"]> & {
          quote_id: string;
          author_name: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_contact_logs"]["Row"]>;
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
      quote_requests: {
        Row: {
          id: string;
          organization_id: string;
          template_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_company: string | null;
          guest_count: number | null;
          desired_date: string | null;
          notes: string | null;
          status: QuoteRequestStatus;
          converted_quote_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["quote_requests"]["Row"]> & {
          organization_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["quote_requests"]["Row"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          company_name: string | null;
          email: string;
          phone: string;
          purpose: LeadPurpose;
          guest_count: number;
          preferred_date: string;
          message: string | null;
          status: LeadStatus;
          converted_request_id: string | null;
          created_at: string;
          updated_at: string;
          reminder_date: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          organization_id: string;
          name: string;
          email: string;
          phone: string;
          purpose: LeadPurpose;
          guest_count: number;
          preferred_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      public_page_events: {
        Row: {
          id: string;
          organization_id: string;
          template_id: string | null;
          type: PublicPageEventType;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["public_page_events"]["Row"]> & {
          organization_id: string;
          type: PublicPageEventType;
        };
        Update: Partial<Database["public"]["Tables"]["public_page_events"]["Row"]>;
        Relationships: [];
      };
      closed_dates: {
        Row: {
          id: string;
          organization_id: string;
          date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["closed_dates"]["Row"]> & {
          organization_id: string;
          date: string;
        };
        Update: Partial<Database["public"]["Tables"]["closed_dates"]["Row"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          quote_id: string | null;
          client_id: string | null;
          deposit_invoice_id: string | null;
          credit_for_invoice_id: string | null;
          type: InvoiceType;
          status: InvoiceStatus;
          invoice_number: string;
          invoice_year: number;
          invoice_date: string;
          due_date: string;
          delivery_date: string | null;
          org_name: string;
          org_address: Record<string, unknown>;
          org_btw_number: string | null;
          org_kvk_number: string | null;
          org_iban: string | null;
          client_name: string;
          client_company: string | null;
          client_address: Record<string, unknown> | null;
          client_email: string | null;
          subtotal_excl_vat: number;
          vat_amount: number;
          total_incl_vat: number;
          deposit_basis_percentage: number | null;
          deposit_basis_amount: number | null;
          deposit_basis_lines: DepositBasisLine[] | null;
          payment_method: InvoicePaymentMethod | null;
          paid_at: string | null;
          paid_note: string | null;
          mollie_payment_id: string | null;
          mollie_payment_status: string | null;
          reminder_sent_at: string | null;
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {
          organization_id: string;
          invoice_number: string;
          invoice_year: number;
          due_date: string;
          org_name: string;
          client_name: string;
          subtotal_excl_vat: number;
          vat_amount: number;
          total_incl_vat: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Row"]>;
        Relationships: [];
      };
      invoice_lines: {
        Row: {
          id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          vat_rate: number;
          vat_amount: number;
          line_total: number;
          sort_order: number;
          source_package_id: string | null;
          source_addon_id: string | null;
          source_catalog_item_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_lines"]["Row"]> & {
          invoice_id: string;
          description: string;
          unit_price: number;
          vat_rate: number;
          vat_amount: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_lines"]["Row"]>;
        Relationships: [];
      };
      invoice_catalog_items: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          unit_price: number;
          vat_rate_type: InvoiceVatRateType;
          vat_rate_custom: number | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["invoice_catalog_items"]["Row"]> & {
          organization_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_catalog_items"]["Row"]>;
        Relationships: [];
      };
      arrangements: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string;
          category: string;
          color_code: string;
          sort_order: number;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
          content_items: ArrangementContentItem[];
          pdf_url: string | null;
          price_display: PriceDisplayMode;
          is_publicly_visible: boolean;
          public_description: string;
        };
        Insert: Partial<Database["public"]["Tables"]["arrangements"]["Row"]> & {
          organization_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["arrangements"]["Row"]>;
        Relationships: [];
      };
      arrangement_seasons: {
        Row: {
          id: string;
          arrangement_id: string;
          label: string;
          start_date: string;
          end_date: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["arrangement_seasons"]["Row"]> & {
          arrangement_id: string;
          label: string;
          start_date: string;
          end_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["arrangement_seasons"]["Row"]>;
        Relationships: [];
      };
      arrangement_prices: {
        Row: {
          id: string;
          arrangement_id: string;
          season_id: string | null;
          label: string;
          unit: ArrangementPriceUnit;
          amount: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["arrangement_prices"]["Row"]> & {
          arrangement_id: string;
          label: string;
          unit: ArrangementPriceUnit;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["arrangement_prices"]["Row"]>;
        Relationships: [];
      };
      arrangement_surcharges: {
        Row: {
          id: string;
          arrangement_id: string;
          label: string;
          min_guests: number;
          max_guests: number | null;
          unit: ArrangementPriceUnit;
          amount: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["arrangement_surcharges"]["Row"]> & {
          arrangement_id: string;
          min_guests: number;
          unit: ArrangementPriceUnit;
          amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["arrangement_surcharges"]["Row"]>;
        Relationships: [];
      };
      arrangement_availability: {
        Row: {
          id: string;
          arrangement_id: string;
          date: string;
          status: ArrangementAvailabilityStatus;
        };
        Insert: Partial<Database["public"]["Tables"]["arrangement_availability"]["Row"]> & {
          arrangement_id: string;
          date: string;
          status: ArrangementAvailabilityStatus;
        };
        Update: Partial<Database["public"]["Tables"]["arrangement_availability"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_invoice_number: {
        Args: { p_organization_id: string };
        Returns: { invoice_number: string; invoice_year: number }[];
      };
    };
  };
}
