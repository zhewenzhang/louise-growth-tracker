import { calculatePercentile, whoWeightData, whoHeightData, whoHeadCircumferenceData } from '../utils/whoData';

// Custom hook to calculate percentile for a given record
export const useWHOPercentile = (value, type, birthDate) => {
  if (!value || !type || !birthDate) return null;

  const birthDateObj = new Date(birthDate);
  const today = new Date();
  const monthAge = (today.getFullYear() - birthDateObj.getFullYear()) * 12 + (today.getMonth() - birthDateObj.getMonth());

  return calculatePercentile(value, type, monthAge);
};

export default useWHOPercentile;
