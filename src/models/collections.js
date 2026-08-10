/**
 * Firestore collection names (subcollections of users/{uid}).
 * Kept in a tiny standalone module so both schema factories and the data-access
 * layer can import them without a circular dependency.
 */
export const COLLECTIONS = Object.freeze({
  TRANSACTIONS: 'transactions',
  ACCOUNTS: 'accounts',
  INVESTMENTS: 'investments',
  PROPERTIES: 'properties',
  PROPERTY_COSTS: 'propertyCosts',
});
