import { StyleSheet } from 'react-native';
import { THEME } from '../config/constants';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.primary,
  },
  headerTitle: {
    ...THEME.typography.h1,
    color: THEME.colors.background,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  button: {
    backgroundColor: THEME.colors.primary,
    padding: THEME.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...THEME.typography.body,
    color: THEME.colors.background,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.text,
    borderRadius: 8,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  error: {
    color: THEME.colors.error,
    ...THEME.typography.caption,
    marginTop: THEME.spacing.xs,
  },
  map: {
    flex: 1,
  },
  navigationInfo: {
    position: 'absolute',
    bottom: THEME.spacing.xl,
    left: THEME.spacing.md,
    right: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderRadius: 8,
    padding: THEME.spacing.md,
    shadowColor: THEME.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationText: {
    ...THEME.typography.body,
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  navigationDistance: {
    ...THEME.typography.h2,
    color: THEME.colors.primary,
  },
});

export * from './Colors';
export * from './Typography';
export * from './Spacing';
export * from './Borders';
export * from './Shadows'; 