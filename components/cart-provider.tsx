"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import {
  CART_STORAGE_KEY,
  cartCount,
  cartReducer,
  readCart,
  type CartAction,
  type CartItem,
} from "@/lib/cart";

type CartApi = {
  items: CartItem[];
  count: number;
  ready: boolean;
  addItem: (item: CartItem, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQty: (variantId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

type CartState = { items: CartItem[]; ready: boolean };

function cartStateReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "hydrate") {
    return { items: action.items, ready: true };
  }
  return { items: cartReducer(state.items, action), ready: state.ready };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [{ items, ready }, dispatch] = useReducer(cartStateReducer, {
    items: [],
    ready: false,
  });

  useEffect(() => {
    dispatch({
      type: "hydrate",
      items: readCart(window.localStorage.getItem(CART_STORAGE_KEY)),
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((item: CartItem, quantity = 1) => {
    dispatch({ type: "add", item, quantity });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    dispatch({ type: "remove", variantId });
  }, []);

  const setQty = useCallback((variantId: string, quantity: number) => {
    dispatch({ type: "setQty", variantId, quantity });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const value = useMemo<CartApi>(
    () => ({
      items,
      count: cartCount(items),
      ready,
      addItem,
      removeItem,
      setQty,
      clear,
    }),
    [items, ready, addItem, removeItem, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart harus dipakai di dalam CartProvider.");
  }
  return context;
}
