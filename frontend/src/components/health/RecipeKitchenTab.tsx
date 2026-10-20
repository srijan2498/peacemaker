import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TheMealDbRecipe } from 'cozynest-shared';
import { freeSourcesService } from '../../services/freeSourcesService';
import {
  UtensilsCrossed,
  Users,
  Clock,
  Sparkles,
  Flame,
  ChefHat,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  CheckCircle2,
  Info,
  Scale,
  Search,
  ExternalLink,
  Youtube,
  Globe,
  Loader2,
  X,
  BookOpen
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

export const RecipeKitchenTab: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [servings, setServings] = useState<number>(2);
  const [selectedMeal, setSelectedMeal] = useState<TheMealDbRecipe | null>(null);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when category or cuisine filter changes
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleCuisineChange = (c: string) => {
    setSelectedCuisine(c);
    setCurrentPage(1);
  };

  // Fetch TheMealDB recipes with full catalog (1,261+ recipes) and live API search
  const { data: recipeData, isLoading, isFetching } = useQuery({
    queryKey: ['mealdb-recipes', debouncedQuery, selectedCategory, selectedCuisine, currentPage],
    queryFn: () =>
      freeSourcesService.searchRecipes({
        q: debouncedQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        cuisine: selectedCuisine === 'all' ? undefined : selectedCuisine,
        page: currentPage,
        limit: 24
      }),
    staleTime: 1000 * 60 * 5
  });

  const recipes: TheMealDbRecipe[] = recipeData?.recipes || [];
  const totalRecipes: number = recipeData?.total || 0;
  const totalPages: number = recipeData?.totalPages || 1;
  const categoriesList: string[] = ['All', ...(recipeData?.categories || [])];
  const cuisinesList: string[] = ['All', ...(recipeData?.cuisines || [])];

  // Active meal for detailed inspection
  const activeMeal = selectedMeal || recipes[0] || null;

  // Servings handler
  const handleServingChange = (delta: number) => {
    setServings(prev => Math.min(24, Math.max(1, prev + delta)));
  };

  // Nutrition base calculations
  const baseServings = activeMeal?.baseServings || 2;
  const nutritionBase = activeMeal?.nutritionPerServing;

  const scaledCalories = Math.round((nutritionBase?.caloriesKcal || 380) * (servings / baseServings));
  const scaledCarbs = Math.round((nutritionBase?.carbsG || 35) * (servings / baseServings));
  const scaledProtein = Math.round((nutritionBase?.proteinG || 28) * (servings / baseServings));
  const scaledFat = Math.round((nutritionBase?.fatG || 14) * (servings / baseServings));
  const scaledFiber = parseFloat((((nutritionBase?.fiberG || 5.0) * (servings / baseServings))).toFixed(1));
  const scaledIron = parseFloat((((nutritionBase?.ironMg || 2.8) * (servings / baseServings))).toFixed(1));
  const scaledCalcium = Math.round((nutritionBase?.calciumMg || 75) * (servings / baseServings));
  const scaledPotassium = Math.round((nutritionBase?.potassiumMg || 520) * (servings / baseServings));
  const scaledMagnesium = Math.round((nutritionBase?.magnesiumMg || 55) * (servings / baseServings));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Dataset Statistics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-200/50 dark:border-amber-900/30">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-600" />
              <span>TheMealDB Worldwide Recipe Kitchen</span>
            </h3>
            <Badge variant="mint" size="sm" className="font-bold">
              1,260+ RECIPES LIVE
            </Badge>
          </div>
          <p className="text-xs text-cozy-muted mt-0.5">
            Real-time live queries connected to <strong className="text-amber-700 dark:text-amber-300">https://www.themealdb.com/api</strong> with unabridged world recipes, ingredient breakdowns, and mathematical people scaling!
          </p>
        </div>

        {/* Global Catalog Counter */}
        <div className="flex items-center gap-2 p-2 px-3.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-amber-200/60 dark:border-amber-900/30 text-xs shadow-soft-sm shrink-0">
          <Globe className="w-4 h-4 text-amber-500 animate-pulse" />
          <div className="text-right">
            <span className="font-black text-cozy-text dark:text-cozy-darkText block text-sm">
              {totalRecipes.toLocaleString()} Dishes
            </span>
            <span className="text-[10px] text-cozy-muted font-bold block">
              TheMealDB API Catalog
            </span>
          </div>
        </div>
      </div>

      {/* Live Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Live Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-cozy-muted" />
            <input
              type="text"
              placeholder="Search recipes via TheMealDB API (e.g. Chicken, Biryani, Pasta, Salmon, Curry, Tacos, Cake)..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 text-xs font-medium text-cozy-text dark:text-cozy-darkText placeholder:text-cozy-muted outline-none focus:border-amber-500 transition-all shadow-soft-sm"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-3 text-cozy-muted hover:text-cozy-text"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {(isLoading || isFetching) && (
              <Loader2 className="w-4 h-4 absolute right-9 top-3 text-amber-500 animate-spin" />
            )}
          </div>
        </div>

        {/* Category Filter Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-cozy-muted uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-amber-500 text-white shadow-soft-sm scale-[1.02]'
                  : 'bg-white dark:bg-cozy-darkCard text-cozy-muted hover:text-cozy-text border border-purple-100 dark:border-purple-900/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Cuisine Filter Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-cozy-muted uppercase tracking-wider shrink-0 mr-1">
            Cuisine:
          </span>
          {cuisinesList.map(c => (
            <button
              key={c}
              onClick={() => handleCuisineChange(c)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                selectedCuisine.toLowerCase() === c.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-soft-sm scale-[1.02]'
                  : 'bg-white dark:bg-cozy-darkCard text-cozy-muted hover:text-cozy-text border border-purple-100 dark:border-purple-900/30'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recipe Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recipe Selection Cards & Pagination */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-cozy-muted uppercase tracking-wider">
              Recipes ({totalRecipes.toLocaleString()} Found)
            </h4>
            <span className="text-[11px] text-cozy-muted font-bold">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Recipe List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {recipes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30">
                <ChefHat className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                  No recipes found matching your search.
                </p>
                <p className="text-[11px] text-cozy-muted mt-1">
                  Try clearing your search query or selecting "All" categories.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    setSelectedCategory('all');
                    setSelectedCuisine('all');
                  }}
                  className="mt-3 text-xs"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              recipes.map(recipe => {
                const isSelected = activeMeal?.mealId === recipe.mealId;
                return (
                  <div
                    key={recipe.mealId}
                    onClick={() => {
                      setSelectedMeal(recipe);
                      setServings(recipe.baseServings || 2);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-soft-sm ring-1 ring-amber-500/40'
                        : 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-cozy-darkCard hover:border-amber-300'
                    }`}
                  >
                    <img
                      src={recipe.thumbnailUrl}
                      alt={recipe.name}
                      loading="lazy"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-soft-sm bg-slate-100 dark:bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block truncate">
                        {recipe.cuisine} • {recipe.category}
                      </span>
                      <h5 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate mt-0.5">
                        {recipe.name}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-cozy-muted">
                        <span className="font-semibold text-rose-600">
                          ~{recipe.nutritionPerServing.caloriesKcal} kcal
                        </span>
                        <span>•</span>
                        <span>{recipe.ingredients.length} ingredients</span>
                      </div>
                    </div>
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 text-xs py-1 px-2.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </Button>

              <div className="flex items-center gap-1 text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 text-xs py-1 px-2.5"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Active Scaled Recipe Canvas */}
        <div className="lg:col-span-2 space-y-5">
          {activeMeal ? (
            <Card className="p-6 border-amber-100 dark:border-amber-950/40 bg-white dark:bg-cozy-darkCard space-y-6 shadow-soft-sm">
              {/* Recipe Header & Interactive Servings Scaler */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-50 dark:border-purple-900/20">
                <div className="flex items-start gap-4">
                  {activeMeal.thumbnailUrl && (
                    <img
                      src={activeMeal.thumbnailUrl}
                      alt={activeMeal.name}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-soft-sm border border-amber-200/50"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="peach" size="sm" className="font-bold">
                        {activeMeal.cuisine}
                      </Badge>
                      <Badge variant="mint" size="sm" className="font-bold">
                        {activeMeal.category}
                      </Badge>
                      <span className="text-[10px] text-cozy-muted font-bold">
                        ID: #{activeMeal.mealId}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-cozy-text dark:text-cozy-darkText tracking-tight mt-1">
                      {activeMeal.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-cozy-muted mt-1">
                      <span>Base recipe: {baseServings} servings</span>
                      {activeMeal.youtubeUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={activeMeal.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <Youtube className="w-3.5 h-3.5" />
                            <span>Watch on YouTube</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic People / Servings Scaler */}
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-3 shrink-0 shadow-soft-sm">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1 pl-1">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Exact Servings:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleServingChange(-1)}
                      disabled={servings <= 1}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-cozy-darkCard border border-amber-200 text-amber-800 flex items-center justify-center font-bold hover:bg-amber-100 disabled:opacity-40 transition-colors"
                      title="Decrease servings"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-black text-amber-900 dark:text-amber-100">
                      {servings}
                    </span>
                    <button
                      onClick={() => handleServingChange(1)}
                      disabled={servings >= 24}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-cozy-darkCard border border-amber-200 text-amber-800 flex items-center justify-center font-bold hover:bg-amber-100 disabled:opacity-40 transition-colors"
                      title="Increase servings"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-cozy-muted pr-1">People</span>
                </div>
              </div>

              {/* Scaled Nutritional & Minerals Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/60 via-purple-50/40 to-emerald-50/50 dark:from-slate-800/60 dark:to-slate-800/40 border border-amber-100 dark:border-amber-900/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Total Nutrition for {servings} People ({nutritionBase?.caloriesKcal} kcal/person)</span>
                  </span>
                  <span className="font-black text-amber-700 dark:text-amber-300 text-sm">
                    {scaledCalories} Total kcal
                  </span>
                </div>

                {/* Macros Row */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-cozy-darkCard border border-purple-50 dark:border-purple-900/30">
                    <span className="text-[10px] text-cozy-muted block">Total Carbs</span>
                    <span className="font-bold text-sky-600">{scaledCarbs}g</span>
                    <span className="text-[9px] text-cozy-muted block">({nutritionBase?.carbsG}g/person)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-cozy-darkCard border border-purple-50 dark:border-purple-900/30">
                    <span className="text-[10px] text-cozy-muted block">Total Protein</span>
                    <span className="font-bold text-emerald-600">{scaledProtein}g</span>
                    <span className="text-[9px] text-cozy-muted block">({nutritionBase?.proteinG}g/person)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-cozy-darkCard border border-purple-50 dark:border-purple-900/30">
                    <span className="text-[10px] text-cozy-muted block">Total Fats</span>
                    <span className="font-bold text-amber-600">{scaledFat}g</span>
                    <span className="text-[9px] text-cozy-muted block">({nutritionBase?.fatG}g/person)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-cozy-darkCard border border-purple-50 dark:border-purple-900/30">
                    <span className="text-[10px] text-cozy-muted block">Dietary Fiber</span>
                    <span className="font-bold text-purple-600">{scaledFiber}g</span>
                    <span className="text-[9px] text-cozy-muted block">({nutritionBase?.fiberG}g/person)</span>
                  </div>
                </div>

                {/* Scaled Essential Minerals */}
                <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-cozy-muted pt-1 border-t border-amber-200/40 dark:border-amber-900/20">
                  <span>Essential Minerals for Batch:</span>
                  <span className="text-amber-800 dark:text-amber-200">
                    Fe: <strong>{scaledIron}mg</strong> • Ca: <strong>{scaledCalcium}mg</strong> • K: <strong>{scaledPotassium}mg</strong> • Mg: <strong>{scaledMagnesium}mg</strong>
                  </span>
                </div>
              </div>

              {/* Scaled Ingredients Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-cozy-lavender" />
                    <span>Scaled Ingredients for {servings} People</span>
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = (activeMeal.ingredients || [])
                        .map(ing => {
                          const scaledQty = Math.round((ing.amount * (servings / baseServings)) * 10) / 10;
                          return `• ${ing.name}: ${scaledQty > 0 ? `${scaledQty} ${ing.unit}` : ing.measure}`;
                        })
                        .join('\n');
                      navigator.clipboard.writeText(text);
                      toast.success('Ingredients copied to grocery clipboard.');
                    }}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300"
                  >
                    Copy to Grocery List
                  </Button>
                </div>

                <div className="rounded-2xl border border-purple-100 dark:border-purple-900/30 overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-cozy-muted font-bold border-b border-purple-50 dark:border-purple-900/20">
                        <th className="p-3">Ingredient</th>
                        <th className="p-3 text-right">Exact Quantity</th>
                        <th className="p-3">Prep Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeMeal.ingredients || []).map((ing, i) => {
                        const scaledQty = Math.round((ing.amount * (servings / baseServings)) * 10) / 10;
                        const unit = ing.unit || '';

                        return (
                          <tr
                            key={i}
                            className="border-b border-purple-50 dark:border-purple-900/10 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors"
                          >
                            <td className="p-3 font-semibold text-cozy-text dark:text-cozy-darkText">
                              {ing.name}
                            </td>
                            <td className="p-3 text-right font-black text-amber-700 dark:text-amber-300">
                              {scaledQty > 0 ? `${scaledQty} ${unit}` : ing.measure}
                            </td>
                            <td className="p-3 text-cozy-muted text-[11px]">
                              {ing.measure || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cooking Instructions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>Step-by-Step Cooking Instructions</span>
                </h4>

                <div className="space-y-2">
                  {(activeMeal.instructions || []).map((step, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/20 flex items-start gap-3 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-cozy-text dark:text-cozy-darkText leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-dashed border-2 border-purple-100 dark:border-purple-900/30">
              <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                Select a recipe from the list to view its scaled ingredients and instructions
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
