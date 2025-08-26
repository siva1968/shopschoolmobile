enum Prefix {
  STORE = "/store",
}

export const Endpoint = {
  customer: `${Prefix.STORE}/customers/me`,
  customer_reset_password: `${Prefix.STORE}/customers/reset-password`,
  categories: `${Prefix.STORE}/categories`,
  addresses: `${Prefix.STORE}/customers/addresses`,
  cart: `${Prefix.STORE}/carts`,
  cart_address: (cart_id: string) => `${Prefix.STORE}/carts/${cart_id}/address`,
  line_items: (cart_id: string) =>
    `${Prefix.STORE}/carts/${cart_id}/line-items`,
  orders: `${Prefix.STORE}/orders`,
  payments: `${Prefix.STORE}/payments`,
  payment_methods: `${Prefix.STORE}/payment-methods`,
  regions: `${Prefix.STORE}/regions`,
  cart_line_items: (cart_id: string) =>
    `${Prefix.STORE}/carts/${cart_id}/line-items`,
  line_item_attributes: `${Prefix.STORE}/line-item-attributes`,

  portals: `/public/portals`,
};
