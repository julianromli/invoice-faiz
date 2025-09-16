# AGENTS.md

Invoice Generator adalah aplikasi web Next.js yang memungkinkan user untuk membuat invoice professional secara gratis. Project ini menggunakan React PDF untuk generate PDF, dengan form multi-step yang comprehensive.

## Setup commands

```bash
# Install dependencies (menggunakan Bun sebagai package manager)
bun install

# Start development server
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Linting
bun run lint
```

## Environment setup

```bash
# Copy environment file
cp .env.example .env.local

# Set required environment variables
NEXT_PUBLIC_URL=https://your-domain.com  # Must include protocol (https://)
```

**CRITICAL**: Environment variable `NEXT_PUBLIC_URL` harus menggunakan format URL yang valid dengan protocol. Missing protocol akan menyebabkan "Invalid URL" error saat Next.js build.

## Code style

- **TypeScript strict mode** - Semua files menggunakan TypeScript dengan strict settings
- **Tailwind CSS** - Primary styling system dengan custom utilities di `globals.css`
- **Shadcn/UI components** - SELALU gunakan Shadcn/UI, jangan buat custom UI dari scratch
- **File naming** - PascalCase untuk components (InvoicePreview.tsx), camelCase untuk utilities
- **Imports** - Relative imports untuk local files, absolute untuk external packages
- **Indentation** - 2 spaces, double quotes, consistent Tailwind class ordering

### React Patterns
- Functional components dengan hooks (no class components)
- Custom hooks untuk reusable logic (`useData.ts`, `useGetValue.ts`)
- **State management via URL search params** - TIDAK gunakan local state untuk form data
- Error boundaries untuk PDF generation errors
- Framer Motion untuk animations dengan type assertion pattern

### PDF Styling Rules (CRITICAL)
- **WAJIB gunakan `pdfStyles.ts` system** untuk semua PDF components
- **TIDAK bisa pakai CSS classes** di PDF components - hanya inline styles
- **Images harus di-convert** ke base64 atau public URLs untuk PDF
- **Test PDF output** terpisah dari preview components

## Architecture

### High-Level Structure
```
app/
├── (landing)/           # Landing page route group
├── new/                 # Invoice creation page
├── dashboard/           # Analytics dashboard
├── component/           # Shared components
│   ├── form/           # Form-related components
│   │   ├── pdfDetails.tsx         # Main PDF orchestrator
│   │   ├── invoiceDetails/        # Invoice items & calculations
│   │   ├── companyDetails/        # Client company info
│   │   ├── yourDetails/           # User business info
│   │   ├── paymentDetails/        # Bank payment info
│   │   └── invoiceTerms/         # Invoice number, dates
│   └── ui/             # Custom UI components + Shadcn components
├── hooks/              # Custom React hooks
└── globals.css         # Global Tailwind styles

lib/
├── pdfStyles.ts        # React-PDF styling system (CRITICAL)
├── currency.tsx        # Multi-currency support
├── history.ts          # Invoice history management
├── analytics.ts        # Dashboard analytics
├── utils.ts           # Utility functions
└── svgToDataUri.ts    # SVG conversion for PDF

types.d.ts             # TypeScript interfaces
```

### Core Systems

#### PDF Generation System
- **Main orchestrator**: `PdfDetails.tsx` menggabungkan semua sections
- **Dual component pattern**: Setiap section punya 2 versions:
  - `*Pdf.tsx` files untuk actual PDF rendering
  - Preview components untuk form interface
- **Centralized styling**: `pdfStyles.ts` dengan pre-defined styles
- **Multi-currency support**: Complete currency system dengan country flag icons

#### State Management Pattern
- **URL search params** untuk state persistence (BUKAN local state)
- **Custom hooks**: `useData.ts` dan `useGetValue.ts` untuk data management
- **Automatic persistence**: Form state persist otomatis saat refresh/bookmark
- **Data flow**: URL params → hooks → components → PDF generation

#### Dashboard & Analytics
- **Local storage**: Invoice history dengan status tracking (paid, pending, overdue)
- **Client-side analytics**: Revenue metrics & filters computed via `lib/analytics.ts`
- **Export functionality**: HTML-to-image + UTIF untuk clipboard/download
- **Invoice management**: Delete invoices dengan confirmation via `deleteInvoiceSnapshot`

## Development workflow

### Adding New Form Fields
1. **Update types**: Add field ke relevant interface di `types.d.ts`
2. **Create input**: Buat input component di appropriate section folder
3. **Add PDF rendering**: Update corresponding `*Pdf.tsx` file
4. **Update hooks**: Modify `useData.ts` hook untuk include new field
5. **Test both**: Verify preview dan PDF output

### PDF Component Development Pattern
```typescript
// Example PDF component structure
import { pdfStyles } from '@/lib/pdfStyles';

const InvoicePdf = ({ data }: { data: InvoiceData }) => (
  <View style={pdfStyles.section}>
    <Text style={pdfStyles.title}>{data.companyName}</Text>
  </View>
);
```

### Currency & Multi-language System
- **Default currency**: INR (Indian Rupee)
- **Support**: 14+ currencies dengan proper symbols dan formatting
- **Country flags**: SVG system menggunakan `country-flag-icons`
- **Dynamic formatting**: Currency selection affects calculations & display

