// Google Customer Reviews: after an order, Google shows an opt-in dialog and,
// if the customer agrees, emails them a short survey after the delivery date.
// The resulting store ratings show up on Google. Nothing is sent unless the
// customer opts in themselves, so this does not wait for cookie consent.
import { GOOGLE_MERCHANT_ID } from "./config";

type SurveyOptIn = {
  orderId: string;
  email: string;
  /** Delivery date as YYYY-MM-DD. */
  deliveryDate: string;
};

declare global {
  interface Window {
    gapi?: {
      load: (name: string, cb: () => void) => void;
      surveyoptin?: { render: (opts: Record<string, unknown>) => void };
    };
    renderSurveyOptIn?: () => void;
  }
}

export function showSurveyOptIn(order: SurveyOptIn) {
  window.renderSurveyOptIn = () => {
    window.gapi?.load("surveyoptin", () => {
      window.gapi?.surveyoptin?.render({
        merchant_id: GOOGLE_MERCHANT_ID,
        order_id: order.orderId,
        email: order.email,
        delivery_country: "NL",
        estimated_delivery_date: order.deliveryDate,
      });
    });
  };
  if (window.gapi) return window.renderSurveyOptIn();
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://apis.google.com/js/platform.js?onload=renderSurveyOptIn";
  document.head.appendChild(s);
}
