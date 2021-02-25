import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  column: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    paddingLeft: 10,
    marginTop: -16,
    paddingBottom: 5,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    padding: 10,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default styles;
