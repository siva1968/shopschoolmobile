const BASE = "";

export const endpoints = {
  // Auth
  customer: `${BASE}/store/customers/me`,
  customerResetPassword: `${BASE}/store/customers/reset-password`,

  // Products
  categories: `${BASE}/store/categories`,
  category: (id: string) => `${BASE}/store/categories/${id}`,

  // Addresses
  addresses: `${BASE}/store/customers/addresses`,
  address: (id: string) => `${BASE}/store/customers/addresses/${id}`,

  // Cart
  carts: `${BASE}/store/carts`,
  cart: (id: string) => `${BASE}/store/carts/${id}`,
  cartClear: (id: string) => `${BASE}/store/carts/${id}/clear`,
  cartAddress: (id: string) => `${BASE}/store/carts/${id}/address`,
  lineItems: (cartId: string) => `${BASE}/store/carts/${cartId}/line-items`,
  lineItem: (cartId: string, itemId: string) =>
    `${BASE}/store/carts/${cartId}/line-items/${itemId}`,

  // Orders
  orders: `${BASE}/store/orders`,
  order: (id: string) => `${BASE}/store/orders/${id}`,

  // Payments
  payments: `${BASE}/store/payments`,
  payment: (id: string) => `${BASE}/store/payments/${id}`,
  paymentStatus: `${BASE}/store/payments/status`,
  paymentMethods: `${BASE}/store/payment-methods`,
  lineItemAttributes: `${BASE}/store/line-item-attributes`,

  // Regions
  regions: `${BASE}/store/regions`,

  // Public (no auth)
  portals: `/public/portals`,
  maintenance: (portalId: string) => `/public/maintenance?portal=${portalId}`,
  student: (enrollmentCode: string) => `/public/student/${enrollmentCode}`,

  // Store — category-filtered product lists
  uniforms: `${BASE}/store/categories?filter=uniforms`,
  kits: `${BASE}/store/categories?filter=kits`,
} as const;
