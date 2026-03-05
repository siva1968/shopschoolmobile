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
  status?: string;
  is_active?: boolean;
  theme?: string;
  domain?: string;
}

// ─── User / Auth ──────────────────────────────────────────────────────────────
export interface StudentProfile {
  father_name?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_email?: string;
  gender?: string;
  hap?: boolean;
  hasdp?: boolean;
  first_term_paid?: boolean;
  house?: string;
  ai?: boolean;
  date_of_admission?: string;
  application_no?: string;
  locality?: string;
  active?: boolean;
  referral_code?: string;
  is_sheffler?: boolean;
  is_staff?: boolean;
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
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  student_enrollment_code?: string;
  student_name?: string;
  portal_id?: string;
  class_id?: string;
  class?: { name: string; id: string };
  section_id?: string;
  section?: { name: string; id: string };
  second_language?: string;
  third_language?: string;
  fourth_language?: string;
  academic_id?: string;
  student_id?: string;
  student_profile?: StudentProfile;
  addresses?: Address[];
  carts?: { id: string }[];
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

export interface Product {
  id: string;
  title: string;
  variants: ProductVariant[];
  categories?: { id: string; name: string }[];
  images?: { url: string }[];
  thumbnail?: string;
}

// ─── Kit ─────────────────────────────────────────────────────────────────────
export interface Kit {
  id: string;
  title: string;
  total: number;
  type: "bundle" | "free";
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
  variant_id: string;
  quantity: number;
  product_id?: string;
  product_title?: string;
  variant_title?: string;
  unit_price: number;
  subtotal: number;
  thumbnail?: string;
  item_type?: "kit" | "uniform";
  class_kit_type?: "bundle" | "free";
  cart_line_item_ids?: string[];
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
