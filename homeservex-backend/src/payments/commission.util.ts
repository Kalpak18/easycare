export function calculateCommission(totalAmount: number, percentage: number) {
  const platformFee = Number(((totalAmount * percentage) / 100).toFixed(2));

  const providerAmount = Number((totalAmount - platformFee).toFixed(2));

  return { platformFee, providerAmount };
}
