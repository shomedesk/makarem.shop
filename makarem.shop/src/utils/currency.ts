export function formatOMR(amount: number, isAr = false): string {
  const num = Number(amount || 0);
  const formatted = num.toFixed(3);
  return isAr ? `${formatted} ر.ع.` : `${formatted} OMR`;
}

export function formatBaisa(amount: number, isAr = false): string {
  const baisa = Math.round(Number(amount || 0) * 1000);
  return isAr ? `${baisa} بيسة` : `${baisa} Baisa`;
}
