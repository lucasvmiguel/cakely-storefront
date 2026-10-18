// Business details and marketing copy, shared by the HTML pages, the .md
// pages and the structured data so they never drift apart.

export const site = {
  name: "Cakely",
  description:
    "Cakely is an artisan bakery based in Amsterdam specialized in premium cakes in a jar — beautifully layered, freshly made, and delivered straight to your door.",
  email: "contact@trycakely.com",
  phone: "+31 649816530",
  phoneHref: "tel:+31649816530",
  supportHours: "Mon-Fri 9am-5pm",
  address: {
    street: "",
    city: "Amsterdam",
    region: "North Holland",
    postalCode: "1013LD",
    country: "NL",
    display: "Amsterdam, Amsterdam, North Holland, 1013LD",
  },
  logo: "/images/logo.svg",
  favicon: "/favicon.png",
  ogImage: "/images/hero-1.jpg",
  shippingPrice: 400,
  socials: {
    instagram: "https://www.instagram.com/trycakely",
    tiktok: "https://www.tiktok.com/@trycakely",
    whatsapp: "https://wa.me/31649816530",
    instagramDm: "https://ig.me/m/trycakely",
  },
} as const;

export const announcements = [
  { text: "WE DELIVER RIGHT TO YOUR DOOR IN AMSTERDAM" },
  { text: "EXPLORE OUR LATEST CREATIONS", href: "/search" },
] as const;

export type ResponsiveImage = { base: string; alt: string };

/** `base` maps to /images/<base>-800.webp, -1200.webp and <base>.jpg. */
export const home = {
  hero: [
    {
      headline: "Seriously good cake, handmade in Amsterdam",
      cta: "SHOP NOW",
      href: "/search",
      align: "left" as const,
      image: { base: "hero-1", alt: "Cakely cake jars" },
    },
    {
      headline: "Discover your favorite 4 original cakes",
      cta: "TRY IT NOW",
      href: "/search",
      align: "center" as const,
      image: { base: "hero-2", alt: "Cakely's four original cake flavours" },
    },
  ],
  jars: {
    title: "Our Cake Jars",
    subtitle: "Explore our mouthwatering cake options",
  },
  feature: {
    headline:
      "Meet our current feature: Dulce de Leche, available for a limited time before we switch things up with a new flavour",
    cta: "Order Now",
    productSlug: "dulce-de-leche",
    image: { base: "feature-dulce", alt: "Dulce de Leche cake in a jar" },
  },
  howTo: {
    title: "How can I order?",
    steps: [
      {
        title: "1. PICK YOUR FLAVOUR",
        body: "All our cakes are handmade to order with care, which takes a few days to prepare.",
        cta: { label: "See Options", href: "/search" },
        image: { base: "step-1", alt: "Choosing a Cakely flavour" },
      },
      {
        title: "2. CHOOSE A DATE",
        body: "Let us know your preferred delivery date, and we’ll ensure your cake arrives as fresh as possible — delivered exclusively in Amsterdam",
        cta: null,
        image: { base: "step-2", alt: "Planning the delivery date" },
      },
      {
        title: "3. DELIVERY",
        body: "Once payment is verified, we will begin preparing your order for dispatch — don't forget that the minimum order is €20",
        cta: { label: "Order Now", href: "/search" },
        image: { base: "step-3", alt: "Cakely delivery in Amsterdam" },
      },
    ],
  },
  birthday: {
    headline:
      "Planning a birthday? Make it extra sweet with our Birthday Special — 10 handmade cakes for €50, made for sharing and celebrating",
    cta: "Order Now",
    image: { base: "birthday", alt: "Birthday Special basket of cake jars" },
  },
  about: {
    title: "A little about us",
    body: "We’re a team of cake enthusiasts living in Amsterdam. Passionate about creating, detail-obsessed, and always cooking with others in mind. What you’re holding is more than dessert, it’s teamwork in a jar",
    image: { base: "about", alt: "The Cakely team at work" },
  },
};

export const footerPages = [
  { label: "Home", href: "/" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "FAQ", href: "/faq" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];
