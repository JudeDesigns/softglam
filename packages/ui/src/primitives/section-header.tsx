import type { ReactNode } from 'react';
import { View } from 'react-native';
import { tokens } from '@softglow/tokens';
import { Text } from './text';

interface SectionHeaderProps {
  title: string;
  caption?: string;
  trailing?: ReactNode;
}

export function SectionHeader({ title, caption, trailing }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: tokens.spacing[3],
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="heading">{title}</Text>
        {caption ? (
          <Text variant="bodySm" tone="secondary" style={{ marginTop: 2 }}>
            {caption}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
