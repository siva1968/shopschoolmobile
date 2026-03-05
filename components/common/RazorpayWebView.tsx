/**
 * RazorpayWebView
 *
 * Replicates the medusafront Razorpay flow:
 *   1. Loads checkout.razorpay.com/v1/checkout.js inside a WebView
 *   2. Opens the Razorpay modal automatically via window.Razorpay
 *   3. Sends the result back to RN via window.ReactNativeWebView.postMessage
 *
 * Key Android fix: intent:// and UPI deep-links (phonepe://, gpay://, etc.)
 * are intercepted via onShouldStartLoadWithRequest and opened with Linking,
 * so UPI apps can launch without crashing the WebView.
 */

import React from "react";
import { Linking, Modal, StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView, WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton, Text } from "react-native-paper";
import { COLORS } from "../../constants/theme";

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayWebViewProps {
  visible: boolean;
  options: {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: { color?: string };
  };
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss: () => void;
  onError: (description: string) => void;
}

function buildHtml(options: RazorpayWebViewProps["options"]): string {
  const safeOptions = JSON.stringify(options);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
    }
    #loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #ddd;
      border-top-color: #1976d2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #555; font-size: 15px; }
  </style>
</head>
<body>
  <div id="loader">
    <div class="spinner"></div>
    <p>Opening payment…</p>
  </div>
  <script>
  (function () {
    function postMsg(obj) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }

    function loadScript(src, cb) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = cb;
      s.onerror = function () {
        postMsg({ type: 'error', data: 'Failed to load Razorpay SDK. Check your network.' });
      };
      document.head.appendChild(s);
    }

    loadScript('https://checkout.razorpay.com/v1/checkout.js', function () {
      var opts = ${safeOptions};

      opts.handler = function (response) {
        postMsg({ type: 'success', data: response });
      };

      opts.modal = {
        ondismiss: function () {
          postMsg({ type: 'dismiss' });
        }
      };

      try {
        var rzp = new Razorpay(opts);

        rzp.on('payment.failed', function (resp) {
          postMsg({
            type: 'error',
            data: (resp && resp.error && resp.error.description) || 'Payment failed'
          });
        });

        rzp.open();
        // Notify RN that Razorpay opened so spinner can hide
        postMsg({ type: 'opened' });
      } catch (e) {
        postMsg({ type: 'error', data: (e && e.message) || 'Failed to open Razorpay' });
      }
    });
  })();
  </script>
</body>
</html>`;
}

// URL schemes that belong to UPI / payment apps on Android.
// These must be opened via Linking, not handled inside WebView.
// (intent://, upi://, phonepe://, gpay://, paytm://, etc.)
function isExternalUrl(url: string): boolean {
  if (url.startsWith("http://") || url.startsWith("https://")) return false;
  if (url.startsWith("data:") || url === "about:blank") return false;
  return true;
}

export default function RazorpayWebView({
  visible,
  options,
  onSuccess,
  onDismiss,
  onError,
}: RazorpayWebViewProps) {
  // loading stays true until we get the 'opened' message from JS
  const [loading, setLoading] = React.useState(true);

  // Reset loading state each time the modal opens
  React.useEffect(() => {
    if (visible) setLoading(true);
  }, [visible]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: "success" | "dismiss" | "error" | "opened";
        data?: RazorpaySuccessResponse | string;
      };

      if (msg.type === "opened") {
        setLoading(false);
      } else if (msg.type === "success") {
        setLoading(false);
        onSuccess(msg.data as RazorpaySuccessResponse);
      } else if (msg.type === "dismiss") {
        setLoading(false);
        onDismiss();
      } else if (msg.type === "error") {
        setLoading(false);
        onError(typeof msg.data === "string" ? msg.data : "Payment failed");
      }
    } catch {
      onError("Unexpected error during payment");
    }
  };

  // Intercept navigation requests.
  // UPI / intent URLs must be opened via Android Linking, not inside WebView.
  const handleShouldStartLoad = (request: WebViewNavigation): boolean => {
    const url = request.url;
    if (isExternalUrl(url)) {
      Linking.openURL(url).catch((err) => {
        console.warn("[RazorpayWebView] Could not open URL:", url, err);
      });
      return false; // block inside WebView
    }
    return true; // allow http/https
  };

  const html = React.useMemo(() => buildHtml(options), [
    options.key,
    options.amount,
    options.currency,
    options.order_id,
  ]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
          <IconButton
            icon="close"
            size={22}
            iconColor={COLORS.textPrimary}
            onPress={onDismiss}
          />
        </View>

        <View style={styles.webviewContainer}>
          <WebView
            style={styles.webview}
            source={{ html }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            // ← key fix: route intent/upi/deeplink URLs to Linking
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onError={(e) => {
              console.error("[RazorpayWebView] WebView error:", e.nativeEvent);
              onError("Payment page failed to load. Please try again.");
            }}
            onHttpError={(e) => {
              console.warn("[RazorpayWebView] HTTP error:", e.nativeEvent.statusCode);
            }}
          />

          {/* Spinner overlay — visible until JS posts 'opened' */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading payment gateway…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  webviewContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
