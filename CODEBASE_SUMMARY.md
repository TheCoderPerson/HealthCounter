# HealthCounter Codebase Summary

## Quick Overview

**HealthCounter** is a Progressive Web App (PWA) for nutrition tracking with barcode scanning capabilities, built with React 19, TypeScript, and Vite.

**Key Stats:**
- **Technology:** React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS
- **Database:** Dexie (IndexedDB) - local-first, offline-capable
- **Lines of Code:** ~1,972 (pages only, production-ready)
- **API Sources:** Open Food Facts (free, no auth) + USDA FDC (requires API key)
- **Deployment:** GitHub Pages with automated CI/CD
- **Pattern:** Clean architecture with Repository pattern, Domain-Driven Design

---

## Project Structure at a Glance

```
src/
├── api/                    # External API wrappers (OpenFoodFacts, USDA FDC)
├── components/             # Reusable React components (Navigation, BarcodeScanner)
├── db/                     # Repository pattern data layer (5 repositories)
├── domain/                 # Pure business logic (nutrition calc, unit conversion)
├── pages/                  # 8 main pages (routing)
├── types/                  # TypeScript definitions (37 nutrients tracked)
├── utils/                  # Utilities (settings storage in localStorage)
├── App.tsx                 # Main router setup
├── main.tsx                # React entry point
└── index.css               # Tailwind + global styles
```

---

## Architecture Highlights

### 1. Database Layer (Dexie + Repository Pattern)
- **7 tables:** foods, nutrients, entries, recipes, recipeItems, favorites, settings
- **4 repositories** for clean data access:
  - `foodRepository.ts` - Food CRUD + search
  - `entryRepository.ts` - Meal logging
  - `recipeRepository.ts` - Recipe management
  - `favoritesRepository.ts` - Favorites tracking

### 2. Business Logic (Domain-Driven Design)
- **nutrition.ts** - Nutrient calculations (scale by grams, sum, daily totals, format)
- **units.ts** - Unit conversions (g, oz, mL, cups, tbsp, tsp, servings, pieces)

### 3. API Integration (Abstracted)
- **openFoodFacts.ts** - Free barcode/text search, CORS-enabled v1 API
- **foodDataCentral.ts** - USDA FDC with 37 standardized nutrients
- Both map to canonical `FoodWithNutrients` type for consistency

### 4. State Management
- **Current:** React hooks (useState/useEffect) per component
- **Available:** Zustand v5.0.8 (not yet implemented)
- **Settings:** localStorage for user preferences and API keys

### 5. UI/Components
- **8 Pages:** Today, Search, Scan, FoodDetail, Recipes, RecipeDetail, Manual, Settings
- **Reusable:** Navigation (bottom bar), BarcodeScanner (ZXing + camera API)
- **Styling:** Tailwind CSS utility-first approach

---

## Key Data Models

### Core Types (37 nutrients tracked)
```typescript
Food {
  id, name, brand, source (OFF|FDC|USER), source_key, state, 
  grams_per_serving, grams_per_piece, density_g_per_ml, confidence
}

Nutrients {
  kcal, protein_g, fat_g, carbs_g, fiber_g, sugar_g, added_sugar_g,
  sat_fat_g, mono_fat_g, poly_fat_g, trans_fat_g,
  sodium_mg, potassium_mg, calcium_mg, magnesium_mg, iron_mg, zinc_mg,
  vitamin_d_ug, vitamin_a_rae, vitamin_e_mg, vitamin_k_ug, vitamin_c_mg,
  thiamin_b1_mg, riboflavin_b2_mg, niacin_b3_mg, vitamin_b6_mg,
  folate_ug_dfe, vitamin_b12_ug, cholesterol_mg
}

Entry { food_id, grams, timestamp, meal (breakfast|lunch|dinner|snack), note }

Recipe { name, servings, cooked_yield_g }

RecipeItem { recipe_id, food_id, grams }

Favorite { food_id OR recipe_id }
```

---

