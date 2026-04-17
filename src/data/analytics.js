// Analytics & reporting mock data

export const monthlyStats = [
  { month: 'Nov 2025', needsReported: 42, needsResolved: 28, volunteersActive: 12, avgResponseHours: 6.2 },
  { month: 'Dec 2025', needsReported: 55, needsResolved: 38, volunteersActive: 14, avgResponseHours: 5.1 },
  { month: 'Jan 2026', needsReported: 61, needsResolved: 45, volunteersActive: 15, avgResponseHours: 4.3 },
  { month: 'Feb 2026', needsReported: 78, needsResolved: 58, volunteersActive: 17, avgResponseHours: 3.8 },
  { month: 'Mar 2026', needsReported: 85, needsResolved: 67, volunteersActive: 19, avgResponseHours: 2.5 },
  { month: 'Apr 2026', needsReported: 35, needsResolved: 18, volunteersActive: 20, avgResponseHours: 1.8 },
];

export const categoryDistribution = [
  { category: 'Healthcare', count: 52, percentage: 22 },
  { category: 'Education', count: 38, percentage: 16 },
  { category: 'Water & Sanitation', count: 35, percentage: 15 },
  { category: 'Food Security', count: 32, percentage: 14 },
  { category: 'Shelter', count: 28, percentage: 12 },
  { category: 'Elder Care', count: 18, percentage: 8 },
  { category: 'Disability Support', count: 16, percentage: 7 },
  { category: 'Disaster Relief', count: 15, percentage: 6 },
];

export const geographicCoverage = [
  { state: 'Maharashtra', needs: 45, volunteers: 5, coverage: 78 },
  { state: 'Uttar Pradesh', needs: 38, volunteers: 3, coverage: 62 },
  { state: 'Tamil Nadu', needs: 30, volunteers: 3, coverage: 71 },
  { state: 'Karnataka', needs: 28, volunteers: 2, coverage: 65 },
  { state: 'West Bengal', needs: 25, volunteers: 3, coverage: 58 },
  { state: 'Rajasthan', needs: 22, volunteers: 2, coverage: 55 },
  { state: 'Gujarat', needs: 20, volunteers: 2, coverage: 60 },
  { state: 'Delhi', needs: 18, volunteers: 2, coverage: 72 },
  { state: 'Telangana', needs: 15, volunteers: 2, coverage: 68 },
  { state: 'Odisha', needs: 14, volunteers: 1, coverage: 45 },
];

export const kpiData = {
  totalNeedsReported: 356,
  totalNeedsResolved: 254,
  avgResponseTime: '28 min',
  volunteerUtilization: 78,
  activeVolunteers: 20,
  totalVolunteerHours: 3268,
  coordinatorNPS: 62,
  duplicateRate: 4.2,
};

export const leaderboard = [
  { rank: 1, volunteerId: 'V-020', name: 'Tara Bai', hours: 380, tasks: 60, rating: 4.5, city: 'Koraput' },
  { rank: 2, volunteerId: 'V-015', name: 'Vikram Singh', hours: 340, tasks: 48, rating: 4.7, city: 'Dehradun' },
  { rank: 3, volunteerId: 'V-006', name: 'Anjali Deshmukh', hours: 312, tasks: 52, rating: 4.9, city: 'Pune' },
  { rank: 4, volunteerId: 'V-010', name: 'Lakshmi Sundaram', hours: 278, tasks: 45, rating: 4.6, city: 'Hyderabad' },
  { rank: 5, volunteerId: 'V-003', name: 'Ravi Shankar', hours: 256, tasks: 41, rating: 4.6, city: 'Varanasi' },
  { rank: 6, volunteerId: 'V-007', name: 'Deepak Tiwari', hours: 230, tasks: 38, rating: 4.4, city: 'Lucknow' },
  { rank: 7, volunteerId: 'V-011', name: 'Amit Patel', hours: 195, tasks: 30, rating: 4.3, city: 'Ahmedabad' },
  { rank: 8, volunteerId: 'V-001', name: 'Arjun Mehta', hours: 187, tasks: 34, rating: 4.8, city: 'Mumbai' },
  { rank: 9, volunteerId: 'V-013', name: 'Manish Gupta', hours: 150, tasks: 25, rating: 4.8, city: 'Kolkata' },
  { rank: 10, volunteerId: 'V-004', name: 'Priya Sharma', hours: 145, tasks: 28, rating: 4.7, city: 'Delhi' },
];

export const weeklyTrend = [
  { week: 'W1 Mar', open: 12, resolved: 8 },
  { week: 'W2 Mar', open: 15, resolved: 11 },
  { week: 'W3 Mar', open: 18, resolved: 14 },
  { week: 'W4 Mar', open: 22, resolved: 19 },
  { week: 'W1 Apr', open: 20, resolved: 12 },
  { week: 'W2 Apr', open: 15, resolved: 6 },
];
