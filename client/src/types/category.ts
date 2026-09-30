export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  sort: number;
  children: Category[];
}
