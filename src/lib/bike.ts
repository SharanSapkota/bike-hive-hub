export const normalizeBike = (bike: any): any => {
    const fallbackLocation =
      bike?.location ??
      bike?.bikeAddress ??
      bike?.address ??
      bike?.bikeLocation ?? {
        lat: bike?.latitude,
        lng: bike?.longitude,
        city: bike?.city,
        state: bike?.state,
      };
  
    const rawImages =
      bike?.images ??
      bike?.bikeImages ??
      bike?.media ??
      bike?.photos ??
      [];
  
    const parsedImages = Array.isArray(rawImages)
      ? rawImages
          .map((image: any) => {
            if (typeof image === "string") {
              return image;
            }
            const imageUrl =
              image?.imageUrl ?? image?.url ?? image?.src ?? image?.path;
            return typeof imageUrl === "string" ? imageUrl : null;
          })
          .filter(Boolean)
      : [];
  
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
      pricePerHour: Number(bike?.pricePerHour ?? bike?.rentAmount ?? 0),
      category:
        typeof bike?.category === "string"
          ? bike.category
          : bike?.category?.name ?? "General",
      available:
        typeof bike?.available === "boolean"
          ? bike.available
          : bike?.status
          ? String(bike.status).toUpperCase() === "AVAILABLE"
          : true,
      images: parsedImages as string[],
      condition: bike?.condition ?? bike?.bikeCondition ?? undefined,
      reviews: bike?.reviews ?? bike?.reviewCount ?? undefined,
      rating: bike?.rating ?? bike?.averageRating ?? undefined,
    };
  };