'use client';
import {createContext,useContext} from 'react';
import {products,Product} from '@/lib/catalog';
export const CatalogContext=createContext<Product[]>(products);
export const useCatalog=()=>useContext(CatalogContext);
