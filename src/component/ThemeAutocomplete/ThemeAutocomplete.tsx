// Create a new component ThemeAutocomplete.tsx
import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import ThemeInput from '../common_component/themeinput';
// import { ThemeInput, ThemeInputProps } from './ThemeInput';

interface ThemeAutocompleteProps extends ThemeInputProps {
  options: string[];
  inputValue: string;
  onInputChange: (event: any, newInputValue: string) => void;
}

export const ThemeAutocomplete: React.FC<ThemeAutocompleteProps> = ({
  options,
  inputValue,
  onInputChange,
  ...props
}) => {
  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={inputValue}
      onInputChange={onInputChange}
      renderInput={(params) => (
        <ThemeInput
          {...params}
          {...props}
        />
      )}
    />
  );
};