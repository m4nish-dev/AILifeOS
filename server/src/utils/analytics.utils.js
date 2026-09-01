export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return getStartOfDay(new Date(d.setDate(diff)));
};

export const percentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
};

export const streakFromDates = (datesStrArray) => {
  if (!datesStrArray || datesStrArray.length === 0) return 0;
  
  const sortedDates = [...new Set(datesStrArray)].sort().reverse();
  
  let streak = 0;
  let expectedDate = new Date();
  
  // Check if today or yesterday is the first element
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  if (sortedDates[0] === todayStr) {
    streak = 1;
    expectedDate = yesterday;
  } else if (sortedDates[0] === yesterdayStr) {
    streak = 1;
    expectedDate = new Date(yesterday);
    expectedDate.setDate(expectedDate.getDate() - 1);
  } else {
    return 0; // Streak is broken
  }
  
  for (let i = 1; i < sortedDates.length; i++) {
    if (sortedDates[i] === expectedDate.toISOString().slice(0, 10)) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};
