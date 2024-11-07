// src/app/app.config.ts
import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

export const appConfig = {
  providers: [
    importProvidersFrom(
      RouterModule,
      HttpClientModule
    ),
    // Add other providers as needed
  ],
};

