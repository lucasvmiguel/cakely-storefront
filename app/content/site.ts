import { formatMoney } from "~/lib/money";

// Business details and marketing copy, shared by the HTML pages, the .md
// pages and the structured data so they never drift apart.

export const site = {
  name: "Cakely",
  description:
    "Cakely is an artisan bakery in Amsterdam making premium mini layer cakes, freshly made and delivered straight to your door.",
  email: "contact@trycakely.com",
  phone: "+31 649816530",
  phoneHref: "tel:+31649816530",
  supportHours: "Mon-Fri 9am-5pm",
  address: {
    street: "",
    city: "Amsterdam",
    region: "North Holland",
    country: "NL",
    display: "Amsterdam, North Holland",
  },
  logo: "/images/logo.svg",
  favicon: "/favicon.png",
  ogImage: "/images/hero-1.jpg",
  // Must match the delivery rate set in Hostinger, which is what checkout charges.
  shippingPrice: 390,
  socials: {
    instagram: "https://www.instagram.com/trycakely",
    tiktok: "https://www.tiktok.com/@trycakely",
    whatsapp: "https://wa.me/31649816530",
    instagramDm: "https://ig.me/m/trycakely",
  },
} as const;

/** Home page copy. The page (routes/home.tsx), its Markdown twin (/home.md)
 *  and the structured data all read it from here. */
export const home = {
  eyebrow: "Handmade in Amsterdam",
  headline: ["Seriously good cake.", "Not your usual cake."],
  plan: {
    lead: "This weekend's plan:",
    // Cycles in the hero; screen readers and /home.md get `summary`.
    words: ["birthday", "movie night", "Sunday brunch", "date night", "just because"],
    summary: "birthday, movie night, or just because.",
  },
  /** `birthdayPrice` is the formatted Birthday Special price, or null when it's not on sale. */
  ticker: (birthdayPrice: string | null) => [
    "Not your usual cake",
    "Handmade in Amsterdam",
    "Delivered Saturday & Sunday",
    ...(birthdayPrice ? [`10 cakes for ${birthdayPrice}`] : []),
    "Orders close Wednesday night",
  ],
  flavours: { title: "The flavours." },
  birthday: {
    eyebrow: "Birthday Special",
    title: ["Plan the party.", "Pick all ten."],
    /** `price` is the formatted Birthday Special price. */
    body: (price: string) => `Ten handmade mini cakes in one box for ${price}, made for sharing.`,
  },
  howTo: {
    title: "How it works.",
    steps: [
      { title: "Pick your cakes", body: "Mix and match flavours. The minimum order is €20: four mini cakes, or one Birthday Special." },
      { title: "Choose Saturday or Sunday", body: "Order by Wednesday night and it's this weekend. Later orders go to the next one." },
      { title: "We bring it to your door", body: `Baked to order and delivered across Amsterdam, for ${formatMoney(site.shippingPrice)}.` },
    ],
  },
  /** Not on the page itself; kept for /home.md. */
  about: {
    title: "A little about us",
    body: "We’re a team of cake enthusiasts living in Amsterdam. Passionate about creating, detail-obsessed, and always cooking with others in mind. What you’re holding is more than dessert, it’s teamwork in a jar",
  },
  signoff: { tagline: "not your usual cake.", socialsLead: "Try cakely on", handle: "@trycakely" },
};

export const footerPages = [
  { label: "Home", href: "/" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "FAQ", href: "/faq" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];
