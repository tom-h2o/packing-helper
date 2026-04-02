import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Tag, Item, Trip, TripItem } from "./schema";

// Generic helpers
const getCollection = (colName: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return query(collection(db, colName), where("user_id", "==", user.uid));
};

// ── Fetch ──────────────────────────────────────────────
export const fetchTags = async (): Promise<Tag[]> => {
  const snapshot = await getDocs(getCollection("tags"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
};

export const fetchItems = async (): Promise<Item[]> => {
  const snapshot = await getDocs(getCollection("items"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
};

export const fetchTrips = async (): Promise<Trip[]> => {
  const snapshot = await getDocs(getCollection("trips"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
};

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

// ── Tags ───────────────────────────────────────────────
export const addTag = async (name: string, type: 'activity' | 'temperature' | 'category' = 'category') => {
  return await addDoc(collection(db, "tags"), { name, type, user_id: auth.currentUser?.uid });
};

export const updateTag = async (tagId: string, name: string) => {
  await updateDoc(doc(db, "tags", tagId), { name });
};

export const deleteTag = async (tagId: string) => {
  await deleteDoc(doc(db, "tags", tagId));
};

// ── Items ──────────────────────────────────────────────
export const addItem = async (item: Omit<Item, "id" | "user_id">) => {
  return await addDoc(collection(db, "items"), { ...item, user_id: auth.currentUser?.uid });
};

export const updateItem = async (itemId: string, data: Partial<Omit<Item, "id" | "user_id">>) => {
  await updateDoc(doc(db, "items", itemId), data);
};

export const deleteItem = async (itemId: string) => {
  await deleteDoc(doc(db, "items", itemId));
};

// ── Trips ──────────────────────────────────────────────
export const createTrip = async (trip: Omit<Trip, "id" | "user_id">) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not auth");
  return await addDoc(collection(db, "trips"), { ...trip, user_id: user.uid });
};

export const addItemToTrip = async (tripId: string, itemName: string, tagIdForTemp: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const itemRef = await addDoc(collection(db, "items"), {
    name: itemName,
    tags: [tagIdForTemp],
    user_id: user.uid
  });

  await addDoc(collection(db, "trip_items"), {
    trip_id: tripId,
    item_id: itemRef.id,
    is_packed: false
  });

  return itemRef.id;
};

// ── Trip Items ─────────────────────────────────────────
export const updateTripItemStatus = async (tripItemId: string, is_packed: boolean) => {
  await updateDoc(doc(db, "trip_items", tripItemId), { is_packed });
};

export const updateTripItemQuantity = async (tripItemId: string, quantity: number) => {
  await updateDoc(doc(db, "trip_items", tripItemId), { quantity });
};

// ── Trip generation ────────────────────────────────────
export const generateListForTrip = async (tripId: string, tags: string[]) => {
  const user = auth.currentUser;
  if (!user) return;

  const snapshot = await getDocs(getCollection("items"));
  const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));

  const matchedItems = allItems.filter(item => {
    if (!item.tags || item.tags.length === 0) return true;
    return item.tags.some(t => tags.includes(t));
  });

  const batch = writeBatch(db);
  for (const item of matchedItems) {
    if (!item.id) continue;
    const ref = doc(collection(db, "trip_items"));
    batch.set(ref, {
      trip_id: tripId,
      item_id: item.id,
      is_packed: false,
      ...(item.quantity_relevant && item.default_quantity ? { quantity: item.default_quantity } : {})
    });
  }
  await batch.commit();
};

// ── Seed ───────────────────────────────────────────────
export const seedDefaultData = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const batch = writeBatch(db);

  const defaultTags = [
    // Categories
    { name: "Clothing", type: "category" },
    { name: "Toiletries", type: "category" },
    { name: "Electronics", type: "category" },
    { name: "Gear", type: "category" },
    { name: "Documents", type: "category" },
    // Temperature
    { name: "Hot", type: "temperature" },
    { name: "Cold", type: "temperature" },
    { name: "Warm", type: "temperature" },
    // Activities
    { name: "Beach", type: "activity" },
    { name: "Skiing", type: "activity" },
    { name: "Camping", type: "activity" },
    { name: "Hiking", type: "activity" },
    { name: "Business", type: "activity" },
    { name: "City", type: "activity" }
  ];

  const tagMap = new Map<string, string>();

  for (const t of defaultTags) {
    const ref = doc(collection(db, "tags"));
    tagMap.set(t.name, ref.id);
    batch.set(ref, { name: t.name, type: t.type, user_id: user.uid });
  }

  const quantityItems = new Map([
    ["Socks", 7],
    ["Underwear", 7],
    ["T-Shirt", 5],
  ]);

  const itemsToSeed = [
    { name: "T-Shirt", tags: ["Clothing", "Hot", "Warm", "City"] },
    { name: "Shorts", tags: ["Clothing", "Hot", "Beach"] },
    { name: "Jeans", tags: ["Clothing", "Cold", "Warm", "City"] },
    { name: "Heavy Coat", tags: ["Clothing", "Cold", "Skiing"] },
    { name: "Thermal Underwear", tags: ["Clothing", "Cold", "Skiing", "Camping"] },
    { name: "Swimsuit", tags: ["Clothing", "Hot", "Beach"] },
    { name: "Rain Jacket", tags: ["Clothing", "Warm", "Cold", "Hiking", "City"] },
    { name: "Hiking Boots", tags: ["Clothing", "Cold", "Warm", "Hiking", "Camping"] },
    { name: "Sneakers", tags: ["Clothing", "City", "Warm", "Hot"] },
    { name: "Sandals", tags: ["Clothing", "Hot", "Beach"] },
    { name: "Dress Shoes", tags: ["Clothing", "Business"] },
    { name: "Suit", tags: ["Clothing", "Business"] },
    { name: "Socks", tags: ["Clothing"] },
    { name: "Underwear", tags: ["Clothing"] },
    { name: "Toothbrush", tags: ["Toiletries"] },
    { name: "Toothpaste", tags: ["Toiletries"] },
    { name: "Deodorant", tags: ["Toiletries"] },
    { name: "Sunscreen", tags: ["Toiletries", "Hot", "Beach", "Hiking"] },
    { name: "Lip Balm", tags: ["Toiletries", "Cold", "Skiing"] },
    { name: "Shampoo", tags: ["Toiletries"] },
    { name: "Body Wash", tags: ["Toiletries"] },
    { name: "Hairbrush", tags: ["Toiletries"] },
    { name: "First Aid Kit", tags: ["Toiletries", "Hiking", "Camping", "Skiing"] },
    { name: "Mosquito Repellent", tags: ["Toiletries", "Camping", "Hiking", "Warm"] },
    { name: "Smartphone", tags: ["Electronics"] },
    { name: "Phone Charger", tags: ["Electronics"] },
    { name: "Laptop", tags: ["Electronics", "Business", "City"] },
    { name: "Laptop Charger", tags: ["Electronics", "Business", "City"] },
    { name: "Power Bank", tags: ["Electronics", "Hiking", "Camping", "City"] },
    { name: "Travel Adapter", tags: ["Electronics", "City", "Business"] },
    { name: "Headphones", tags: ["Electronics"] },
    { name: "Camera", tags: ["Electronics", "City", "Hiking", "Beach"] },
    { name: "Flashlight", tags: ["Gear", "Camping", "Hiking"] },
    { name: "Sleeping Bag", tags: ["Gear", "Camping"] },
    { name: "Tent", tags: ["Gear", "Camping"] },
    { name: "Goggles", tags: ["Gear", "Skiing"] },
    { name: "Helmet", tags: ["Gear", "Skiing"] },
    { name: "Ski Gloves", tags: ["Gear", "Skiing", "Cold"] },
    { name: "Trekking Poles", tags: ["Gear", "Hiking"] },
    { name: "Beach Towel", tags: ["Gear", "Beach"] },
    { name: "Snorkel", tags: ["Gear", "Beach"] },
    { name: "Water Bottle", tags: ["Gear", "Hiking", "Camping", "Beach", "City"] },
    { name: "Multi-tool", tags: ["Gear", "Camping", "Hiking"] },
    { name: "Passport", tags: ["Documents"] },
    { name: "Driver's License", tags: ["Documents"] },
    { name: "Credit Cards", tags: ["Documents"] },
    { name: "Cash", tags: ["Documents"] },
    { name: "Travel Insurance", tags: ["Documents", "City", "Business"] },
    { name: "Boarding Pass", tags: ["Documents"] },
    { name: "Hotel Reservation", tags: ["Documents"] }
  ];

  for (const item of itemsToSeed) {
    const ref = doc(collection(db, "items"));
    const defaultQty = quantityItems.get(item.name);
    batch.set(ref, {
      name: item.name,
      tags: item.tags.map(t => tagMap.get(t)).filter(Boolean) as string[],
      ...(defaultQty ? { quantity_relevant: true, default_quantity: defaultQty } : {}),
      user_id: user.uid
    });
  }

  await batch.commit();
};
