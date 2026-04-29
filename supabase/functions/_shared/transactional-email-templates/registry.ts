/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as leadConfirmationSignup } from './lead-confirmation-signup.tsx'
import { template as leadConfirmationExisting } from './lead-confirmation-existing.tsx'
import { template as leadConfirmationSimple } from './lead-confirmation-simple.tsx'
import { template as guideDownloadConfirmation } from './guide-download-confirmation.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'lead-confirmation-signup': leadConfirmationSignup,
  'lead-confirmation-existing': leadConfirmationExisting,
  'lead-confirmation-simple': leadConfirmationSimple,
  'guide-download-confirmation': guideDownloadConfirmation,
}
