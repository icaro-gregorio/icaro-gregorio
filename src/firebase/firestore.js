/**
 * Firestore data-access helpers.
 *
 * All of a user's financial data lives under `users/{uid}` — the profile on the
 * user document itself, and each collection (transactions, accounts, …) as a
 * subcollection. These helpers centralize the ref-building and read/write calls
 * so the React layer never touches Firestore paths directly.
 */

import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config.js';
import { COLLECTIONS } from '../models/collections.js';

/** The user's master document (holds the Adviser Profile fields). */
export const userDocRef = (uid) => doc(db, 'users', uid);

/** A subcollection under the user. */
export const userCollectionRef = (uid, name) => collection(db, 'users', uid, name);

/** A single document within a user's subcollection. */
export const entityDocRef = (uid, name, id) => doc(db, 'users', uid, name, id);

/**
 * Subscribe to a subcollection; `cb` receives an array of documents whenever the
 * data changes. Returns the unsubscribe function.
 */
export function subscribeCollection(uid, name, cb, onError) {
  return onSnapshot(
    userCollectionRef(uid, name),
    (snap) => cb(snap.docs.map((d) => d.data())),
    onError,
  );
}

/** Subscribe to the user's profile document. */
export function subscribeProfile(uid, cb, onError) {
  return onSnapshot(
    userDocRef(uid),
    (snap) => cb(snap.exists() ? snap.data() : null),
    onError,
  );
}

/** Create or update the profile (merged, so partial updates are safe). */
export function saveProfile(uid, profile) {
  return setDoc(userDocRef(uid), profile, { merge: true });
}

/**
 * Create or update an entity. The document id is the entity's own id field
 * (passed explicitly since it differs per collection: id / asset_id / property_id).
 */
export function upsertEntity(uid, name, id, entity) {
  return setDoc(entityDocRef(uid, name, id), entity, { merge: true });
}

/** Delete an entity by id. */
export function deleteEntity(uid, name, id) {
  return deleteDoc(entityDocRef(uid, name, id));
}

/** Write many entities efficiently, chunked under Firestore's 500-op batch limit. */
export async function bulkUpsert(uid, name, items, idField) {
  for (let i = 0; i < items.length; i += 450) {
    const chunk = items.slice(i, i + 450);
    const batch = writeBatch(db);
    for (const item of chunk) batch.set(entityDocRef(uid, name, item[idField]), item);
    await batch.commit();
  }
}

/**
 * Seed a fresh account with a dataset (used by the "Load sample data" action and
 * available for tests). Writes the profile plus every collection in one batch.
 */
export async function seedUserData(uid, data) {
  const batch = writeBatch(db);

  if (data.profile) batch.set(userDocRef(uid), data.profile, { merge: true });

  const put = (name, items, idField) => {
    for (const item of items ?? []) {
      batch.set(entityDocRef(uid, name, item[idField]), item);
    }
  };
  put(COLLECTIONS.ACCOUNTS, data.accounts, 'id');
  put(COLLECTIONS.TRANSACTIONS, data.transactions, 'id');
  put(COLLECTIONS.INVESTMENTS, data.investments, 'asset_id');
  put(COLLECTIONS.PROPERTIES, data.properties, 'property_id');
  put(COLLECTIONS.PROPERTY_COSTS, data.propertyCosts, 'id');

  await batch.commit();
}

/** True if the user has no data yet (used to offer the seed action). */
export async function isAccountEmpty(uid) {
  const snap = await getDocs(userCollectionRef(uid, COLLECTIONS.TRANSACTIONS));
  return snap.empty;
}
