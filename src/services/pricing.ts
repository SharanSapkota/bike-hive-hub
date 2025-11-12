// Mock API for price calculation
export const calculatePrice = async (bikeId: string, startDate: Date, endDate: Date, pricePerDay: number): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Calculate number of days
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate total price (assuming 24 hours per day)
  const totalPrice = diffDays * pricePerDay;
  
  return totalPrice;
};
