import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Lock, Check, Loader2, Crown, SmartphoneNfc } from "lucide-react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { useToast } from "../../ui";
import { ToastBanner } from "../../ui/Toest.tsx";
import { useAuthStore } from "../../context/authStore.ts";
import { Button, Label } from "../../ui/UI.tsx";
import { userService } from "../../context/authService.ts";
import type {
  SubscriptionPlan,
  UserWithAttemptSummary,
} from "../../hooks/Utils.ts";

// ─── Plan display config ──────────────────────────────────────────────────────
// Only paid, purchasable plans belong here — 'free' and 'basic' aren't sold
// through this checkout flow.
type PurchasablePlan = Extract<SubscriptionPlan, "pro" | "unlimited">;

interface PlanDisplay {
  name: string;
  detail: string;
  price: number;
  currency: string;
}

const PLAN_DISPLAY: Record<PurchasablePlan, PlanDisplay> = {
  pro: {
    name: "AILA Pro — Annual",
    detail: "Full access to all mock tests, AI writing feedback & speaking simulation",
    price: 49.0,
    currency: "USD",
  },
  unlimited: {
    name: "AILA Ultimate — Annual",
    detail: "Everything in Pro, plus live tutor sessions, custom study plan & priority support",
    price: 99.0,
    currency: "USD",
  },
};

type MobileMoneyProvider = "orange" | "mtn";

interface MobileMoneyConfig {
  label: string;
  recipientNumber: string;
  message: string;
}

const MOBILE_MONEY_PROVIDERS: Record<MobileMoneyProvider, MobileMoneyConfig> = {
  orange: {
    label: "Orange Money",
    recipientNumber: "899", // Orange Cameroon merchant shortcode
    message: "PAY ORANGE",
  },
  mtn: {
    label: "MTN Mobile Money",
    recipientNumber: "150", // MTN MoMo merchant shortcode
    message: "PAY MOMO",
  },
};

//const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const CLIENT_ID = "AQyxBCbBLby0nOujwMti8vBFPK442iBNZwXkCtEF9CaWOXPGTgbyVWbnek3ZuKM-prPeXfXLyMS8Yyyj";

function isPurchasablePlan(value: string | null): value is PurchasablePlan {
  return value === "pro" || value === "unlimited";
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const planId: PurchasablePlan = isPurchasablePlan(requestedPlan) ? requestedPlan : "pro";
  const PLAN = PLAN_DISPLAY[planId];

  const navigate = useNavigate();
  const { toast, dismiss, success, error } = useToast();
  const user = useAuthStore((s) => s.user) as UserWithAttemptSummary | null;
  const [done, setDone] = useState(false);
  const [processing, setProcessing] = useState(false);


  const otherMethodsDialogRef = useRef<HTMLDialogElement>(null);

  const planLabel = (tier?: SubscriptionPlan): string =>
    tier === "unlimited" ? "Ultimate" : "Pro";

  // Already subscribed guard
  if (user?.is_subscription && !done) {
    return (
      <div className="min-h-120 flex items-center justify-center bg-base-100 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-amber-300 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">
            You're already on AILA {planLabel(user.subscription)}
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Your subscription is active — you have full access to all features.
            {user.subscription_expires_at && (
              <>
                {" "}Renews on{" "}
                <span className="font-medium text-[#1A1A2E]">
                  {new Date(user.subscription_expires_at).toLocaleDateString()}
                </span>
                .
              </>
            )}
          </p>
          <Button label="Go to dashboard" onClick={() => navigate("/dashboard")} variant="submit" />
        </div>
      </div>
    );
  }

  // Configuration guard
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

  // Success screen layout
  if (done) {
    return (
      <div className="min-h-120 flex items-center justify-center bg-base-100 p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E7E3DC] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F7EF]">
            <Check className="h-6 w-6 text-[#1B8A4B]" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Payment complete</h2>
          <p className="mt-1 text-sm text-[#6B7280]">You're now on {PLAN.name}. Enjoy full access.</p>
          <Button label="Go to dashboard" onClick={() => navigate("/dashboard")} variant="submit" />
        </div>
      </div>
    );
  }

  const sendMobileMoneySMS = (provider: MobileMoneyProvider): void => {
    const { recipientNumber, message } = MOBILE_MONEY_PROVIDERS[provider];
    const messageBody = encodeURIComponent(message);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS
      ? `sms:${recipientNumber}&body=${messageBody}`
      : `sms:${recipientNumber}?body=${messageBody}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-6 font-serif">
      <ToastBanner toast={toast} onDismiss={dismiss} />
      <header
        className="w-full max-w-xl bg-slate-950/20 border-slate-900 text-white rounded-2xl
                  border shadow-md shadow-slate-500/20 overflow-hidden"
      >
        {/* Expired-subscription notice */}
        {user?.subscription && user.subscription !== "free" && (
          <div className="px-6 pt-4 text-sm text-rose-300">
            Your AILA {planLabel(user.subscription)} subscription has expired. Renew below to restore full access.
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

        {/* PayPal Injection Area */}
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
              planId={planId}
              planName={PLAN.name}
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

        {/* Alternative Local Mobile Payments Drawer/Dialog */}
        <div className="w-full h-10 bg-base-200/90 rounded-b-2xl flex items-center justify-center">
          <Button
            label="Other payment methods"
            icon={<SmartphoneNfc />}
            onClick={() => otherMethodsDialogRef.current?.showModal()}
            variant="ghost"
          />

          <dialog ref={otherMethodsDialogRef} className="modal">
            <div className="modal-box w-full">
              <Label>Other payment methods</Label>
              <div className="w-full items-center justify-center flex gap-3 pt-10">
                <Button
                  label={MOBILE_MONEY_PROVIDERS.orange.label}
                  variant="gold"
                  onClick={() => sendMobileMoneySMS("orange")}
                />
                <Button
                  label={MOBILE_MONEY_PROVIDERS.mtn.label}
                  variant="gold"
                  onClick={() => sendMobileMoneySMS("mtn")}
                />
                <Button
                  label="Or contact the support team"
                  variant="ghost"
                  onClick={() => navigate("/chat")}
                />
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button type="submit">close</button>
            </form>
          </dialog>
        </div>
      </header>
    </div>
  );
}

// ─── PayPal button area ───────────────────────────────────────────────────────

interface CreateOrderResponse {
  id: string;
}

interface CaptureOrderResponse {
  success: boolean;
}

interface PayPalAreaProps {
  planId: PurchasablePlan;
  planName: string;
  processing: boolean;
  setProcessing: (v: boolean) => void;
  onPaid: () => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
}

function PayPalArea({
  planId,
  planName,
  processing,
  setProcessing,
  onPaid,
  success,
  error,
}: PayPalAreaProps) {
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
          const res: CreateOrderResponse = await userService.createOrder({ planId });
          
          return res.id;
        }}
        onApprove={async (data) => {
          setProcessing(true);
          try {
            const res: CaptureOrderResponse = await userService.captureOrder({
              orderId: data.orderID,
            });
            
            if (res?.success) {
              // Refresh subscription state directly via store mutation
              await useAuthStore.getState().checkSession();
              success(`Payment successful — welcome to ${planName}!`);
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