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
    { name: "Warm", type: "temperature" },
    { name: "Beach", type: "activity" },
    { name: "Skiing", type: "activity" },
    { name: "Camping", type: "activity" },
    { name: "Hiking", type: "activity" },
    { name: "Business", type: "activity" },
    { name: "City", type: "activity" }
  ];

  const catMap = new Map<string, string>();
  const tagMap = new Map<string, string>();

  for (const cat of defaultCategories) {
    const ref = doc(collection(db, "categories"));
    catMap.set(cat, ref.id);
    batch.set(ref, { name: cat, user_id: user.uid });
  }

  for (const t of defaultTags) {
    const ref = doc(collection(db, "tags"));
    tagMap.set(t.name, ref.id);
    batch.set(ref, { name: t.name, type: t.type, user_id: user.uid });
  }

  const itemsToSeed = [
    { name: "T-Shirt", cat: "Clothing", tags: ["Hot", "Warm", "City"] },
    { name: "Shorts", cat: "Clothing", tags: ["Hot", "Beach"] },
    { name: "Jeans", cat: "Clothing", tags: ["Cold", "Warm", "City"] },
    { name: "Heavy Coat", cat: "Clothing", tags: ["Cold", "Skiing"] },
    { name: "Thermal Underwear", cat: "Clothing", tags: ["Cold", "Skiing", "Camping"] },
    { name: "Swimsuit", cat: "Clothing", tags: ["Hot", "Beach"] },
    { name: "Rain Jacket", cat: "Clothing", tags: ["Warm", "Cold", "Hiking", "City"] },
    { name: "Hiking Boots", cat: "Clothing", tags: ["Cold", "Warm", "Hiking", "Camping"] },
    { name: "Sneakers", cat: "Clothing", tags: ["City", "Warm", "Hot"] },
    { name: "Sandals", cat: "Clothing", tags: ["Hot", "Beach"] },
    { name: "Dress Shoes", cat: "Clothing", tags: ["Business"] },
    { name: "Suit", cat: "Clothing", tags: ["Business"] },
    { name: "Socks", cat: "Clothing", tags: [] },
    { name: "Underwear", cat: "Clothing", tags: [] },
    { name: "Toothbrush", cat: "Toiletries", tags: [] },
    { name: "Toothpaste", cat: "Toiletries", tags: [] },
    { name: "Deodorant", cat: "Toiletries", tags: [] },
    { name: "Sunscreen", cat: "Toiletries", tags: ["Hot", "Beach", "Hiking"] },
    { name: "Lip Balm", cat: "Toiletries", tags: ["Cold", "Skiing"] },
    { name: "Shampoo", cat: "Toiletries", tags: [] },
    { name: "Body Wash", cat: "Toiletries", tags: [] },
    { name: "Hairbrush", cat: "Toiletries", tags: [] },
    { name: "First Aid Kit", cat: "Toiletries", tags: ["Hiking", "Camping", "Skiing"] },
    { name: "Mosquito Repellent", cat: "Toiletries", tags: ["Camping", "Hiking", "Warm"] },
    { name: "Smartphone", cat: "Electronics", tags: [] },
    { name: "Phone Charger", cat: "Electronics", tags: [] },
    { name: "Laptop", cat: "Electronics", tags: ["Business", "City"] },
    { name: "Laptop Charger", cat: "Electronics", tags: ["Business", "City"] },
    { name: "Power Bank", cat: "Electronics", tags: ["Hiking", "Camping", "City"] },
    { name: "Travel Adapter", cat: "Electronics", tags: ["City", "Business"] },
    { name: "Headphones", cat: "Electronics", tags: [] },
    { name: "Camera", cat: "Electronics", tags: ["City", "Hiking", "Beach"] },
    { name: "Flashlight", cat: "Gear", tags: ["Camping", "Hiking"] },
    { name: "Sleeping Bag", cat: "Gear", tags: ["Camping"] },
    { name: "Tent", cat: "Gear", tags: ["Camping"] },
    { name: "Goggles", cat: "Gear", tags: ["Skiing"] },
    { name: "Helmet", cat: "Gear", tags: ["Skiing"] },
    { name: "Ski Gloves", cat: "Gear", tags: ["Skiing", "Cold"] },
    { name: "Trekking Poles", cat: "Gear", tags: ["Hiking"] },
    { name: "Beach Towel", cat: "Gear", tags: ["Beach"] },
    { name: "Snorkel", cat: "Gear", tags: ["Beach"] },
    { name: "Water Bottle", cat: "Gear", tags: ["Hiking", "Camping", "Beach", "City"] },
    { name: "Multi-tool", cat: "Gear", tags: ["Camping", "Hiking"] },
    { name: "Passport", cat: "Documents", tags: [] },
    { name: "Driver's License", cat: "Documents", tags: [] },
    { name: "Credit Cards", cat: "Documents", tags: [] },
    { name: "Cash", cat: "Documents", tags: [] },
    { name: "Travel Insurance", cat: "Documents", tags: ["City", "Business"] },
    { name: "Boarding Pass", cat: "Documents", tags: [] },
    { name: "Hotel Reservation", cat: "Documents", tags: [] }
  ];

  for (const item of itemsToSeed) {
    const ref = doc(collection(db, "items"));
    batch.set(ref, {
      name: item.name,
      category_id: catMap.get(item.cat) || "",
      tags: item.tags.map(t => tagMap.get(t)).filter(Boolean) as string[],
      user_id: user.uid
    });
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
