import { useQuery } from "@tanstack/react-query";
import { getClient } from "../apollo-client";
import { GET_CATEGORIES } from "../queries";
import { CategoryAdded } from "@/types";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const client = getClient();
      const { data } = await client.query({
        query: GET_CATEGORIES,
      });

      return data.categoryAddeds.map((cat: CategoryAdded) => ({
        id: cat.category,
        name: cat.name
      }));
    }
  });
}