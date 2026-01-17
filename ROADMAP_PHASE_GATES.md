# Roadmap Phase Gates: Moving to Automated Payments

This document defines the requirements for transitioning the Mai Inji platform from **WhatsApp-First** (Phase J4) to **Integrated Payments & Backend Fulfillment** (Phase J7).

## The Strategy
We lead with **Trust** (WhatsApp) until **Operations** (Staff/Logistics) are ready for **Automation** (Payments).

---

## Gate 1: Operational Stability (The "Human" Phase)
**Current State (Phase J4/J5)**
- All orders via WhatsApp.
- Cash or manual transfer on delivery.
- Staff records orders manually.

### Metrics to Clear Gate 1:
- [ ] **Volume:** Consistent 10+ orders per day for 14 consecutive days.
- [ ] **Reliability:** < 5% order cancellation/error rate.
- [ ] **Capacity:** Average response time on WhatsApp < 3 minutes during peak hours.
- [ ] **Feedback:** Positive "Trust" scores from initial customers regarding the WhatsApp flow.

---

## Gate 2: Technical & Logistics Readiness
**Status: Transitioning to Phase J7**
Once Gate 1 is cleared, we perform the following before turning on the "Pay" button:

### Requirements:
- [ ] **Staff Training:** Fulfillment team trained on using the Admin Dashboard.
- [ ] **Logistics Integration:** Reliable delivery partner confirmed and active.
- [ ] **Backend Hardening:** Final load test of the Express backend and PostgreSQL DB.
- [ ] **Paystack Audit:** Final verification of secret keys and webhook endpoints.

---

## Gate 3: Activation (Go-Live)
**Final Switch:**
1. Flip the feature flag `ENABLE_ONLINE_PAYMENTS` to `true`.
2. Update `CheckoutForm` to route to API instead of WhatsApp.
3. Monitor real-time analytics for payment conversion.

> [!IMPORTANT]
> Do not rush into Gate 3. A failed payment experience is harder to recover from than a manual WhatsApp conversation.
