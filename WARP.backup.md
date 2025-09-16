# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Invoice Generator adalah aplikasi web Next.js yang memungkinkan user untuk membuat invoice professional secara gratis. Project ini menggunakan React PDF untuk generate PDF, dengan form multi-step yang comprehensive.

## Development Commands

### Package Manager
Project ini menggunakan **Bun** sebagai package manager utama:

```bash
# Install dependencies
bun install

# Development server
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Linting
bun run lint
```

### Environment Setup
- Copy `.env.example` ke `.env.local`
- Set `NEXT_PUBLIC_URL` untuk base URL aplikasi

## High-Level Architecture

### Core Structure
```
app/
├── (landing)/           # Landing page route group
├── new/                 # Invoice creation page
├── component/           # Shared components
│   ├── form/           # Form-related components
│   │   ├── pdfDetails.tsx         # Main PDF orchestrator
│   │   ├── invoiceDetails/        # Invoice items & calculations
│   │   ├── companyDetails/        # Client company info
│   │   ├── yourDetails/           # User business info
│   │   ├── paymentDetails/        # Bank payment info
│   │   └── invoiceTerms/         # Invoice number, dates
│   └── ui/             # Custom UI components
├── hooks/              # Custom React hooks
└── globals.css         # Global Tailwind styles

lib/
├── pdfStyles.ts        # React-PDF styling system
├── currency.tsx        # Multi-currency support
├── utils.ts           # Utility functions
└── other utilities...

types.d.ts             # TypeScript interfaces
```

### PDF Generation System
Project ini menggunakan **@react-pdf/renderer** dengan arsitektur modular:

1. **PdfDetails.tsx** - Main orchestrator yang menggabungkan semua sections
2. **Section Components** - Setiap section punya component terpisah untuk preview & PDF:
   - `*Pdf.tsx` files untuk PDF rendering
   - Preview components untuk form interface
3. **pdfStyles.ts** - Centralized styling system dengan pre-defined styles
4. **Multi-currency Support** - Complete currency system dengan flag icons

### State Management Pattern
- Menggunakan URL search params untuk state persistence
- Custom hooks (`useData.ts`, `useGetValue.ts`) untuk data management
- Form state disimpan di URL, memungkinkan bookmark & sharing

### Styling System
- **Tailwind CSS** dengan custom utilities di `globals.css`
- **Shadcn/UI** components (configured di `components.json`)
- **Framer Motion** untuk animations
- **Geist Font** sebagai primary font

### Key Technical Patterns

#### PDF vs Preview Duality
Setiap section memiliki 2 versions:
- Preview component untuk form interface
- PDF component untuk actual PDF generation

#### Currency & Country System
- Comprehensive currency list dengan country flags
- Dynamic symbol & formatting per currency
- SVG country flags dari `country-flag-icons`

#### Form Architecture
- Multi-step form dengan sections:
  1. Your Details (business info)
  2. Company Details (client info)  
  3. Invoice Items & Calculations
  4. Payment Details
  5. Invoice Terms (dates, numbers)

## Important Development Notes

### PDF Styling Constraints
- React-PDF memiliki styling limitations
- Semua PDF styles harus menggunakan `pdfStyles.ts` system
- Tidak bisa pakai CSS classes di PDF components
- Images harus di-convert ke base64 atau public URLs

### State Persistence
- Semua form data disimpan di URL search params
- Gunakan `useGetValue` hook untuk mengakses data
- Data otomatis persist saat refresh/bookmark

### Currency Handling
- Default currency: INR
- Support 14+ currencies dengan proper symbols
- Currency selection affects calculations & display

### Image Handling
- Logo uploads untuk both user & client companies
- SVG conversion utility available di `lib/svgToDataUri.ts`
- Country flag system untuk currency display

## Component Integration

### Adding New Form Fields
1. Add field ke relevant interface di `types.d.ts`
2. Create input component di appropriate section
3. Add PDF rendering di corresponding `*Pdf.tsx`
4. Update `useData.ts` hook untuk include new field

### Styling Guidelines
- Pakai existing `pdfStyles.ts` patterns untuk PDF components
- Follow Tailwind + dashed border design pattern untuk UI
- Maintain consistency dengan existing component structure

## Production Deployment

### Build Process
- Next.js static generation
- Image optimization automatically handled
- PDF generation happens client-side (tidak butuh server PDF processing)

### Performance Considerations
- PDF generation bisa lambat untuk complex invoices
- Consider lazy loading untuk heavy components
- Image optimization penting untuk logo uploads

## Testing & Quality

### Recommended Testing Approach
- Test PDF generation dengan different data combinations
- Verify multi-currency calculations
- Test form state persistence
- Validate responsive design untuk different screen sizes

## Known Issues & Fixes

### TypeScript Issues dengan Framer Motion
**Issue**: Framer Motion components (`motion.div`, `motion.span`) tidak properly expose `className` prop di TypeScript definitions, menyebabkan build errors.

**Solution**: Gunakan type assertion pattern untuk bypass TypeScript checking:
```tsx
// Instead of:
<motion.div className={className} />

// Use:
<motion.div
  {...({
    className: className
  } as any)}
/>
```

**Files affected**:
- `components/ui/sidebar.tsx` (DesktopSidebar, MobileSidebar, SidebarLink)
- Pattern applicable untuk semua framer-motion components yang butuh className

**Status**: ✅ Fixed - Build berhasil tanpa TypeScript errors

### Vercel Deployment URL Issues
**Issue**: Build error di Vercel "TypeError: Invalid URL" dengan input 'undefined', terutama untuk page `/_not-found`.

**Root Cause**: Environment variable `NEXT_PUBLIC_URL` di `.env.local` atau Vercel environment settings tidak menggunakan format URL yang valid (missing protocol).

**Solution**: 
1. Update `.env.local` dengan format URL yang proper:
```bash
# ❌ Wrong format
NEXT_PUBLIC_URL="invoice-faiz.vercel.app"

# ✅ Correct format  
NEXT_PUBLIC_URL="https://invoice-faiz.vercel.app"
```

2. Set environment variable yang sama di Vercel dashboard:
   - Go to Vercel project settings > Environment Variables
   - Add `NEXT_PUBLIC_URL` with value `https://invoice-faiz.vercel.app`

**Technical Context**: 
- URL digunakan di `app/layout.tsx` untuk `metadataBase: new URL(process.env.NEXT_PUBLIC_URL!)`
- `new URL()` constructor requires valid URL format dengan protocol
- Missing protocol menyebabkan "Invalid URL" error saat Next.js build

**Status**: ✅ Fixed - Local build berhasil, perlu update Vercel env vars

Catatan: Project ini designed untuk client-side PDF generation, jadi tidak butuh server infrastructure yang complex.
