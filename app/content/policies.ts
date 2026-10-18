// Legal pages, written in Markdown. The same source renders the HTML page and
// the machine-readable .md version.

export type Policy = {
  slug: string;
  title: string;
  /** Page <title> and .md heading. */
  metaTitle: string;
  description: string;
  heading: string;
  lastUpdated?: string;
  /** "centered" matches the original Return Policy page layout. */
  layout: "centered" | "document";
  body: string;
  related?: { label: string; slug: string }[];
};

const returnPolicy: Policy = {
  slug: "return-policy",
  title: "Return Policy",
  metaTitle: "Return Policy",
  description:
    "Learn about Cakely's return and refund policy for our fresh cakes in a jar, in line with Dutch and EU consumer law",
  heading: "Return & Refund Policy",
  layout: "centered",
  body: `At Cakely, every cake in a jar is baked fresh to order with love and care. Because our products are perishable foodstuffs, specific rules apply to returns under Dutch and EU consumer law.

**No right of withdrawal on our cakes**

In accordance with Article 6:230p of the Dutch Civil Code (Burgerlijk Wetboek), the statutory 14-day right of withdrawal does not apply to:

- Products that are perishable or have a limited shelf life;
- Products that have been sealed for reasons of health protection or hygiene and have been unsealed after delivery;
- Products made to the consumer's specifications or clearly personalised (e.g. custom messages, flavours, or designs).

Because our cakes in a jar fall into these categories, we are unable to accept returns or offer refunds once an order has been placed and prepared, except in the cases described below.

**When you are entitled to a refund or replacement**

We stand fully behind the quality of our products. Please contact us within 24 hours of delivery at contact@trycakely.com if:

- Your order arrives damaged, leaking, or in unsuitable condition;
- You received the wrong product or flavour;
- The product shows clear defects in quality or freshness on arrival.

To help us resolve the issue quickly, please include your order number and clear photos of the product and packaging. If your complaint is justified, we will offer you — at your choice — a replacement on the next delivery date or a full refund of the affected items, including any shipping costs paid.

**CANCELLATIONS BEFORE PREPARATION**

You may cancel or modify your order free of charge up to [e.g. 48 hours] before the scheduled delivery or pickup date, as long as we have not yet started preparing your cakes. After that point, cancellation is no longer possible because ingredients have been purchased and baking has begun.

**REFUNDS**

Approved refunds are processed to your original payment method within 14 days of our confirmation.

**Questions or complaints**

If you are not satisfied with how your complaint has been handled, you can also submit it via the European Commission's online dispute resolution platform at [https://ec.europa.eu/consumers/odr](https://ec.europa.eu/consumers/odr).`,
};

const terms: Policy = {
  slug: "terms",
  title: "Terms of Service",
  metaTitle: "Terms of Service",
  description: "The terms that apply when you use the Cakely website and order our cakes in a jar.",
  heading: "Terms of Service",
  lastUpdated: "October 18, 2026",
  layout: "document",
  related: [{ label: "Privacy Policy", slug: "privacy" }],
  body: `By accessing or using Cakely ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.

## 1. Use of the Platform

You may use the Platform solely for lawful purposes and in accordance with these Terms. You agree not to:

- Use the Platform in any way that violates applicable laws or regulations.
- Attempt to gain unauthorized access to any part of the Platform.
- Interfere with or disrupt the Platform or its servers.
- Use automated tools to scrape or collect data from the Platform without permission.

## 2. Customer Information

When you place an order, you are responsible for providing accurate and complete information, including your contact details and delivery address.

## 3. Products and Orders

All products listed on the Platform are subject to availability. We reserve the right to limit quantities, refuse orders, or cancel orders at our discretion. Prices are subject to change without notice.

Once an order is placed, you will receive a confirmation. This confirmation does not guarantee acceptance of your order. We reserve the right to cancel any order due to pricing errors, stock issues, or suspected fraud.

## 4. Payment

Payment must be made using the available payment methods. You agree to provide valid payment information. All transactions are processed securely through our payment providers.

## 5. Shipping and Delivery

Delivery times are estimates and are not guaranteed. We are not responsible for delays caused by carriers, customs, or circumstances beyond our control. Risk of loss passes to you upon delivery.

## 6. Returns and Refunds

Returns and refunds are handled in accordance with our [return policy](/return-policy). We reserve the right to refuse returns that do not meet our requirements.

## 7. Intellectual Property

All content on the Platform, including text, graphics, logos, images, and software, is the property of Cakely or its licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without express written consent.

## 8. Limitation of Liability

To the maximum extent permitted by law, Cakely shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform. Our total liability shall not exceed the amount you paid for the specific product or service giving rise to the claim.

## 9. Disclaimer

The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.

## 10. Changes to Terms

We reserve the right to modify these Terms at any time. Changes will be effective upon posting to the Platform. Your continued use of the Platform after changes constitutes acceptance of the revised Terms.

## 11. Governing Law

These Terms are governed by and construed in accordance with the laws of the Netherlands, without regard to conflict of law principles.

## 12. Contact

If you have questions about these Terms, please contact us at contact@trycakely.com.`,
};

