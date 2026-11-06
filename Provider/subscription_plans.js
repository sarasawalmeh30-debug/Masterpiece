// Select pricing from the saved account type so onboarding and checkout stay aligned.
let providerAccountType = "individual";
try {
    const providerProfile = JSON.parse(localStorage.getItem("teamlyProviderProfile") || "null");
    if (providerProfile && (providerProfile.providerType === "company" || providerProfile.accountType === "company" || providerProfile.companyName)) providerAccountType = "company";
} catch (error) { /* Use individual pricing if the saved profile cannot be read. */ }

window.TEAMLY_PROVIDER_ACCOUNT_TYPE = providerAccountType;
window.TEAMLY_PROVIDER_PLANS = providerAccountType === "company" ? {
    free: { id: "free", name: "Free", price: 0, currency: "USD", billing: "month" },
    professional: { id: "professional", name: "Professional", price: 19.99, currency: "USD", billing: "month" },
    business: { id: "business", name: "Business", price: 29.99, currency: "USD", billing: "month" }
} : {
    free: { id: "free", name: "Free", price: 0, currency: "USD", billing: "month" },
    professional: { id: "professional", name: "Professional", price: 9.99, currency: "USD", billing: "month" },
    business: { id: "business", name: "Business", price: 14.99, currency: "USD", billing: "month" }
};
