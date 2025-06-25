import { StyleSheet } from 'react-native';
import { Colors } from './Colors';
import { Spacing } from './Spacing';
import { Typography } from './Typography';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.primary.dark,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.background.screen,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  button: {
    backgroundColor: Colors.primary.dark,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.body,
    color: Colors.background.screen,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.text.darkPrimary,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  error: {
    color: Colors.danger.primary,
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  map: {
    flex: 1,
  },
  navigationInfo: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.background.screen,
    borderRadius: 8,
    padding: Spacing.md,
    shadowColor: Colors.text.darkPrimary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationText: {
    ...Typography.body,
    color: Colors.text.darkPrimary,
    marginBottom: Spacing.xs,
  },
  navigationDistance: {
    ...Typography.h2,
    color: Colors.primary.dark,
  },
});

export * from './Colors';
export * from './Typography';
export * from './Spacing';
export * from './Borders';
export * from './Shadows'; 