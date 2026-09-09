"use client";

import * as React from "react";
import type { Catalog } from "@/lib/repo/catalog";
import type { Ingredient } from "@/lib/types";
import { normalizeText } from "@/lib/text";

type CatalogValue = Catalog & {
  ingredientMap: Map<string, Ingredient>;
  getIngredient: (id: string) => Ingredient | undefined;
  ingredientName: (id: string) => string;
  searchIngredients: (query: string, limit?: number) => Ingredient[];
  findIngredientByName: (name: string) => Ingredient | undefined;
};

const CatalogContext = React.createContext<CatalogValue | null>(null);

export function CatalogProvider({
  catalog,
  children,
}: {
  catalog: Catalog;
  children: React.ReactNode;
}) {
  const value = React.useMemo<CatalogValue>(() => {
    const ingredientMap = new Map(catalog.ingredients.map((i) => [i.id, i]));

    const searchIngredients = (query: string, limit = 6) => {
      const q = normalizeText(query);
      if (!q) return [];
      return catalog.ingredients
        .map((ingredient) => {
          const names = [ingredient.name, ...(ingredient.aliases ?? [])].map(
            normalizeText,
          );
          let score = -1;
          for (const name of names) {
            if (name === q) score = Math.max(score, 3);
            else if (name.startsWith(q)) score = Math.max(score, 2);
            else if (name.includes(q)) score = Math.max(score, 1);
          }
          return { ingredient, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.ingredient);
    };

    return {
      ...catalog,
      ingredientMap,
      getIngredient: (id) => ingredientMap.get(id),
      ingredientName: (id) => ingredientMap.get(id)?.name ?? id,
      searchIngredients,
      findIngredientByName: (name) => {
        const q = normalizeText(name);
        return catalog.ingredients.find((ingredient) =>
          [ingredient.name, ...(ingredient.aliases ?? [])].some(
            (value) => normalizeText(value) === q,
          ),
        );
      },
    };
  }, [catalog]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogValue {
  const ctx = React.useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog phải nằm trong <CatalogProvider>");
  return ctx;
}
