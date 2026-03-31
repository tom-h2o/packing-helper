import { collection, doc, getDocs, addDoc, query, where, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebase";
import type { Category, Tag, Item } from "./schema";

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
