// Public-facing payment config — what the customer needs to know to pay:
// payment mode, bank accounts, QRIS image, midtrans client key.
// Server-side secrets stay private.
import { ok, requireAuth } from "@/lib/api";
import { loadSettings } from "@/lib/settings";

export const GET = await requireAuth()(async () => {
  const s = await loadSettings();
  return ok({
    paymentMode: s.paymentMode,
    bankAccounts: s.bankAccounts,
    qrisStaticImageUrl: s.qrisStaticImageUrl,
    qrisMerchantName: s.qrisMerchantName,
    qrisMerchantId: s.qrisMerchantId,
    midtransClientKey: s.midtransClientKey,
    midtransProduction: s.midtransProduction,
    eSignAutoEnabled: s.eSignAutoEnabled,
  });
});
