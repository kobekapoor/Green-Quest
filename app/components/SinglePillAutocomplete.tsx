import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  WrapItem,
  Wrap,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Badge,
  Text,
  Input,
  MenuDivider,
  FormErrorMessage,
  HStack,
} from '@chakra-ui/react';
import { useField, useControlField } from 'remix-validated-form';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { Fragment, useRef, useState } from 'react';

type Option = { value: string; label: string; group?: number };

interface Props {
  name: string;
  label?: string;
  helperText?: string;
  options: Option[];
  isRequired?: boolean;
}

export const SinglePillAutocomplete: React.FC<Props> = ({
  name,
  label,
  helperText,
  options,
  isRequired,
  ...rest
}) => {
  const { error } = useField(name);
  const [selectedOption, setSelectedOption] = useControlField<string>(name);

  
  console.log('Single select options', options)
  
  const [search, setSearch] = useState('');
  const { setTouched } = useField(name)
  // Filter available options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  // Updated to ensure we don't end up with a null value
  const selectOption = (value: string) => {
    setSelectedOption(value || ''); // Fallback to an empty string if value is somehow null or falsy
    setTouched(true) // Mark the field as touched
  };

  // Option to clear the selection
  const clearSelection = () => {
    setSelectedOption('');
    setTouched(true) // Mark the field as touched
  };

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} {...rest}>
      {label && <FormLabel>{label}</FormLabel>}
      <Wrap spacing={1}>
        {selectedOption && (
          <WrapItem>
            <input
              type="hidden"
              name={name}
              value={selectedOption}
            />
            <Badge rounded={8}>
              <HStack h={10}>
                <Text pl={2}>
                  {options.find(option => option.value === selectedOption)?.label}
                </Text>
                <IconButton
                  icon={<CloseIcon />}
                  onClick={() => clearSelection()}
                  aria-label="Remove"
                  size={'sm'}
                />
              </HStack>
            </Badge>
          </WrapItem>
        )}
        <WrapItem>
          <Menu onClose={() => setSearch('')}>
            {selectedOption ? null : <MenuButton as={IconButton} size={'md'} icon={<AddIcon />} />}
            <MenuList maxHeight={400} overflow={'auto'} pt={0}>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
              />
              {filteredOptions.map(option => (
                <MenuItem key={option.value} onClick={() => selectOption(option.value)}>
                  {option.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </WrapItem>
      </Wrap>
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
