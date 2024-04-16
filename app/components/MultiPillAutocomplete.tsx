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
  HStack,
  Input,
  MenuDivider,
  FormErrorMessage,
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

export const MultiPillAutocomplete: React.FC<Props> = ({
  name,
  label,
  helperText,
  options,
  isRequired,
  ...rest
}) => {
  const { error } = useField(name);
  const [selectedOptions, setSelectedOptions] = useControlField(name);
  const [search, setSearch] = useState('');

  console.log('Multi options', options)

  const { setTouched } = useField(name)

  // Filter available options based on search and already selected options
  const availableOptions = options.filter(option => !(selectedOptions as string[])?.includes(option.value));
  const filteredOptions = availableOptions.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );  

  // Handling addition and removal of options
  const addOption = (value: string) => {
    console.log('addOption', value)
    const newSelectedOptions = [...(selectedOptions || []), value];
    setSelectedOptions(newSelectedOptions);
    setTouched(true) // Mark the field as touched
  };

  const removeOption = (value: string) => {
    const newSelectedOptions = (selectedOptions || []).filter(option => option !== value);
    setSelectedOptions(newSelectedOptions);
    setTouched(true) // Mark the field as touched
  };

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} {...rest}>
      {label && <FormLabel>{label}</FormLabel>}
      <Wrap spacing={1}>
        {(selectedOptions || []).map((selectedOption, index) => (
          <WrapItem key={selectedOption}>
            <input
              type="hidden"
              name={`${name}[${index}]`}
              value={selectedOption}
            />
            <Badge rounded={8}>
              <HStack h={10}>
                <Text pl={2}>
                  {options.find(option => option.value === selectedOption)?.label}
                </Text>
                <IconButton
                  icon={<CloseIcon />}
                  onClick={() => removeOption(selectedOption)}
                  aria-label="Remove"
                  size={'sm'}
                />
              </HStack>
            </Badge>
          </WrapItem>
        ))}
        <WrapItem>
          <Menu onClose={() => setSearch('')}>
            <MenuButton as={IconButton} size={'md'} icon={<AddIcon />} />
            <MenuList maxHeight={400} overflow={'auto'} pt={0}>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
              />
              {filteredOptions.map(option => (
                <MenuItem key={option.value} onClick={() => addOption(option.value)}>
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
