import { View, StyleSheet } from 'react-native';

type ProgressDotsProps = {
  totalPages: number;
  currentPageIndex: number;
};

export function ProgressDots({ totalPages, currentPageIndex }: ProgressDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalPages }, (_, index) => {
        const isCompleted = index < currentPageIndex;
        const isCurrent = index === currentPageIndex;
        
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isCurrent && styles.dotCurrent,
              isCompleted && styles.dotCompleted,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1', // Light gray
  },
  dotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb', // Blue for current page (matches button color)
  },
  dotCompleted: {
    backgroundColor: '#15803d', // Green for completed
  },
});

