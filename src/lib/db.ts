import { collection, doc, getDocs, addDoc, query, where, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Category, Tag, Item, Trip, TripItem } from "./schema";

// Generic helpers
const getCollection = (colName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return query(collection(db, colName), where("user_id", "==", user.uid));
};

export const fetchCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(getCollection("categories"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const fetchTags = async (): Promise<Tag[]> => {
  const snapshot = await getDocs(getCollection("tags"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
};

export const fetchItems = async (): Promise<Item[]> => {
  const snapshot = await getDocs(getCollection("items"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
};

export const addCategory = async (name: string) => {
  return await addDoc(collection(db, "categories"), { name, user_id: auth.currentUser?.uid });
};

export const addTag = async (name: string, type: 'activity'|'temperature'|'general' = 'general') => {
  return await addDoc(collection(db, "tags"), { name, type, user_id: auth.currentUser?.uid });
};

export const addItem = async (item: Omit<Item, "id" | "user_id">) => {
  return await addDoc(collection(db, "items"), { ...item, user_id: auth.currentUser?.uid });
};

export const seedDefaultData = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const batch = writeBatch(db);

  const defaultCategories = ["Clothing", "Toiletries", "Electronics", "Gear", "Documents"];
  const defaultTags = [
    { name: "Hot", type: "temperature" },
    { name: "Cold", type: "temperature" },
    { name: "Beach", type: "activity" },
    { name: "Skiing", type: "activity" },
    { name: "Camping", type: "activity" }
  ];

  for (const cat of defaultCategories) {
    const ref = doc(collection(db, "categories"));
    batch.set(ref, { name: cat, user_id: user.uid });
  }

  for (const t of defaultTags) {
    const ref = doc(collection(db, "tags"));
    batch.set(ref, { name: t.name, type: t.type, user_id: user.uid });
  }

  await batch.commit();
};

export const fetchTrips = async (): Promise<Trip[]> => {
  const snapshot = await getDocs(getCollection("trips"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
};

export const createTrip = async (trip: Omit<Trip, "id" | "user_id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not auth");
  return await addDoc(collection(db, "trips"), { ...trip, user_id: user.uid });
};

export const generateListForTrip = async (tripId: string, tags: string[]) => {
  const user = auth.currentUser;
  if (!user) return;
  
  // Fetch all items from user
  const snapshot = await getDocs(getCollection("items"));
  const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
  
  // Filter items that match the tags
  const matchedItems = allItems.filter(item => {
    // If the item has no tags, maybe it's a general item to always bring?
    if (!item.tags || item.tags.length === 0) return true;
    
    // Otherwise, check if ANY of the item's tags are in the trip's tags
    return item.tags.some(t => tags.includes(t));
  });
  
  const batch = writeBatch(db);
  for (const item of matchedItems) {
    if (!item.id) continue;
    const ref = doc(collection(db, "trip_items"));
    batch.set(ref, {
      trip_id: tripId,
      item_id: item.id,
      is_packed: false
    });
  }
  await batch.commit();
};

import { getDoc, updateDoc } from "firebase/firestore";

export const fetchTrip = async (tripId: string): Promise<Trip | null> => {
  const docRef = doc(db, "trips", tripId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Trip;
  return null;
};

export const fetchTripItems = async (tripId: string): Promise<TripItem[]> => {
  const q = query(collection(db, "trip_items"), where("trip_id", "==", tripId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TripItem));
};

export const addItemToTrip = async (tripId: string, itemName: string, tagIdForTemp: string) => {
  const user = auth.currentUser;
  if (!user) return;
  
  // 1. Give it a default general tag
  const itemRef = await addDoc(collection(db, "items"), { 
    name: itemName, 
    category_id: "", // generic/uncategorized for now
    tags: [tagIdForTemp], 
    user_id: user.uid 
  });
  
  // 2. Link it to the trip
  await addDoc(collection(db, "trip_items"), {
    trip_id: tripId,
    item_id: itemRef.id,
    is_packed: false
  });
  
  return itemRef.id;
};

export const updateTripItemStatus = async (tripItemId: string, is_packed: boolean) => {
  const docRef = doc(db, "trip_items", tripItemId);
  await updateDoc(docRef, { is_packed });
};