const privacy: Policy = {
  slug: "privacy",
  title: "Privacy Policy",
  metaTitle: "Privacy Policy",
  description: "How Cakely collects, uses and protects your personal information.",
  heading: "Privacy Policy",
  lastUpdated: "October 18, 2026",
  layout: "document",
  related: [{ label: "Terms of Service", slug: "terms" }],
  body: `This Privacy Policy describes how Cakely (the "Store", "we", "us", or "our") collects, uses, and shares your personal information when you visit or make a purchase from our website (the "Site").

Our online store and checkout are operated using **Hostinger**, an e-commerce platform that provides the technology, hosting, and infrastructure to process orders. Hostinger acts as a data processor on behalf of Cakely and processes your data solely in accordance with our instructions. Cakely, as the store operator, is the data controller and determines the purposes and means of processing your personal information.

## Collecting Personal Information

When you visit the Site, we collect certain information about your device, your interaction with the Site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support. In this Privacy Policy, we refer to any information that can uniquely identify an individual (including the information below) as "Personal Information". See the list below for more information about what Personal Information we collect and why.

### Device Information

- **Purpose of collection:** To load the Site accurately for you, to perform analytics on Site usage to optimize our Site, and to screen for potential risk and fraud.
- **Source of collection:** Collected automatically when you access our Site using cookies, log files, web beacons, tags, or pixels.
- **Information collected:** Version of web browser, IP address, time zone, cookie information, what sites or products you view, search terms, and how you interact with the Site.
- **Disclosure for a business purpose:** Shared with our e-commerce platform provider (Hostinger) and analytics providers.

### Order Information

- **Purpose of collection:** To provide products or services to you to fulfill our contract, to process your payment information, arrange for shipping, and provide you with invoices and/or order confirmations, communicate with you, screen orders for potential risk or fraud, and when in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.
- **Source of collection:** Collected from you.
- **Information collected:** Name, billing address, shipping address, payment information, email address, and phone number.
- **Disclosure for a business purpose:** Shared with our e-commerce platform provider (Hostinger), payment processors, and shipping carriers.

### Customer Support Information

- **Purpose of collection:** To provide customer support, respond to your inquiries, resolve issues, and improve our support services.
- **Source of collection:** Collected from you.
- **Information collected:** Name, email address, phone number, and the contents of your message or any attachments you send us.
- **Disclosure for a business purpose:** Not shared, except where needed to resolve your request.

## Minors

The Site is not intended for individuals under the age of 18. We do not intentionally collect Personal Information from children under the age of 18. If you are the parent or guardian and believe your child has provided us with Personal Information, please contact us at the address below to request deletion.

## How We Use Your Personal Information

We use the Personal Information we collect to provide our services to you, which includes: offering products for sale, processing payments, shipping and fulfilling your order, and keeping you up to date on new products, services, and offers.

### Providing Products and Services

We use your Personal Information to provide you with our services, including to process your payments, fulfill your orders, send you notifications related to your purchases, returns, exchanges, or other transactions, arrange for shipping, and facilitate any returns and exchanges.

### Marketing and Advertising

We may use your Personal Information to provide you with marketing and promotional communications where permitted by law. This includes using your information to market our products or services to you, and to display targeted advertisements to you. For information on how to opt out, please see the "Your Rights" section below.

### Security and Fraud Prevention

We use your Personal Information to screen our orders for potential risk and fraud (in particular, your IP address), to detect and prevent fraudulent transactions and other illegal activities, and to protect the rights and property of Cakely, our customers, and others.

### Communication and Improvement

We use your Personal Information to communicate with you, to provide you with information or advertising relating to our products or services, to optimize and improve our Site (for example, by generating analytics about how our customers browse and interact with the Site), and to assess the success of our marketing and advertising campaigns.

## Sharing Your Personal Information

We share your Personal Information with service providers to help us provide our services and fulfill our contracts with you, as described above.

- **E-commerce platform:** We use Hostinger as our e-commerce platform. Hostinger provides the technology and infrastructure that powers our checkout, including data storage and order processing. Your data may be stored and processed through Hostinger's servers and infrastructure.
- **Payment processors:** We share your Order Information with payment processors to facilitate transactions.
- **Shipping carriers:** We share your shipping address and contact details with carriers to deliver your orders.
- **Analytics providers:** We may use Google Analytics to help us understand how our customers use the Site. You can read more about how Google uses your Personal Information at [google.com/intl/en/policies/privacy](https://www.google.com/intl/en/policies/privacy/). You can also opt out of Google Analytics at [tools.google.com/dlpage/gaoptout](https://tools.google.com/dlpage/gaoptout).
- **Email delivery services:** Transactional emails such as order confirmations and shipping updates are sent through our e-commerce platform or email providers, which may have access to your email address and order details.

We may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant, or other lawful request for information we receive, or to otherwise protect our rights.

## Behavioral Advertising

As described above, we may use your Personal Information to provide you with targeted advertisements or marketing communications we believe may be of interest to you. For more information about how targeted advertising works, you can visit the Network Advertising Initiative's educational page at [networkadvertising.org/understanding-online-advertising/how-does-it-work](https://www.networkadvertising.org/understanding-online-advertising/how-does-it-work).

You can opt out of targeted advertising by visiting:

- Facebook: [facebook.com/settings/?tab=ads](https://www.facebook.com/settings/?tab=ads)
- Google: [google.com/settings/ads/anonymous](https://www.google.com/settings/ads/anonymous)
- Digital Advertising Alliance: [optout.aboutads.info](https://optout.aboutads.info/)

## Data Retention

When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information. Order records may be retained as required by applicable tax, accounting, and other legal obligations, even after you request deletion.

Device Information is generally retained for a limited period (typically up to 26 months) for analytics and fraud prevention purposes, after which it is automatically deleted or anonymized.

## Your Rights

### GDPR Rights (European Residents)

If you are a resident of the European Economic Area (EEA), the United Kingdom, or Switzerland, you have certain data protection rights under the General Data Protection Regulation (GDPR). We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Information.

We process your information in order to fulfill contracts we might have with you (for example, if you make an order through the Site), or otherwise to pursue our legitimate business interests listed above. Please note that your information may be transferred outside of Europe, including to the United States and other countries where data protection laws may differ.

Under the GDPR, you have the following rights regarding your personal data:

- **Right of Access:** You have the right to request a copy of the personal data we hold about you.
- **Right to Rectification:** You have the right to request that we correct any inaccurate or incomplete personal data.
- **Right to Erasure:** You have the right to request that we delete your personal data, subject to certain legal retention requirements.
- **Right to Restrict Processing:** You have the right to request that we limit how we use your personal data in certain circumstances.
- **Right to Data Portability:** You have the right to receive your personal data in a structured, commonly used, and machine-readable format and to transfer it to another controller.
- **Right to Object:** You have the right to object to processing of your personal data based on legitimate interests or for direct marketing purposes.
- **Right to Withdraw Consent:** Where processing is based on your consent, you may withdraw that consent at any time without affecting the lawfulness of processing carried out prior to withdrawal.
- **Right to Complain:** You have the right to lodge a complaint with a data protection authority in your country of residence if you believe we have violated your data protection rights.

To exercise any of these rights, please contact us using the information provided in the "Contact Us" section below. We will respond to your request within 30 days.

### CCPA Rights (California Residents)

If you are a California resident, the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA) grant you specific rights regarding your personal information:

- **Right to Know:** You have the right to request that we disclose the categories and specific pieces of personal information we have collected about you, the categories of sources from which we collected it, our business purpose for collecting it, and the categories of third parties with whom we shared it.
- **Right to Delete:** You have the right to request that we delete personal information we have collected from you, subject to certain exceptions (such as data needed to complete a transaction or comply with a legal obligation).
- **Right to Correct:** You have the right to request correction of inaccurate personal information.
- **Right to Opt Out of Sale:** We do not sell your personal information as defined under the CCPA. If this practice changes in the future, we will update this policy and provide you with an opt-out mechanism.
- **Right to Non-Discrimination:** We will not discriminate against you for exercising any of your CCPA rights. We will not deny you goods or services, charge different prices, or provide a different level of quality for exercising your rights.

To exercise any of these rights, please contact us using the information provided below. We will verify your identity before processing your request and respond within 45 days.

## Cookies

A cookie is a small amount of information that is downloaded to your computer or device when you visit our Site. We use a number of different cookies, including functional, performance, advertising, and social media or content cookies.

Cookies make your browsing experience better by allowing the website to remember your actions and preferences (such as the contents of your basket and your cookie choices). This means you do not have to re-enter this information each time you return to the Site or browse from one page to another.

The length of time that a cookie remains on your computer or mobile device depends on whether it is a "persistent" or "session" cookie. Session cookies last until you stop browsing, and persistent cookies last until they expire or are deleted. Most of the cookies we use are persistent and will expire between 30 minutes and two years from the date they are downloaded to your device.

You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can negatively impact your user experience and parts of our Site may no longer be fully accessible. Most browsers automatically accept cookies, but you can choose whether or not to accept cookies through your browser controls, often found in your browser's "Tools" or "Preferences" menu. For more information on how to modify your browser settings or how to block, manage, or filter cookies, you can visit your browser's help file or sites like [allaboutcookies.org](https://www.allaboutcookies.org).

## Do Not Track

Please note that we do not alter our Site's data collection and use practices when we see a Do Not Track signal from your browser. If you are a European resident, note that under GDPR you have the right to object to processing. Please refer to the "Your Rights" section above.

## Changes to This Privacy Policy

We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new privacy policy on this page and updating the "Last updated" date at the top. We encourage you to review this page periodically for the latest information on our privacy practices.

## Contact Us

For more information about our privacy practices, if you have questions, or if you would like to make a complaint or exercise any of your rights described above, please contact us at contact@trycakely.com.

If you are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
};

export const policies: Record<string, Policy> = {
  "return-policy": returnPolicy,
  terms,
  privacy,
};
