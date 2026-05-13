import type { ReactNode } from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

interface StackProps extends ViewProps {
  children: ReactNode;
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

const alignMap: Record<NonNullable<StackProps['align']>, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const justifyMap: Record<NonNullable<StackProps['justify']>, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
};

export function Stack({ children, gap = 0, align, justify, style, ...rest }: StackProps) {
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: 'column',
          gap,
          alignItems: align ? alignMap[align] : undefined,
          justifyContent: justify ? justifyMap[justify] : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface RowProps extends StackProps {
  wrap?: boolean;
}

export function Row({ children, gap = 0, align = 'center', justify, wrap, style, ...rest }: RowProps) {
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: 'row',
          gap,
          alignItems: alignMap[align],
          justifyContent: justify ? justifyMap[justify] : undefined,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