## Development Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server with HMR (hot reload)
npm run build                # TypeScript compile + Vite build
npm run lint                 # ESLint code quality check
npm run preview              # Preview production build locally
```

---

## API Integrations

### Open Food Facts (Free, No Key)
- Barcode lookup: `GET /api/v2/product/{barcode}.json`
- Text search: `GET /cgi/search.pl?search_terms=...`
- No authentication, unlimited requests
- Caches 30 days via Workbox

### USDA FoodData Central (API Key Required)
- Search: `GET /foods/search?query&pageSize&api_key`
- Lookup: `GET /food/{fdcId}?api_key`
- Default: `DEMO_KEY` (very rate limited)
- Free key: 1000 requests/hour

---

## Deployment Pipeline

**GitHub Actions → GitHub Pages**

1. **Trigger:** Push to 'Master' branch
2. **Build:** `npm ci` → `tsc -b && vite build`
3. **Deploy:** Upload `/dist` to GitHub Pages
4. **Base URL:** `/HealthCounter/`
5. **PWA:** Service Worker + manifest auto-generated

---

## Special Features

1. **Barcode Scanning** - ZXing library with camera access, CORS-compatible
2. **Offline Support** - Full IndexedDB + 30-day API cache
3. **Multi-Source Search** - Local + OFF + FDC in parallel
4. **Smart Caching** - Deduplicates by source+key
5. **Unit Conversion** - Dynamic based on food properties
6. **Recipe Tracking** - Per-serving or per-100g calculations
7. **Confidence Levels** - Tracks data source quality
8. **PWA Installation** - Works offline, installable on mobile

---

## Code Quality

- **TypeScript:** Strict mode, ES2022 target
- **ESLint:** Recommended rules + React hooks
- **No Unused:** Variables, parameters, side effects checked
- **Formatting:** ESLint-based (no prettier)

---

## Performance Optimizations

- **Vite:** Code splitting per route
- **Tailwind:** Utility-first, purged unused CSS
- **Dexie:** Efficient IndexedDB queries with indexes
- **Caching:** Workbox 30-day cache for API responses
- **React 19:** Latest optimizations built-in

---

## Recent Development Focus

Recent commits (past 6 months) focused on:
1. API reliability - Switching OFF endpoints for CORS support
2. Unit system - Adding volume units (cups, tbsp, tsp)
3. PWA features - Update handling, offline sync
4. Barcode search - Fixing API detection logic

---

## Best Practices in Codebase

1. **Separation of Concerns**
   - Pages handle routing
   - Components handle UI
   - Repositories handle data
   - Domain functions handle logic

2. **Type Safety**
   - TypeScript strict mode
   - Explicit return types
   - Discriminated unions for confidence levels

3. **Error Handling**
   - Try-catch in API calls
   - Graceful fallbacks
   - User-friendly messages

4. **Accessibility**
   - Semantic HTML
   - Aria attributes where needed
   - Keyboard navigation for inputs

5. **Performance**
   - Debouncing in search (300ms)
   - Preventing duplicate scans
   - Transaction batching in DB

---

## File Paths (Absolute)

| File | Lines | Purpose |
|------|-------|---------|
| `/home/user/HealthCounter/src/App.tsx` | 38 | Router setup with 8 routes |
| `/home/user/HealthCounter/src/api/openFoodFacts.ts` | 232 | OFF API client with barcode + search |
| `/home/user/HealthCounter/src/api/foodDataCentral.ts` | 242 | USDA FDC API client |
| `/home/user/HealthCounter/src/db/database.ts` | 63 | Dexie schema + initialization |
| `/home/user/HealthCounter/src/db/foodRepository.ts` | 128 | Food CRUD + search |
| `/home/user/HealthCounter/src/db/entryRepository.ts` | 102 | Entry logging + queries |
| `/home/user/HealthCounter/src/db/recipeRepository.ts` | 110 | Recipe management |
| `/home/user/HealthCounter/src/db/favoritesRepository.ts` | 70 | Favorites tracking |
| `/home/user/HealthCounter/src/domain/nutrition.ts` | 151 | Nutrient calculations |
| `/home/user/HealthCounter/src/domain/units.ts` | 162 | Unit conversions |
| `/home/user/HealthCounter/src/pages/TodayPage.tsx` | 129 | Daily summary view |
| `/home/user/HealthCounter/src/pages/SearchPage.tsx` | 300+ | Multi-source food search |
| `/home/user/HealthCounter/src/pages/ScanPage.tsx` | 100+ | Barcode scanner UI |
| `/home/user/HealthCounter/src/pages/FoodDetailPage.tsx` | 300+ | Food details + entry logging |
| `/home/user/HealthCounter/src/pages/RecipesPage.tsx` | 90 | Recipe list |
| `/home/user/HealthCounter/src/pages/RecipeDetailPage.tsx` | 250+ | Recipe creation/edit |
| `/home/user/HealthCounter/src/pages/ManualFoodPage.tsx` | 150+ | Manual food creation |
| `/home/user/HealthCounter/src/pages/SettingsPage.tsx` | 130+ | Settings + API keys |
| `/home/user/HealthCounter/src/components/Navigation.tsx` | 38 | Bottom navigation bar |
| `/home/user/HealthCounter/src/components/BarcodeScanner.tsx` | 160 | Camera barcode scanning |
| `/home/user/HealthCounter/vite.config.ts` | 67 | Vite + PWA configuration |
| `/home/user/HealthCounter/package.json` | 43 | Dependencies + scripts |

---

## Adding New Features: Quick Guides

### Add a New Page
1. Create `/pages/MyPage.tsx`
2. Add route to `App.tsx`
3. Add nav link to `Navigation.tsx`

### Add API Integration
1. Create `/api/myApi.ts`
2. Export typed functions returning `FoodWithNutrients`
3. Include error handling + logging
4. Use in SearchPage.tsx

### Add Database Table
1. Add table to `HealthCounterDB` class in `/db/database.ts`
2. Create `/db/myRepository.ts`
3. Implement CRUD functions
4. Use in pages via imports

---

## Helpful References

- **Dexie Docs:** Efficient IndexedDB wrapper
- **React Router:** v7.9.5 for routing
- **Tailwind CSS:** Utility-first styling
- **Vite:** Next-gen build tool
- **TypeScript:** Strict mode enabled

---

**Document Created:** November 2024
**For:** HealthCounter Contributors
**Companion:** TECHNICAL_DESIGN.md (1009 lines, comprehensive design doc)
