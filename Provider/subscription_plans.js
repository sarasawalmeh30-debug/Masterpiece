// Shared display configuration for Provider subscription and payment pages.
// Amounts mirror the plans already shown in the existing subscription page.
window.TEAMLY_PROVIDER_PLANS = {
    free: { id: "free", name: "Free", price: 0, currency: "USD", billing: "month" },
    professional: { id: "professional", name: "Professional", price: 9.99, currency: "USD", billing: "month" },
    business: { id: "business", name: "Business", price: 14.99, currency: "USD", billing: "month" }
};
