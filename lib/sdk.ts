import Medusa from "@medusajs/js-sdk";


const backendUrl = "http://192.168.68.63:9000";
const publishableKey = "pk_691e97d445f4f8ee73b810dfe3a19438941890e3ddad2f495c919e600f5278d8";

export const sdk = new Medusa({
  baseUrl: backendUrl,
  debug: __DEV__,
  // if possible, insert portal based publishable key
  publishableKey: publishableKey,
  auth: {
    type: "jwt",
  },
});
