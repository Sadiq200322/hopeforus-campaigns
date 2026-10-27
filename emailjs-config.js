// EmailJS config for HopeForUs verification codes
// 1. Sign up free: https://www.emailjs.com/
// 2. Add an Email Service (Gmail recommended)
// 3. Create a template with variables: {{to_email}}, {{otp_code}}, {{user_name}}, {{site_name}}
// 4. Paste your IDs below (Account → API Keys for public key)
// The signup flow in start-flow.js already sends and verifies the code.

window.HOPEFORUS_EMAILJS = {
  publicKey: "YOUR_PUBLIC_KEY",
  serviceId: "YOUR_SERVICE_ID",
  templateId: "YOUR_TEMPLATE_ID"
};