### Form State Management
```typescript
// SELALU gunakan URL search params untuk form data
const companyName = useGetValue('companyName');
const updateData = useData();

// Update data (otomatis sync ke URL)
updateData({ companyName: 'New Company' });
```

## Known issues & solutions

### TypeScript Issues dengan Framer Motion
**Problem**: Framer Motion components (`motion.div`, `motion.span`) tidak properly expose `className` prop di TypeScript definitions.

**Solution**: Gunakan type assertion pattern untuk bypass TypeScript checking:
```typescript
// Instead of:
<motion.div className={className} />

// Use:
<motion.div
  {...({
    className: className
  } as any)}
/>
```

**Files affected**: `components/ui/sidebar.tsx` (DesktopSidebar, MobileSidebar, SidebarLink)
**Status**: ✅ Fixed - Build berhasil tanpa TypeScript errors

### Vercel Deployment URL Issues
**Problem**: Build error di Vercel "TypeError: Invalid URL" dengan input 'undefined'.

**Root Cause**: Environment variable `NEXT_PUBLIC_URL` tidak menggunakan format URL yang valid (missing protocol).

**Solution**: 
```bash
# ❌ Wrong format
NEXT_PUBLIC_URL="invoice-faiz.vercel.app"

# ✅ Correct format  
NEXT_PUBLIC_URL="https://invoice-faiz.vercel.app"
```

**Technical Context**: URL digunakan di `app/layout.tsx` untuk `metadataBase: new URL(process.env.NEXT_PUBLIC_URL!)` dan `new URL()` constructor requires valid URL format dengan protocol.

**Status**: ✅ Fixed - Local build berhasil, perlu update Vercel env vars

### PDF Styling Constraints
**Problem**: React-PDF memiliki styling limitations yang berbeda dari regular React.

**Solution**:
- Gunakan `pdfStyles.ts` system exclusively untuk PDF components
- Convert semua images ke base64 atau public URLs
- Test PDF output secara terpisah dari preview components
- Tidak bisa pakai CSS classes di PDF components

## Testing approach

### Manual Testing Workflow
1. **Form validation**: Test semua input fields dengan edge cases
2. **PDF generation**: Verify PDF output dengan different data combinations  
3. **Multi-currency**: Test calculations dengan different currencies
4. **State persistence**: Test URL bookmark/refresh functionality
5. **Responsive design**: Test pada different screen sizes
6. **Dashboard analytics**: Test invoice history, status tracking, export functionality

### Automated Testing (Recommended)
- **Playwright**: Gunakan Playwright MCP tools untuk end-to-end testing
- **Form automation**: Automated form filling dan validation
- **PDF testing**: Download dan verify PDF generation
- **Visual regression**: Screenshot comparison untuk UI changes
- **Cross-browser**: Test compatibility across browsers

### Testing Checklist
```bash
# Manual verification steps
1. Fill form dengan complete data → Generate PDF ✓
2. Test different currencies → Verify calculations ✓
3. Upload logos (both company & client) → Check PDF output ✓
4. Refresh browser → Verify state persistence ✓
5. Test responsive design → Mobile/tablet/desktop ✓
6. Dashboard functionality → History, analytics, export ✓
```

## Performance considerations

### Client-side PDF Generation
- PDF generation happens purely client-side (no server required)
- Can be slow untuk complex invoices dengan many items
- Consider lazy loading untuk heavy components
- Show loading states during PDF generation

### Image Optimization
- Logo uploads harus optimized untuk PDF file size
- SVG conversion utility available di `lib/svgToDataUri.ts`  
- Country flag icons efficiently cached
- Consider image compression untuk large uploads

### Bundle Size & Performance
- Monitor bundle size impact dari new dependencies
- Tree-shake unused utilities dan components
- Lazy load non-critical components (dashboard, analytics)
- Optimize font loading strategy (Geist font)
- PDF library (`@react-pdf/renderer`) adalah largest dependency

## Component integration guidelines

### Shadcn/UI Component Usage
- **ALWAYS** check available components sebelum create custom
- Use MCP tools (`get_component`, `list_components`) untuk fetch components
- Follow existing component patterns untuk consistency
- Customize via className props, bukan direct source modification

### PDF Component Integration Pattern
```typescript
// Pattern untuk dual preview/PDF components
const InvoiceSection = ({ data, isPdf = false }) => {
  if (isPdf) {
    return <InvoiceSectionPdf data={data} />;
  }
  return <InvoiceSectionPreview data={data} />;
};
```

### Error Handling
- PDF generation errors harus gracefully handled dengan fallback UI
- Form validation errors harus user-friendly dengan clear messaging
- Network errors untuk image uploads harus retry logic
- Loading states untuk all async operations

---

**Compatible with**: Cursor, GitHub Copilot, Aider, Warp AI, Codex, Jules, Zed, Devin, Gemini CLI, dan 20+ other AI coding agents

**Project designed for**: Client-side PDF generation, tidak butuh complex server infrastructure

**Last Updated**: 2025-01-16  
**Standard**: AGENTS.md v1.0
