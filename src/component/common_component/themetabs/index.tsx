import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { FaUser } from 'react-icons/fa';

export type TabItem = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};


interface ThemeTabsProps {
  value: string | number;
  onChange: (event: React.SyntheticEvent, newValue: string | number) => void;
  tabs: TabItem[];
}

const ThemeTabs: React.FC<ThemeTabsProps> = ({ value, onChange, tabs }) => {
  return (
    <Box
      sx={{
        border: '1px solid #9B7EE2',
        borderRadius: '12px',
        px: 1,
        py: 0.5,
        display: 'inline-block',
        background: '#F9FAFB',
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        TabIndicatorProps={{ style: { display: 'none' } }}
        sx={{
          '& .MuiTabs-flexContainer': { gap: 4 },
          '& .MuiTab-root': {
            minWidth: 'auto',
            minHeight: 32,
            px: 1.5,
            py: 0.5,
            fontWeight: 500,
            fontSize: 13,
            color: '#344054',
            borderRadius: '8px',
            textTransform: 'none',
            lineHeight: 1.4,
            mt: 1,
            display: 'flex',
            flexDirection: 'row', // icon left, label right
            alignItems: 'center', // vertically center
          },
          '& .Mui-selected': {
            backgroundColor: theme => theme.palette.primary.light,
            color: '#344054',
            fontWeight: 600,
          },
        }}
      >
{tabs.map((tab, index) => (
  <Tab
    key={index}
    value={tab.value} // ✅ this must match what's passed in props.value
    iconPosition="start"
     icon={React.isValidElement(tab.icon) ? tab.icon : <FaUser />}
    label={<span>{tab.label}</span>}
  />
))}

      </Tabs>
    </Box>
  );
};

export default ThemeTabs;
