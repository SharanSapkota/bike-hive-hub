
import api from "@/lib/api";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
  
  export interface Category {
   id: string;
   name: string;
   description: string;
  }
  interface CommonContextType {
    categories: Category[];
    }

const CommonContext = createContext<CommonContextType | undefined>(undefined);

export const CommonProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        const categories = response?.data?.data;
        setCategories(categories);
      } catch (error) {
        console.error("Error getting categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <CommonContext.Provider value={{ categories }}>
      {children}
    </CommonContext.Provider>
  );
};

export const useCommonContext = () => {
  const context = useContext(CommonContext);
  if (!context) {
    throw new Error("useCommonContext must be used within a CommonProvider");
  }
  return context;
};