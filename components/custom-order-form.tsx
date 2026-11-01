"use client";

import { useActionState, useEffect, useRef } from "react";

import { createCustomOrderAction, type CustomOrderState } from "@/actions/custom-order";
import { Alert, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { SIZES } from "@/lib/constants";

const STYLES = [
  "Cyberpunk",
  "Minimalis",
  "Retro",
  "Alam",
  "Abstrak",
  "Tipografi",
  "Lainnya",
];

const initialState: CustomOrderState = {};

export function CustomOrderForm() {
  const [state, formAction, pending] = useActionState(createCustomOrderAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Judul atau tema</Label>
        <Input id="title" name="title" required minLength={3} placeholder="Misal: Senja di Candi" />
      </div>

      <div>
        <Label htmlFor="brief">Brief</Label>
        <Textarea
          id="brief"
          name="brief"
          required
          minLength={20}
          placeholder="Ceritakan suasana, warna, objek, dan kesan yang Anda inginkan."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="style">Gaya</Label>
          <Select
            id="style"
            name="style"
            required
            defaultValue="Minimalis"
            options={STYLES.map((s) => ({ value: s, label: s }))}
          />
        </div>
        <div>
          <Label htmlFor="size">Ukuran</Label>
          <Select
            id="size"
            name="size"
            required
            defaultValue="A3"
            options={SIZES.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="budget">Budget (opsional)</Label>
          <Input
            id="budget"
            name="budget"
            type="number"
            min={50000}
            step={10000}
            placeholder="150000"
          />
        </div>
        <div>
          <Label htmlFor="referenceUrl">Link referensi (opsional)</Label>
          <Input
            id="referenceUrl"
            name="referenceUrl"
            type="url"
            placeholder="https://…"
          />
        </div>
      </div>

      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Button type="submit" disabled={pending} className="w-full py-3">
        {pending ? "Mengirim…" : "Kirim brief"}
      </Button>
    </form>
  );
}
