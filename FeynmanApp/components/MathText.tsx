import MathJaxSvg from 'react-native-mathjax-svg';
import { StyleSheet, View, useWindowDimensions, PixelRatio } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';
import { useMemo } from 'react';

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
  const { width: screenWidth } = useWindowDimensions();
  const fontScale = PixelRatio.getFontScale();
  
  // Clamp width factor
  const clampedWidth = Math.min(Math.max(widthFactor, 0.4), 1);
  
  // Adjust fontSize based on font scale to maintain consistent sizing
  const adjustedFontSize = useMemo(() => {
    // Cap font scale impact to prevent extreme sizing (between 85% and 130% of requested size)
    const cappedScale = Math.min(Math.max(fontScale, 0.85), 1.3);
    return Math.round(fontSize * cappedScale);
  }, [fontSize, fontScale]);
  
  // Calculate a more generous max height based on content complexity
  // For fractions and complex expressions, we need more vertical space
  const maxHeight = useMemo(() => {
    const hasFractions = latex.includes('\\frac');
    const hasComplex = latex.includes('\\sqrt') || latex.includes('\\sum') || latex.includes('\\int') || latex.includes('\\lim');
    if (hasComplex) return adjustedFontSize * 4;
    if (hasFractions) return adjustedFontSize * 3;
    return adjustedFontSize * 2.5;
  }, [latex, adjustedFontSize]);
  
  return (
    <View
      style={[
        styles.container,
        { 
          width: `${clampedWidth * 100}%`, 
          alignItems: getAlign(textAlign),
          maxWidth: screenWidth * 0.95, // Prevent overflow on small screens
        },
      ]}>
      <View style={[styles.mathWrapper, { maxHeight }]}>
        <MathJaxSvg
          color={mathColor}
          fontSize={adjustedFontSize}
          style={styles.math}
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
    paddingVertical: 4, // Add vertical padding to prevent cropping
  },
  math: {
    width: '100%',
    // Remove overflow hidden to allow natural rendering
  },
  mathWrapper: {
    width: '100%',
    overflow: 'visible', // Changed from 'hidden' to 'visible' to prevent cropping
    justifyContent: 'center',
    alignItems: 'center',
    // Add padding to ensure content doesn't get clipped
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});


