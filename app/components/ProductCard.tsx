import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import { effectivePrice, type Product } from "~/lib/catalog";
import { useCart } from "~/lib/cart";
import { formatMoney } from "~/lib/money";

export function Price({ product, className = "" }: { product: Product; className?: string }) {
  const price = effectivePrice(product);
  return (
    <span className={className}>
      {formatMoney(price, product.currency)}
      {product.salePrice != null && (
        <s className="ml-2 text-sm font-normal text-muted-foreground">{formatMoney(product.price, product.currency)}</s>
      )}
    </span>
  );
}

export function AddToBasketButton({
  product,
  size = "default",
  className = "",
}: {
  product: Product;
  size?: "default" | "lg";
  className?: string;
}) {
  const { add } = useCart();
  return (
    <button
      type="button"
      disabled={!product.available}
      onClick={() => add(product.variantId)}
      className={`relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 ${
        size === "lg" ? "h-10" : "h-9"
      } ${className}`}
    >
      <ShoppingCart className="size-4" />
      {product.available ? "Add to Basket" : "Sold out"}
    </button>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-background">
      <Link to={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.title} prefetch="intent" />
      <div className="relative overflow-hidden bg-muted" style={{ paddingBottom: "78.86%" }}>
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.title}
            loading={priority ? "eager" : "lazy"}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
        {product.subtitle && <p className="line-clamp-2 text-xs text-muted-foreground">{product.subtitle}</p>}
        <div className="mt-auto pt-2">
          <Price product={product} className="text-base font-semibold" />
          {product.pricePerKg && (
            <p className="text-xs text-muted-foreground">({formatMoney(product.pricePerKg, product.currency)} per kg)</p>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <AddToBasketButton product={product} />
      </div>
    </div>
  );
}
