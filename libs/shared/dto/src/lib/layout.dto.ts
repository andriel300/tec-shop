export interface UpdateLayoutDto {
  logo?: string;
  banner?: string;
}

export interface LayoutResponseDto {
  id: string;
  logo: string | null;
  banner: string | null;
  updatedAt: string;
}
