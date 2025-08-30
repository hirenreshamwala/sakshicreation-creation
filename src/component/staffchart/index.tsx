import { Box, Typography } from '@mui/material'
import React from 'react'

const statsData = [
  { label: 'New Visit', value: 80, color: '#8B5CF6', key: 'newVisit' },
  { label: 'New customers', value: 18, color: '#22C55E', key: 'newCustomers' },
  { label: 'New party Added', value: 35, color: '#F59E42', key: 'newParty' },
  { label: 'No of orders', value: 86, color: '#F43F5E', key: 'orders' },
  { label: 'Amount of Business', value: 148000, color: '#FACC15', key: 'amount' },
];

const statsData2 = [
  { label: 'New Visit', value: 60, color: '#8B5CF6', key: 'newVisit' },
  { label: 'New customers', value: 25, color: '#22C55E', key: 'newCustomers' },
  { label: 'New party Added', value: 20, color: '#F59E42', key: 'newParty' },
  { label: 'No of orders', value: 70, color: '#F43F5E', key: 'orders' },
  { label: 'Amount of Business', value: 98000, color: '#FACC15', key: 'amount' },
];

// Accept tab as prop
const StaffChart = ({ tab = 0 }: { tab?: number }) => {
  const stats = tab === 0 ? statsData : statsData2;
  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={2} flexWrap="wrap" gap={2}>
      {stats.map((stat, idx) => (
        <Box key={stat.key} flex={1} minWidth={120} textAlign="center">
          <Typography fontWeight={600} fontSize={22} mb={0.5}>
            {stat.key === 'amount' ? `₹${stat.value.toLocaleString()}` : stat.value}
          </Typography>
          <Typography fontSize={13} color="#667085" mb={1}>
            {stat.label}
          </Typography>
          {/* Bar Chart */}
          <Box
            sx={{
              height: 120,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            {[80, 60, 100, 70, 90].map((val, i) => (
              <Box
                key={i}
                sx={{
                  width: 12,
                  height: `${70 + (val % 60)}px`,
                  background: ['#8B5CF6', '#22C55E', '#F59E42', '#F43F5E', '#FACC15'][i],
                  borderRadius: 2,
                  opacity: idx === i ? 1 : 0.5,
                }}
              />
            ))}
          </Box>
          {/* Legend */}
          <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={1}>
            <Box width={16} height={4} bgcolor={stat.color} borderRadius={2} />
            <Typography fontSize={12} color="#667085">{stat.label}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default StaffChart
