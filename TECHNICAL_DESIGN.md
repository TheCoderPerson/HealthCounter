# HealthCounter Technical Design Document

## 1. PROJECT OVERVIEW

**Name:** HealthCounter
**Purpose:** A PWA (Progressive Web App) for tracking nutrition and meals with barcode scanning capabilities
**Key Features:**
- Barcode scanning with automatic product lookup
- Meal entry logging organized by meal type (breakfast, lunch, dinner, snack)
- Comprehensive nutrient tracking (macros, minerals, vitamins)
- Recipe creation and management
- Favorites/Recents tracking
- Offline-first with PWA support
- Multi-source food database integration

**Target Users:** Health-conscious individuals, athletes, and nutrition-focused users

**Repository:** GitHub (TheCoderPerson/HealthCounter)
**Deployment:** GitHub Pages (https://healthcounter.netlify.com or similar)

---

## 2. TECHNOLOGY STACK

### Frontend Framework
- **React 19.1.1** - UI library with latest features
- **TypeScript 5.9.3** - Type-safe development
- **React Router DOM 7.9.5** - Client-side routing and navigation

### Build & Development Tools
- **Vite 7.1.7** - Lightning-fast build tool and dev server
- **PostCSS 8.5.6** - CSS transformation pipeline
- **Tailwind CSS 3.4.16** - Utility-first CSS framework
- **Autoprefixer 10.4.21** - Browser prefix automation

### Linting & Code Quality
- **ESLint 9.36.0** - Code linting
- **TypeScript ESLint 8.45.0** - TS-specific linting rules
- **ESLint plugin react-hooks 5.2.0** - React hooks linting
- **ESLint plugin react-refresh 0.4.22** - Fast Refresh support

### Database & State Management
- **Dexie 4.2.1** - IndexedDB wrapper for local database (primary storage)
- **dexie-react-hooks 4.2.0** - React integration for Dexie
- **zustand 5.0.8** - Lightweight state management (available but not yet used)

### Barcode Scanning
- **@zxing/browser 0.1.5** - ZXing barcode detection library
- **Web Camera API** - Native browser camera access

### PWA & Offline Support
- **vite-plugin-pwa 1.1.0** - PWA generation and management
- **workbox-window 7.3.0** - Service Worker communication

### Utilities
- **uuid 13.0.0** - Unique ID generation
- **zod 4.1.12** - Schema validation library (available but not heavily used)

### Node Version
- **Node 20 LTS** (specified in GitHub Actions workflow)

---

## 3. COMPLETE FILE STRUCTURE

```
/home/user/HealthCounter/
├── public/                              # Static assets for PWA
│   └── vite.svg                        # Vite logo
│
├── src/
│   ├── api/                            # External API integrations
│   │   ├── openFoodFacts.ts            # Open Food Facts API client
│   │   └── foodDataCentral.ts          # USDA FDC API client
│   │
│   ├── components/                     # Reusable React components
│   │   ├── Navigation.tsx              # Bottom navigation bar
│   │   └── BarcodeScanner.tsx          # Camera-based barcode scanner
│   │
│   ├── db/                             # Database layer (Dexie)
│   │   ├── database.ts                 # DB schema and initialization
│   │   ├── entryRepository.ts          # Meal entry operations
│   │   ├── foodRepository.ts           # Food item CRUD operations
│   │   ├── favoritesRepository.ts      # Favorites management
│   │   └── recipeRepository.ts         # Recipe CRUD operations
│   │
│   ├── domain/                         # Business logic & calculations
│   │   ├── nutrition.ts                # Nutrient calculations
│   │   └── units.ts                    # Unit conversion utilities
│   │
│   ├── pages/                          # Page components (routes)
│   │   ├── TodayPage.tsx               # Daily summary & entry display
│   │   ├── SearchPage.tsx              # Multi-source food search
│   │   ├── ScanPage.tsx                # Barcode scanning interface
│   │   ├── FoodDetailPage.tsx          # Food details & entry creation
│   │   ├── RecipesPage.tsx             # Recipe list management
│   │   ├── RecipeDetailPage.tsx        # Recipe creation & editing
│   │   ├── ManualFoodPage.tsx          # Manual food entry
│   │   └── SettingsPage.tsx            # App settings & API keys
│   │
│   ├── types/                          # TypeScript type definitions
│   │   ├── index.ts                    # Core data structures
│   │   └── nutrients.ts                # Nutrient types & labels
│   │
│   ├── utils/                          # Utility functions
│   │   └── settings.ts                 # LocalStorage-based settings
│   │
│   ├── assets/                         # Image assets
│   ├── App.tsx                         # Main app component & routing
│   ├── App.css                         # App-level styles (legacy)
│   ├── index.css                       # Global styles + Tailwind imports
│   ├── main.tsx                        # React DOM entry point
│   └── vite-env.d.ts                   # Vite environment types
│
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Pages deploy workflow
│
├── .gitignore                          # Git ignore patterns
├── eslint.config.js                    # ESLint configuration
├── index.html                          # HTML entry point
├── package.json                        # Dependencies & scripts
├── package-lock.json                   # Locked dependency versions
├── postcss.config.js                   # PostCSS configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript root configuration
├── tsconfig.app.json                   # Application TS config (ES2022)
├── tsconfig.node.json                  # Build tools TS config
├── vite.config.ts                      # Vite build configuration
└── README.md                           # Project documentation
```

**Key Directory Purposes:**

- **`/api`** - External service clients (RESTful API wrappers)
- **`/db`** - Repository pattern: data access layer with Dexie
- **`/domain`** - Domain-driven design: pure business logic (no React dependencies)
- **`/pages`** - Page-level components corresponding to routes
- **`/types`** - Shared TypeScript interfaces and types

---

## 4. DATA STRUCTURES & TYPE SYSTEM

### Core Data Models (from `/src/types/index.ts`)

#### **Food Entity**
```typescript
interface Food {
  id: string;                    // UUID
  name: string;
  brand?: string;
  source: 'OFF' | 'FDC' | 'USER'; // Data source
  source_key?: string;           // OFF barcode or FDC ID
  state: 'raw' | 'cooked' | null;
  grams_per_serving?: number;
  grams_per_piece?: number;
  density_g_per_ml?: number | null;
  confidence: 'exact_label' | 'exact_db' | 'user_edited' | 'generic_mapped';
  created_at: string;            // ISO 8601
  updated_at: string;
  last_checked_at?: string;
  country_hint?: string;
}
```

#### **Nutrients**
```typescript
interface Nutrients {
  food_id: string;
  nutrients: NutrientsPer100g;   // Per 100g values
}

type NutrientsPer100g = Partial<Record<NutrientKey, number>>;

// Supported nutrients: 37 total
// Macros: kcal, protein_g, fat_g, carbs_g
// Fiber & Sugar: fiber_g, sugar_g, added_sugar_g
// Fats: sat_fat_g, mono_fat_g, poly_fat_g, trans_fat_g
// Minerals: sodium_mg, potassium_mg, calcium_mg, magnesium_mg, iron_mg, zinc_mg
// Vitamins: vitamin_d_ug, vitamin_a_rae, vitamin_e_mg, vitamin_k_ug, vitamin_c_mg,
//           thiamin_b1_mg, riboflavin_b2_mg, niacin_b3_mg, vitamin_b6_mg, 
//           folate_ug_dfe, vitamin_b12_ug
// Other: cholesterol_mg
```

#### **Entry (Logged Meal Item)**
```typescript
interface Entry {
  id: string;                    // UUID
  food_id: string;               // References Food.id
  grams: number;
  timestamp: string;             // ISO 8601
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  note?: string;
}
```

#### **Recipe**
```typescript
interface Recipe {
  id: string;                    // UUID
  name: string;
  servings: number;
  cooked_yield_g?: number;       // Total grams after cooking
  created_at: string;
  updated_at: string;
}

interface RecipeItem {
  id: string;
  recipe_id: string;
  food_id: string;
  grams: number;
}
```

#### **Favorites**
```typescript
interface Favorite {
  id: string;
  food_id?: string;              // Either food_id or recipe_id
  recipe_id?: string;
  created_at: string;
}
```

#### **Settings**
```typescript
interface Settings {
  id: string;                    // Always 'default'
  goals: Record<string, number | undefined>; // e.g., kcal, protein_g
  units: 'metric' | 'imperial';
  theme?: 'light' | 'dark' | 'auto';
}

interface AppSettings {
  fdcApiKey?: string;            // Stored in localStorage
}
```

#### **Display Models**
```typescript
interface FoodWithNutrients extends Food {
  nutrients: NutrientsPer100g;
}

interface EntryWithFood extends Entry {
  food: FoodWithNutrients;
}

interface RecipeWithItems extends Recipe {
  items: Array<RecipeItem & { food: FoodWithNutrients }>;
  totalNutrients?: NutrientsPer100g;
}

interface DailySummary {
  date: string;                  // YYYY-MM-DD
  entries: EntryWithFood[];
  totalNutrients: NutrientsPer100g;
  byMeal: Record<MealType, {
    entries: EntryWithFood[];
    nutrients: NutrientsPer100g;
  }>;
}
```

---

## 5. DATABASE ARCHITECTURE

### Database: Dexie (IndexedDB)

**Class:** `HealthCounterDB extends Dexie` (`/src/db/database.ts`)

#### **Tables & Indexes**
```
foods:
  - Primary Index: id
  - Secondary: name (string)
  - Compound: [brand+name] (compound for sorting)
  - Compound: [source+source_key] (lookup by barcode/FDC ID)
  - Secondary: created_at, updated_at (for sorting)

nutrients:
  - Primary Index: food_id (one-to-one with foods)

entries:
  - Primary Index: id
  - Secondary: food_id (lookup by food)
  - Secondary: timestamp (for date range queries)
  - Secondary: meal (filter by meal type)
  - Compound: [timestamp+meal] (combined filtering)

recipes:
  - Primary Index: id
  - Secondary: name
  - Secondary: created_at, updated_at

recipeItems:
  - Primary Index: id
  - Secondary: recipe_id (retrieve ingredients)
  - Secondary: food_id (find recipes using a food)

favorites:
  - Primary Index: id
  - Secondary: food_id
  - Secondary: recipe_id
  - Secondary: created_at

settings:
  - Primary Index: id
```

### Repository Pattern (Data Access Layer)

Each table has a dedicated repository module:

**1. FoodRepository** (`/src/db/foodRepository.ts`)
- `createFood(data, nutrients)` - Create with transaction
- `updateFood(id, updates, nutrientUpdates)` - Update with transaction
- `getFoodWithNutrients(id)` - Join nutrients
- `searchFoods(query, limit)` - Text search (local)
- `getFoodBySourceKey(source, key)` - Lookup by barcode/FDC ID
- `deleteFood(id)` - Soft delete with transaction

**2. EntryRepository** (`/src/db/entryRepository.ts`)
- `createEntry(foodId, grams, meal, note, timestamp)` - Log a meal
- `getEntriesByDate(date)` - Daily entries with food details
- `getEntriesByDateAndMeal(date, meal)` - Filter by meal type
- `updateEntry(id, updates)` - Update logged entry
- `deleteEntry(id)` - Remove entry
- `getRecentFoods(limit)` - Most recently logged foods

**3. RecipeRepository** (`/src/db/recipeRepository.ts`)
- `createRecipe(name, servings, cookedYieldG)` - Create recipe
- `updateRecipe(id, updates)` - Update recipe meta
- `addRecipeItem(recipeId, foodId, grams)` - Add ingredient
- `updateRecipeItem(id, grams)` - Adjust ingredient amount
- `deleteRecipeItem(id)` - Remove ingredient
- `getRecipeWithItems(id)` - Load with all ingredients and nutrients
- `getAllRecipes()` - List all recipes
- `deleteRecipe(id)` - Delete with transaction (cascades items)

**4. FavoritesRepository** (`/src/db/favoritesRepository.ts`)
- `addFavorite(foodId?, recipeId?)` - Add to favorites
- `removeFavorite(id)` - Remove by favorite ID
- `removeFavoriteByFoodId(foodId)` - Remove by food
- `removeFavoriteByRecipeId(recipeId)` - Remove by recipe
- `isFavorite(foodId?, recipeId?)` - Check if favorited
- `getFavoriteFoods()` - List all favorite foods
- `getFavoriteRecipes()` - List all favorite recipes

### Initialization
```typescript
initializeDatabase() {
  // Creates 'default' settings record on first run
  // Default goals: 2000 kcal, 150g protein
  // Units: metric
  // Theme: auto
}
```

---

## 6. ARCHITECTURE PATTERNS

### Pattern 1: Repository Pattern (Data Access Layer)
All database operations are abstracted in repository modules, providing a clean separation between UI and data concerns.

```
UI Layer (Pages) → Repository Layer (db/*) → Database (Dexie/IndexedDB)
```

### Pattern 2: Domain-Driven Design (Business Logic)
Pure business logic is isolated in `/domain` folder with no React dependencies:
- Nutrient calculations
- Unit conversions
- Nutritional aggregations

```
Pages/Components → Domain Functions (pure TS) → Database
```

### Pattern 3: Component Composition
Pages are functional components that compose smaller, focused components:
```
App (router) → Page Components → Sub-components (Navigation, BarcodeScanner)
```

### Pattern 4: Unidirectional Data Flow
- API/Database → Component State (useState) → Component Render
- No global state (Zustand not yet implemented)
- No Redux, Context API minimally used

### Pattern 5: API Abstraction
External APIs are wrapped in typed modules (`/api`):
- Handles API-specific data transformation
- Maps external data to internal types
- Error handling and retry logic

### Pattern 6: Settings as LocalStorage
User preferences stored in browser's localStorage:
```
Settings UI → saveSettings() → localStorage
           → getSettings() → Load on app start
```

---

## 7. STATE MANAGEMENT

### Current Approach: React Hooks (No Global State)
State is managed locally per-component using `useState` and `useEffect`:

**Example: TodayPage**
```typescript
const [summary, setSummary] = useState<DailySummary | null>(null);
const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

useEffect(() => {
  loadEntries();
}, [selectedDate]);
```

### Available but Not Used: Zustand
Zustand (v5.0.8) is available in package.json for future global state needs:
```typescript
import { create } from 'zustand';

// Future implementation:
const useStore = create((set) => ({
  selectedMeal: 'breakfast',
  setSelectedMeal: (meal) => set({ selectedMeal: meal }),
}));
```

### Settings Management
- LocalStorage API used for app settings
- Lives in `/utils/settings.ts`
- Loaded synchronously on app start
- Default API key: 'DEMO_KEY' (rate limited)

---

## 8. API INTEGRATIONS

### 1. Open Food Facts (OFF)
**File:** `/src/api/openFoodFacts.ts`
**Base URL:** `https://world.openfoodfacts.org`
**Authentication:** None required (free, no API key)
**Rate Limiting:** Unlimited
**Caching:** 30 days (via Workbox)

**Key Functions:**
```typescript
normalizeBarcode(barcode: string): string
lookupBarcode(barcode: string): Promise<FoodWithNutrients | null>
  // GET /api/v2/product/{barcode}.json
  
searchOFF(query: string, limit=20): Promise<FoodWithNutrients[]>
  // GET /cgi/search.pl (v1 API with CORS support)
  // Parameters: search_terms, page_size, fields
```

**Nutrient Mapping:**
- OFF stores per-100g values as: `{nutrient_key}_100g`
- Maps 37 nutrients from OFF format to canonical format
- Converts mineral units from grams to mg
- Falls back to empty object if no nutrients

**Data Quality:**
- Confidence: always 'exact_db' when lookup succeeds
- Includes brand, product name, serving size
- Country hint from tags

### 2. USDA FoodData Central (FDC)
**File:** `/src/api/foodDataCentral.ts`
**Base URL:** `https://api.nal.usda.gov/fdc/v1`
**Authentication:** API key (default: 'DEMO_KEY')
**Rate Limiting:** DEMO_KEY is very strict (~1 req/min), free key allows 1000/hour
**Caching:** 30 days (via Workbox)

**Key Functions:**
```typescript
searchFDC(query: string, limit=20): Promise<FoodWithNutrients[]>
  // GET /foods/search?query&pageSize&api_key&dataType
  
getFDCFood(fdcId: string): Promise<FoodWithNutrients | null>
  // GET /food/{fdcId}?api_key
```

**Nutrient Mapping:**
- FDC uses standardized nutrient IDs (e.g., 1008 for energy)
- Maps 37 FDC nutrient IDs to canonical format
- Most are already per-100g

**Data Quality:**
- More comprehensive nutrient data than OFF
- Foundation and SR Legacy food types prioritized
- Includes serving size info

### 3. API Error Handling
- Network errors logged with context
- Rate limit (429) handled with helpful messages
- CORS issues identified and logged
- Falls back gracefully to empty results
- User-friendly error messages in UI

---

## 9. BUILD & DEPLOYMENT

### Build Configuration (`vite.config.ts`)

**Build Process:**
1. TypeScript compilation: `tsc -b`
2. Vite bundling: `vite build`

**Build Outputs:**
- `/dist` - Static site files
- PWA manifest and service worker
- Optimized JS/CSS bundles

**Vite Plugins:**
1. **@vitejs/plugin-react** - Fast Refresh for React
2. **VitePWA** - PWA generation with Workbox

### PWA Configuration
```typescript
registerType: 'prompt'  // Users approve updates
manifest: {
  name: 'Health Counter'
  description: 'Track meals with barcode scans and get accurate macro and micro nutrition totals'
  icons: [192x192, 512x512 PNG]
  theme_color: '#ffffff'
}

workbox: {
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i
      handler: 'CacheFirst'
      maxEntries: 500
      maxAgeSeconds: 2592000  // 30 days
    },
    {
      urlPattern: /^https:\/\/api\.nal\.usda\.gov\/.*/i
      handler: 'CacheFirst'
      maxEntries: 500
      maxAgeSeconds: 2592000  // 30 days
    }
  ]
}
```

### GitHub Pages Deployment (`/.github/workflows/deploy.yml`)

**Trigger:** Push to 'Master' branch or manual dispatch

**Steps:**
1. Checkout code
2. Setup Node.js 20 + npm cache
3. Install dependencies: `npm ci`
4. Compile & build: `npm run build`
5. Configure GitHub Pages
6. Upload `/dist` artifacts
7. Deploy to GitHub Pages

**Base URL:** `/HealthCounter/` (in vite.config.ts)

---

## 10. NPM SCRIPTS & DEVELOPMENT

### Available Scripts
```json
{
  "dev": "vite",                    // Start dev server with HMR
  "build": "tsc -b && vite build", // Type check + production build
  "lint": "eslint .",               // Check code quality
  "preview": "vite preview"         // Preview production build locally
}
```

### Development Workflow
1. `npm install` - Install dependencies
2. `npm run dev` - Start Vite dev server (http://localhost:5173/)
3. Make changes - Hot Module Replacement reloads instantly
4. `npm run lint` - Check code quality before committing
5. `npm run build` - Build for production
6. Push to Master → GitHub Actions deploys

### Code Quality
- **ESLint:** Catches errors, unused variables, React hooks violations
- **TypeScript:** Strict mode enabled, unused params/locals flagged
- **Formatting:** No prettier (relies on ESLint)

---

## 11. KEY BUSINESS LOGIC

### Nutrient Calculation

**File:** `/src/domain/nutrition.ts`

```typescript
// Core calculation: scale per-100g values to actual grams
calculateNutrients(nutrientsPer100g, grams): NutrientsPer100g
  // For each nutrient: (value * grams) / 100

// Sum multiple nutrient records
sumNutrients(...nutrientArrays): NutrientsPer100g
  // Add all matching keys across arrays

// Daily totals from entries
calculateEntryTotals(entries: EntryWithFood[]): NutrientsPer100g

// Recipe totals
calculateRecipeTotals(recipe: RecipeWithItems): NutrientsPer100g

// Per-serving recipe breakdown
calculateRecipePerServing(recipe): NutrientsPer100g
  // Total / servings

// Per-100g of cooked weight
calculateRecipePer100g(recipe): NutrientsPer100g | null
  // (total * 100) / cooked_yield_g

// Format values for display
formatNutrientValue(value, decimals = 1): string
  // Intelligent decimals: 0.05 → "0.05", 100 → "100"

// Progress towards daily goals
calculateGoalPercentage(current, goal): number | null
  // (current / goal) * 100
```

### Unit Conversion

**File:** `/src/domain/units.ts`

**Conversion Factors:**
- 1 oz = 28.3495g
- 1 cup = 240 mL
- 1 tbsp = 15 mL
- 1 tsp = 5 mL
- Density: default 1.0 g/mL (water), customizable per food

**Key Functions:**
```typescript
toGrams(amount: Amount, food?: Food): number
  // Convert any unit to grams using density

gramsTo(grams: number, unit: UnitType, food?: Food): number
  // Convert grams to any unit

getAvailableUnits(food): UnitType[]
  // Dynamically determine which units apply

formatUnit(unit: UnitType, value: number): string
  // "2 cups" vs "1 cup"
```

---

## 12. ROUTING & NAVIGATION

**Router:** React Router DOM v7.9.5

**Routes:**

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | TodayPage | Daily nutrition summary, view/delete entries |
| `/search` | SearchPage | Multi-source food search (local/OFF/FDC), favorites, recent |
| `/scan` | ScanPage | Barcode scanner interface |
| `/food/:id` | FoodDetailPage | View food details, log entry with amount & meal |
| `/recipes` | RecipesPage | List user recipes |
| `/recipes/:id` | RecipeDetailPage | View/edit recipe, add ingredients, log servings |
| `/recipes/new` | RecipeDetailPage | Create new recipe |
| `/manual` | ManualFoodPage | Manually create custom food item |
| `/settings` | SettingsPage | API keys, PWA updates, theme |

**Navigation Component:** 
- Fixed bottom navigation bar
- 5 main tabs: Today, Search, Scan, Recipes, Settings
- Active state highlighting
- Uses React Router Link component

---

## 13. COMPONENTS

### Page Components (in `/pages/`)

#### **TodayPage.tsx** (129 lines)
- Displays daily summary with date picker
- Shows totals: kcal, protein, carbs, fat
- Lists entries organized by meal type
- Quick links to add items to each meal

#### **SearchPage.tsx** (300+ lines)
- **Multi-source search:** Local DB + Open Food Facts + FDC
- **Tabs:** All results, Favorites, Recent
- **Barcode detection:** If input is numeric, treats as barcode
- **Caching:** Saves remote results locally before navigation
- **Favorites toggle:** Add/remove from favorites

#### **ScanPage.tsx** (100+ lines)
- Barcode camera interface
- Async lookup: cache → OFF → navigate to food detail
- Error handling with retry flow
- Loading state during API calls

#### **FoodDetailPage.tsx** (300+ lines)
- Display full food info with badges (source, confidence)
- **Amount input:** Quantity + unit selector with quick buttons
- **Unit conversion:** Dynamically adjusts when changing units
- **Live nutrition preview:** Shows calculated nutrients for entered amount
- **Detailed nutrients:** Organized by category (macros, fats, minerals, vitamins)
- **Log entry:** Select meal type and submit

#### **RecipesPage.tsx** (90 lines)
- List all recipes with servings and cooked yield
- Create new recipe button
- Click recipe to edit/view details

#### **RecipeDetailPage.tsx** (250+ lines)
- Create or edit recipe
- Add ingredients (searchable)
- Ingredient quantity and removal
- Calculate totals per serving
- Log recipe as meals

#### **ManualFoodPage.tsx** (150+ lines)
- Form to create custom food item
- Basic info: name, brand, state (raw/cooked)
- Macro inputs: kcal, protein, fat, carbs, fiber, sugar
- Save to local database

#### **SettingsPage.tsx** (130+ lines)
- **API Keys:** USDA FDC key configuration
- **Info:** Open Food Facts requires no key
- **PWA Updates:** Check for updates, prompt user
- **Service Worker:** Registration and error handling

### Reusable Components (in `/components/`)

#### **Navigation.tsx** (38 lines)
- Bottom nav bar with 5 main routes
- Icon + label per item
- Active route highlighting
- Uses `useLocation()` hook

#### **BarcodeScanner.tsx** (160 lines)
- **ZXing camera integration:** Continuous barcode detection
- **Camera permission:** Request and handle denial
- **Scanning UI:** Guide box with corner markers
- **State management:** Start/stop controls
- **Event handling:** Prevent duplicate scans with flag

---

## 14. API DATA FLOW

### Barcode Lookup Flow
```
ScanPage
  ↓ (scan barcode)
openFoodFacts.lookupBarcode()
  ↓
getFoodBySourceKey() [check local cache]
  ↓ [if found]
  Navigate to FoodDetailPage with cached food ID
  ↓ [if not found]
  API call: GET /api/v2/product/{barcode}.json
  ↓
mapOFFNutrients() [transform to canonical format]
  ↓
createFood() [save to local DB with transaction]
  ↓
Navigate to FoodDetailPage with new food ID
```

### Text Search Flow
```
SearchPage
  ↓ (enter search query)
[Local search] searchFoods() [debounced 300ms]
  ↓ [results shown immediately]
  ↓ [user clicks "Search" or presses Enter]
  [Remote searches in parallel]
  Promise.all([
    searchFoods(),     // Local cache
    searchOFF(),       // Open Food Facts
    searchFDC()        // USDA FDC
  ])
  ↓
[Combine and deduplicate results]
  ↓
[User clicks food]
  ↓
[Check if already in local DB]
  ↓ [if exists]
  Navigate with existing food ID
  ↓ [if new]
  createFood() → Navigate with new ID
```

### Daily Summary Flow
```
TodayPage mounts/date changes
  ↓
getEntriesByDate(date)
  ↓
Query entries within [00:00, 23:59:59] of date
  ↓
Fetch full food details for each entry (getFoodWithNutrients)
  ↓
createDailySummary()
  ↓
Group entries by meal type
Calculate nutrients for each meal and total
  ↓
Display in grouped sections
```

---

## 15. SPECIAL FEATURES & PATTERNS

### Feature 1: Confidence Levels
Track data source reliability:
- `exact_label` - From product label (highest confidence)
- `exact_db` - From OFF or FDC database
- `user_edited` - Manually created
- `generic_mapped` - Estimated/generic (lowest confidence)

Displayed as color-coded badges in UI.

### Feature 2: Food Source Tracking
Maintains source information:
- `OFF` - Open Food Facts (with barcode)
- `FDC` - USDA FDC (with FDC ID)
- `USER` - Manually created

Enables deduplication and data quality analysis.

### Feature 3: Smart Caching
- Local IndexedDB for all data
- 30-day HTTP cache via Workbox for API responses
- Source-key lookup (barcode → food) prevents duplicates

### Feature 4: Recipe Flexibility
- **Per-serving:** Total ÷ servings
- **Per-100g:** (Total × 100) ÷ cooked_yield_g
- Choose how to log: whole recipe or servings

### Feature 5: Unit System
- **Weight:** g, oz
- **Volume:** mL, cups, tbsp, tsp (uses density)
- **Serving:** custom serving size if available
- **Piece:** count if available

Quick adjustment buttons (+/- appropriate amounts per unit).

### Feature 6: PWA Offline Support
- Service Worker caches app shell
- API responses cached 30 days
- IndexedDB works fully offline
- Can scan barcodes offline (camera doesn't need network)
- API calls work online, offline shows cached data

---

## 16. ERROR HANDLING STRATEGY

### API Errors
- **429 (Rate Limited):** Show user how to get API key
- **403 (Forbidden):** Indicate invalid API key
- **400 (Bad Request):** Log to console with details
- **Network Error:** Suggest checking connectivity

### Database Errors
- ConstraintError in React StrictMode: Ignore (double call)
- Transaction failures: Log and show user-friendly message
- IndexedDB quota exceeded: Clear message about storage

### User Input Validation
- Form fields check before submit
- Numbers parsed safely (NaN → undefined)
- Unit conversions wrapped in try-catch
- Amounts must be > 0

---

## 17. FILE SIZES & PERFORMANCE

**Total Lines of Code:** ~1972 (pages only, excluding dependencies)

**Module Sizes (approximate):**
- Pages: 1972 lines
- Repositories: 400 lines
- API clients: 400+ lines
- Utilities: 200+ lines
- Components: 200 lines

**Bundle Size:** Optimized by:
- Code splitting per route (Vite)
- Tree shaking of unused code
- Minification in production
- No heavy dependencies (Dexie is small)

---

## 18. DEVELOPMENT NOTES & RECENT HISTORY

### Recent Commits (Latest First)
```
19c31ab - Merge pull request #8: Fix Open Food Facts CORS
6ad9c73 - Use CORS-enabled v1 API for Open Food Facts search
595deab - Merge pull request #7: Debug OFF search
1908433 - Switch to search-a-licious API for better text search
7559fdd - Switch OFF to v1 API for text search support
f81f88e - Merge pull request #6: iOS GitHub Pages fix
393cb3a - Improve API search reliability
e5cd989 - Merge pull request #5: GitHub Pages setup
3ebe204 - Update package-lock.json
c1cd062 - Merge pull request #4: GitHub Pages setup
570f87e - Configure GitHub Pages deployment
6fd62e2 - Merge pull request #3: Work from master
74350a2 - Dynamic add/subtract buttons matching unit
30605a8 - Auto-convert amounts when switching units
286623f - Add cups, tbsp, tsp as unit options
83d69ca - Prefill serving size with food's default
38acbb9 - Add Settings page with API keys and PWA updates
f564dd4 - Update API endpoints and add User-Agent headers
85c768b - Prevent API rate limiting and scanner cleanup errors
```

### Key Development Patterns
1. **API Integration Issues:** Recent commits focused on fixing CORS issues with OFF
2. **Unit System:** Continuous improvements to unit conversion and display
3. **Feature Additions:** Settings, PWA updates, better barcode handling
4. **Bug Fixes:** React StrictMode compatibility, memory leaks in scanner

### Known Limitations
- Zustand available but not used (state is local per component)
- No offline-first fallback for real-time sync (not needed for this use case)
- Recipe cooked yield is optional, affects per-100g calculations
- Density defaults to 1.0 if not specified

---

## 19. CONTRIBUTOR GUIDELINES

### Code Organization
- Keep domain logic in `/domain` (pure TS functions)
- Keep API clients in `/api` (with full error handling)
- Repository pattern for all DB operations
- Component files in `/pages` or `/components`

### Adding a New Page
1. Create component in `/pages/YourPage.tsx`
2. Add route to `App.tsx`
3. Add navigation link to `Navigation.tsx`
4. Use repos for data access, domain functions for logic

### Adding a New External API
1. Create wrapper in `/api/yourApi.ts`
2. Handle data transformation to `FoodWithNutrients`
3. Include error handling with logging
4. Update SearchPage to include source

### Database Changes
1. Modify schema in `/db/database.ts`
2. Create/update repository in `/db/yourRepository.ts`
3. Update TypeScript types in `/types/index.ts`
4. Document new fields in this design doc

### Testing
- Currently no test suite (would be ideal to add)
- Manual testing via `npm run dev`
- Build verification: `npm run build`
- Linting check: `npm run lint`

---

## 20. FUTURE ENHANCEMENT OPPORTUNITIES

1. **Global State Management:** Implement Zustand store for meal selection, filters
2. **Testing:** Add Jest + React Testing Library
3. **Offline Sync:** Implement conflict resolution for data created offline
4. **Analytics:** Track popular foods, common meal patterns
5. **Social Features:** Share recipes, meal plans
6. **Export/Import:** Backup and restore full food database
7. **Machine Learning:** Meal photo recognition instead of barcode
8. **Nutrition Goals:** More detailed daily goals by nutrient
9. **Meal Planning:** Plan upcoming meals with shopping list
10. **Multi-Device Sync:** Cloud sync via Firebase or similar

---

**Document Version:** 1.0
**Last Updated:** November 2024
**Author:** Technical Documentation
**Repository:** https://github.com/TheCoderPerson/HealthCounter

