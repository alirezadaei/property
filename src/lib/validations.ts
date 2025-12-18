import { z } from "zod";

export const listingQuerySchema = z.object({
  q: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  beds_min: z.coerce.number().int().optional(),
  baths_min: z.coerce.number().int().optional(),
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius_km: z.coerce.number().default(5),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const savedSearchSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    q: z.string().optional(),
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    beds_min: z.number().int().optional(),
    baths_min: z.number().int().optional(),
    center_lat: z.number().optional(),
    center_lng: z.number().optional(),
    radius_km: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.min_price && data.max_price) {
        return data.min_price <= data.max_price;
      }
      return true;
    },
    {
      message: "Minimum price must be less than or equal to maximum price",
      path: ["min_price"],
    }
  );
