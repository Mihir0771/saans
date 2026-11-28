"use client";

import React, { useEffect, useRef } from "react";

interface DialogFrameProps {
  open: boolean;
  labelledBy: string;
  onClose: () => void;
  className: string;
  children: React.ReactNode;
}

/**
 * Shared accessible native `<dialog>` frame handling modal open/close sync
 * and light-dismiss backdrop clicks for browsers without `closedby` support.
 */
export function DialogFrame({ open, labelledBy, onClose, className, children }: DialogFrameProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return undefined;
    dlg.setAttribute("closedby", "any");
    if ("closedBy" in HTMLDialogElement.prototype) return undefined;
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) {
        dlg.close();
      }
    };
    dlg.addEventListener("click", onBackdropClick);
    return () => dlg.removeEventListener("click", onBackdropClick);
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby={labelledBy} onClose={onClose} className={className}>
      {children}
    </dialog>
  );
}
