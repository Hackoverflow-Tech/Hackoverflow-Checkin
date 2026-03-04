// Use the @/ absolute path to guarantee it finds your types folder
import { MealStatus } from "@/lib/types"; 

export const MEAL_LABELS: Record<keyof MealStatus, string> = {
  day1_dinner: "Day 1 - Dinner",
  day2_breakfast: "Day 2 - Breakfast",
  day2_lunch: "Day 2 - Lunch",
  day2_dinner: "Day 2 - Dinner",
  day3_breakfast: "Day 3 - Breakfast",
  day3_lunch: "Day 3 - Lunch",
};