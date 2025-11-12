export const normalizeBike = (bike: any): any => {
    const fallbackLocation =
      bike?.location
  
    return {
      id: String(bike?.id ?? ""),
      name: bike?.name ?? "Unknown bike",
      location: {
        lat: Number(
          fallbackLocation?.lat ??
            fallbackLocation?.latitude ??
            0,
        ),
        lng: Number(
          fallbackLocation?.lng ??
            fallbackLocation?.longitude ??
            0,
        ),
        city: fallbackLocation?.city ?? "",
        state: fallbackLocation?.state ?? "",
      },
      pricePerDay: Number(bike?.pricePerDay ?? bike?.rentAmount ?? 0),
      category: bike?.category?.name ?? "General",
      available: true,
      images: bike?.owner?.images ?? [],
      condition: bike?.condition ?? bike?.bikeCondition ?? undefined,
      reviews: bike?.reviews ?? bike?.reviewCount ?? undefined,
      rating: bike?.rating ?? bike?.averageRating ?? undefined,
    };
  };