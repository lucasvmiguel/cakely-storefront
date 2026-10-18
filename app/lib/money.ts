export type Currency = {
  code: string;
  symbol: string;
  decimal_digits: number;
  template: string;
};

export const EUR: Currency = {
  code: "eur",
  symbol: "€",
  decimal_digits: 2,
  template: "€$1",
};

/** Formats an amount in minor units (e.g. 650 → "€6.50"). */
export function formatMoney(amount: number, currency: Currency = EUR) {
  const value = (amount / 10 ** currency.decimal_digits).toFixed(
    currency.decimal_digits,
  );
  return currency.template
    ? currency.template.replace("$1", value)
    : `${currency.symbol}${value}`;
}

/** Plain decimal string for structured data (e.g. 650 → "6.50"). */
export function toDecimal(amount: number, currency: Currency = EUR) {
  return (amount / 10 ** currency.decimal_digits).toFixed(
    currency.decimal_digits,
  );
}
