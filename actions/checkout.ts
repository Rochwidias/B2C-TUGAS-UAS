"use server";

import { createOrder, type CheckoutInput, type CheckoutResult } from "@/lib/orders";
import { getSession } from "@/lib/session";

export async function submitCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const session = await getSession();
  return createOrder(input, session?.id ?? null);
}
