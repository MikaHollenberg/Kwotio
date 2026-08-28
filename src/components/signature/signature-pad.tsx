"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";

export type SignaturePadHandle = {
  isEmpty: () => boolean;
  toDataUrl: () => string;
  clear: () => void;
};

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_props, ref) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useImperativeHandle(ref, () => ({
    isEmpty: () => sigRef.current?.isEmpty() ?? true,
    toDataUrl: () => sigRef.current?.getTrimmedCanvas().toDataURL("image/png") ?? "",
    clear: () => {
      sigRef.current?.clear();
      setIsEmpty(true);
    },
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-brand-sm border-2 border-dashed border-ink-200 bg-sand-50">
        <SignatureCanvas
          ref={sigRef}
          penColor="#1E2E38"
          clearOnResize={false}
          canvasProps={{ className: "h-40 w-full touch-none" }}
          onEnd={() => setIsEmpty(sigRef.current?.isEmpty() ?? true)}
        />
        {isEmpty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-300">
            Teken hier je handtekening
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          sigRef.current?.clear();
          setIsEmpty(true);
        }}
        className="flex w-fit items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-500"
      >
        <Eraser className="size-3.5" /> Opnieuw
      </button>
    </div>
  );
});
