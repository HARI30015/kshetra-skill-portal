// The 50 placement companies, grouped by tier — one source of truth.
// Used by Signup (placement pick at sign-up), Onboarding Step 4, and the
// Dashboard aim-company picker. The adaptive planner reads the same
// company names from the backend COMPANY_TIERS map, so keep the names
// here identical to the backend list.
export const AIM_COMPANY_GROUPS = [
  { tier: "Dream", companies: ["Google", "Microsoft", "Amazon", "Adobe", "Atlassian", "Apple", "NVIDIA", "Rubrik", "Jane Street", "Goldman Sachs", "Uber", "Salesforce", "McKinsey"] },
  { tier: "Top", companies: ["Oracle", "JP Morgan Chase", "Morgan Stanley", "Cisco", "Intel", "Qualcomm", "Samsung", "Flipkart", "Razorpay", "PhonePe", "Postman", "Swiggy", "Zomato", "Meesho", "CRED", "Groww", "Zerodha", "Zepto", "SAP Labs", "ServiceNow", "Walmart Global Tech", "Target India", "Wells Fargo", "Lowe's India"] },
  { tier: "Core", companies: ["Zoho", "Freshworks", "Deloitte", "EY", "PwC", "KPMG"] },
  { tier: "Mass", companies: ["TCS", "Infosys", "Wipro", "HCLTech", "Cognizant", "Accenture", "Capgemini"] },
];
