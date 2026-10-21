import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import { effectivePrice, type Product } from "~/lib/catalog";
import { track } from "~/lib/analytics";
import { useCart } from "~/lib/cart";
import { productImage, productSrcSet, stopSkeleton } from "~/lib/images";
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
  listName,
}: {
  product: Product;
  size?: "default" | "lg";
  className?: string;
  /** The product list this button sits in, for analytics. */
  listName?: string;
}) {
  const { add } = useCart();
  return (
    <button
      type="button"
      disabled={!product.available}
      onClick={() => {
        add(product.variantId);
        track.addToCart(product, 1, listName);
      }}
      className={`relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 ${
        size === "lg" ? "h-10" : "h-9"
      } ${className}`}
    >
      <ShoppingCart className="size-4" />
      {product.available ? "Add to Basket" : "Sold out"}
    </button>
  );
}

export function ProductCard({
  product,
  listName,
  priority = false,
}: {
  product: Product;
  /** The list the card is shown in, e.g. "Home", reported to analytics. */
  listName: string;
  priority?: boolean;
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-background">
      <Link
        to={`/products/${product.slug}`}
        onClick={() => track.selectItem(listName, product)}
        className="absolute inset-0 z-10"
        aria-label={product.title}
        prefetch="intent"
      />
      <div className="skeleton overflow-hidden" style={{ paddingBottom: "78.86%" }}>
        {product.images[0] && (
          <img
            ref={stopSkeleton}
            src={productImage(product.images[0], 640)}
            srcSet={productSrcSet(product.images[0])}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, calc(100vw - 2rem)"
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
        <AddToBasketButton product={product} listName={listName} />
      </div>
    </div>
  );
}
