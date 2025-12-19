import MathJaxSvg from 'react-native-mathjax-svg';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';

type Props = {
  latex: string;
  color?: string;
  fontSize?: number;
  widthFactor?: number;
  textAlign?: 'left' | 'center' | 'right';
};

export function MathText({
  latex,
  color,
  fontSize = 18,
  widthFactor = 0.8,
  textAlign = 'center',
}: Props) {
  const { theme } = useTheme();
  const colors = Colors[theme as 'light' | 'dark'];
  const mathColor = color || colors.text;
  const clampedWidth = Math.min(Math.max(widthFactor, 0.4), 1);
  return (
    <View
      style={[
        styles.container,
        { width: `${clampedWidth * 100}%`, alignItems: getAlign(textAlign) },
      ]}>
      <View style={[styles.mathWrapper, { maxHeight: fontSize * 1.5 }]}>
        <MathJaxSvg
          color={mathColor}
          fontSize={fontSize}
          style={[styles.math, { textAlign }]}
          fontCache="global">
          {latex}
        </MathJaxSvg>
      </View>
    </View>
  );
}

function getAlign(alignment: 'left' | 'center' | 'right') {
  switch (alignment) {
    case 'left':
      return 'flex-start';
    case 'right':
      return 'flex-end';
    default:
      return 'center';
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  math: {
    width: '100%',
  },
  mathWrapper: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
});


