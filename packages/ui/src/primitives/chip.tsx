import { Pressable, type PressableProps } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export function Chip({ label, selected = false, disabled = false, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => ({
        paddingVertical: tokens.spacing[2],
        paddingHorizontal: tokens.spacing[4],
        borderRadius: tokens.radii.pill,
        backgroundColor: selected ? tokens.colors.accent.primary : tokens.colors.surface.solid,
        borderWidth: 1,
        borderColor: selected ? tokens.colors.accent.primary : tokens.colors.border.default,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text variant="label" tone={selected ? 'onHero' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}
