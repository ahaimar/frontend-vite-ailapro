import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, Check, Loader2, Crown } from "lucide-react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import api from "../../lib/axios.ts";
import { useToast } from "../../ui";
import { ToastBanner } from "../../ui/Toest.tsx";
import { useAuthStore } from "../../context/authStore.ts";

/**
 * PaymentCheckout — upgrade the logged-in user to AILA Pro via PayPal.
 *
 * In-page SDK flow (no redirect):
 *   createOrder  -> POST /payments/create-order   (server sets the price)
 *   onApprove    -> POST /payments/capture-order  (server captures + upgrades)
 * The displayed price is for UX only; the charged amount is authoritative on
 * the server (see backend/src/config/plans.js).
 */

// Display-only summary — must mirror backend plans.js (`pro`).
const PLAN = {
  name: "AILA Pro — Annual",
  detail: "Full access to all mock tests, AI writing feedback & speaking simulation",
  price: 49.0,
  currency: "USD",
};

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const { toast, dismiss, success, error } = useToast();
  const user = useAuthStore((s) => s.user);
  const [done, setDone] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Already subscribed — don't show checkout again.
  if (user?.is_subscription && !done) {
    return (
      <div className="min-h-120 flex items-center justify-center bg-base-100 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-amber-300 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">You're already on AILA Pro</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Your subscription is active — you have full access to all features.
            {user?.subscription_expires_at && (
              <>
                {" "}Renews on{" "}
                <span className="font-medium text-[#1A1A2E]">
                  {new Date(user.subscription_expires_at).toLocaleDateString()}
                </span>
                .
              </>
            )}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 w-full rounded-lg bg-[#635BFF] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  // Mirror the GoogleSignInButton guard — show a clear message instead of a
  // blank/broken button when the client id isn't configured.
  if (!CLIENT_ID) {
    return (
      <div className="min-h-120 flex items-center justify-center bg-base-100 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-rose-300 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">Payments are not configured.</p>
          <p className="mt-1 text-xs text-rose-600">
            VITE_PAYPAL_CLIENT_ID is missing. Set it in frontend/.env and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-120 flex items-center justify-center bg-base-100 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E7E3DC] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F7EF]">
            <Check className="h-6 w-6 text-[#1B8A4B]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Payment complete</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            You're now on {PLAN.name}. Enjoy full access.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 w-full rounded-lg bg-[#635BFF] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6 font-serif">
      <ToastBanner toast={toast} onDismiss={dismiss} />

      <header
        className="w-full max-w-xl bg-slate-950/20 border-slate-900 text-white rounded-2xl
                   border shadow-md shadow-slate-500/20 overflow-hidden"
      >
        {/* Expired-subscription notice — renew to regain access. */}
        {user?.subscriptionExpiresAt && (
          <div className="px-6 pt-4 text-sm text-rose-300">
            Your AILA Pro subscription has expired. Renew below to restore full access.
          </div>
        )}

        {/* Order summary */}
        <div className="px-6 pt-6 pb-5 border-b border-[#EFEBE3]">
          <h2 className="text-base font-semibold capitalize">Order summary</h2>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-white">{PLAN.name}</p>
                <p className="text-xs text-lime-300">{PLAN.detail}</p>
              </div>
              <p className="text-white">${PLAN.price.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#EFEBE3] flex justify-between">
            <p className="text-sm font-semibold text-white">Total due today</p>
            <p className="text-sm font-semibold text-white">${PLAN.price.toFixed(2)}</p>
          </div>
        </div>

        {/* PayPal */}
        <div className="px-6 pt-5 pb-6">
          <p className="text-sm font-medium text-white mb-3">Pay with PayPal</p>

          {processing && (
            <div className="mb-3 flex items-center gap-2 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalising your payment…
            </div>
          )}

          <PayPalScriptProvider
            options={{
              clientId: CLIENT_ID,
              currency: PLAN.currency,
              intent: "capture",
            }}
          >
            <PayPalArea
              processing={processing}
              onPaid={() => setDone(true)}
              setProcessing={setProcessing}
              success={success}
              error={error}
            />
          </PayPalScriptProvider>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#9CA3AF]">
            <Lock className="h-3 w-3" />
            Payments are encrypted and securely processed by PayPal
          </p>
        </div>
      </header>
    </div>
  );
}

/**
 * Renders the PayPal buttons and, crucially, surfaces the SDK script load state
 * (loading / rejected) so the button area is never just silently blank.
 * Must be a child of PayPalScriptProvider to use usePayPalScriptReducer.
 */
function PayPalArea({
  processing,
  setProcessing,
  onPaid,
  success,
  error,
}: {
  processing: boolean;
  setProcessing: (v: boolean) => void;
  onPaid: () => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-300">
        Could not load PayPal. Check the client ID / network and try again.
      </div>
    );
  }

  return (
    <>
      {isPending && (
        <div className="mb-3 flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading PayPal…
        </div>
      )}
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "paypal" }}
        disabled={processing}
        forceReRender={[processing]}
        createOrder={async () => {
          const { data } = await api.post("/payments/create-order", { planId: "pro" });
          return data.id;
        }}
        onApprove={async (data) => {
          setProcessing(true);
          try {
            const res = await api.post("/payments/capture-order", {
              orderId: data.orderID,
            });
            if (res.data?.success) {
              // Refresh subscription state so gated content unlocks.
              await useAuthStore.getState().checkSession();
              success("Payment successful — welcome to AILA Pro!");
              onPaid();
            } else {
              error("Payment could not be completed. Please try again.");
            }
          } catch {
            error("Payment failed. Please try again.");
          } finally {
            setProcessing(false);
          }
        }}
        onError={() => {
          error("Something went wrong with PayPal. Please try again.");
        }}
        onCancel={() => {
          error("Payment cancelled.");
        }}
      />
    </>
  );
}