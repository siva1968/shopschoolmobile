// ─── Routes ───────────────────────────────────────────────────────────────────
export enum Route {
  signIn = "/",
  shop = "/(tabs)/shop",
  cart = "/(tabs)/cart",
  orders = "/(tabs)/orders",
  account = "/(tabs)/account",
}

// ─── Portal ───────────────────────────────────────────────────────────────────
export interface Portal {
  portal_id: string;
  portal_name: string;
  school_name: string;
  school_phone?: string;
  school_email?: string;
  logo?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  status?: boolean;
  is_active?: boolean;
  theme?: string;
  domain?: string;
}

// ─── User / Auth ──────────────────────────────────────────────────────────────
export interface StudentProfile {
  id?: string;
  portal_id?: string;
  student_enrollment_id?: string | null;
  father_name?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_email?: string;
  gender?: string;
  hap?: boolean;
  hasdp?: boolean;
  first_term_paid?: boolean;
  house?: string | null;
  ai?: boolean | null;
  date_of_admission?: string | null;
  application_no?: string | null;
  locality?: string | null;
  otp?: string | null;
  active?: boolean;
  referral_code?: string | null;
  is_sheffler?: boolean | null;
  student_references_code?: string | null;
  is_staff?: boolean;
  is_current_profile?: boolean;
  avail_free_kit?: boolean;
  is_bundle_kit?: string | boolean | null;
  student_id?: string;
  class_id?: string;
  class?: { id: string; portal_id?: string; name: string; created_at?: string; updated_at?: string } | null;
  section_id?: string;
  section?: { id: string; portal_id?: string; name: string; created_at?: string; updated_at?: string } | null;
  academic_id?: string;
  academic?: { id: string } | null;
  second_language_id?: string | null;
  second_language?: { id: string; portal_id?: string; name: string } | null;
  third_language_id?: string | null;
  third_language?: { id: string; portal_id?: string; name: string } | null;
  fourth_language_id?: string | null;
  fourth_language?: { id: string; portal_id?: string; name: string } | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Address {
  id: string;
  address_name?: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  country_code?: string;
  province?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
}

export interface User {
  id: string;
  company_name?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  has_account?: boolean;
  metadata?: { portal_id?: string; student_enrollment_code?: string; [key: string]: unknown };
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Extended fields returned by the custom store API
  student_enrollment_code?: string;
  student_name?: string;
  portal_id?: string;
  student_id?: string;
  student_profile?: StudentProfile;
  addresses?: Address[];
  carts?: { id: string; metadata?: { portal_id?: string }; completed_at?: string | null; [key: string]: unknown }[];
}

// ─── Product / Variant ────────────────────────────────────────────────────────
export interface LocationLevel {
  available_quantity: number;
  stocked_quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  prices: { amount: number; currency_code: string }[];
  inventory?: { location_levels: LocationLevel[] }[];
  options?: { value: string }[];
}

export interface ProductAttributes {
  id?: string;
  product_id?: string;
  hsn_code_id?: string | null;
  tax_status?: boolean;
  isbn_code?: string | null;
  image_url?: string;
}

export interface Product {
  id: string;
  title: string;
  handle?: string;
  subtitle?: string | null;
  description?: string | null;
  status?: string;
  thumbnail?: string | null;
  image_url?: string | null;     // top-level field on kit products
  qty?: number;                  // recommended quantity (kit products)
  variants: ProductVariant[];
  categories?: { id?: string; name: string }[];
  images?: { url: string }[];
  tags?: { value: string }[];
  options?: { id: string; title: string; values?: { id: string; value: string }[] }[];
  portal?: { portal_id: string; id: string };
  product_attributes?: ProductAttributes;
  attributes?: ProductAttributes;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ─── Kit ─────────────────────────────────────────────────────────────────────
export interface Kit {
  id: string;
  title: string;
  price: number;  // bundle price from API
  type: "bundle" | "free";
  image_url?: string | null;
  thumbnail?: string | null;
  products: Product[];
  package_list?: string; // HTML string
  student_note?: string; // HTML string
  disable_textbook_customization?: boolean;
}

// ─── Uniform ──────────────────────────────────────────────────────────────────
export interface Uniform {
  id: string;
  title: string;
  products: Product[];
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  description?: string;
  kits?: Kit[];
  uniforms?: Uniform[];
  metadata?: Record<string, unknown>;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartLineItem {
  id: string;
  title?: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  quantity: number;
  variant_id?: string;
  product_id?: string;
  product_title?: string;
  product_description?: string | null;
  product_subtitle?: string | null;
  product_handle?: string;
  variant_title?: string;
  unit_price: number;
  subtotal?: number;
  is_custom_price?: boolean;
  is_discountable?: boolean;
  is_tax_inclusive?: boolean;
  requires_shipping?: boolean;
  metadata?: Record<string, unknown>;
  cart_id?: string;
  item_type?: "kit" | "uniform";
  class_kit_type?: "bundle" | "free";
  cart_line_item_ids?: string[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface OrderedFreeKit {
  kit_id: string;
  kit_name: string;
  ordered_at: string;
}

export interface CartData {
  id: string;
  items?: CartLineItem[];
  custom_items?: CartLineItem[];
  total?: number;
  subtotal?: number;
  tax_total?: number;
  currency_code?: string;
  region_id?: string;
  billing_address?: Address;
  shipping_address?: Address;
  ordered_free_kits?: OrderedFreeKit[];
  completed_at?: string | null;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export interface OrderAttributes {
  invoice_id?: string;
  books_status?: string;
  uniform_status?: string;
}

export interface Order {
  id: string;
  display_id?: number;
  status?: string;
  currency_code?: string;
  created_at?: string;
  cancelled_at?: string;
  items?: CartLineItem[];
  custom_items?: CartLineItem[];
  order_attributes?: OrderAttributes;
  is_cancelled?: boolean;
  has_returns?: boolean;
  refund_info?: string;
  return_items_map?: Record<string, unknown>;
  cart?: {
    id: string;
    order?: { total: number; id: string };
  };
  metadata?: { total?: number };
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface PaymentMethodConfig {
  razorpay_id?: string;
  razorpay_secret?: string;
}

export interface PaymentMethod {
  id: string;
  method: string;
  config?: PaymentMethodConfig;
  is_active?: boolean;
}

// ─── API Hook Types ───────────────────────────────────────────────────────────
export interface ApiError {
  status?: number;
  message?: string;
}
