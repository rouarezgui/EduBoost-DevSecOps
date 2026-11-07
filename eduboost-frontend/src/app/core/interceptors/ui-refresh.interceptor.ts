import { ApplicationRef, inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

export const uiRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const appRef = inject(ApplicationRef);

  return next(req).pipe(
    finalize(() => {
      queueMicrotask(() => {
        try {
          appRef.tick();
        } catch {
          // Angular may already be in a render pass; the next event loop will handle it.
        }
      });
    })
  );
};
