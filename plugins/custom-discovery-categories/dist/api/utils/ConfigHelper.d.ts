export interface Category {
    id: number;
    name: string;
}
export declare const DEFAULT_CATEGORIES: Category[];
export declare function getCustomCategoryIds(): number[];
export declare function updateCustomCategoryIds(categories: Category[]): void;
export declare function getCategories(): Promise<Category[]>;
export declare function saveCategories(categories: Category[]): Promise<void>;
