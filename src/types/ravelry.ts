export interface RavelryUser {
  id: number;
  username: string;
  small_photo_url: string | null;
  photo_url: string | null;
  tiny_photo_url?: string | null;
  large_photo_url?: string | null;
}

export interface CurrentUserResponse {
  user: RavelryUser;
}

export interface Photo {
  id: number;
  sort_order: number;
  x_offset: number;
  y_offset: number;
  square_url: string;
  medium_url: string;
  thumbnail_url: string;
  small_url: string;
  small2_url: string;
  caption: string | null;
  copyright_notice: string | null;
}

export interface NeedleSize {
  id: number;
  name: string;
  metric: number | null;
  us: string | null;
  hook: string | null;
  crochet: boolean;
  knitting: boolean;
  pretty_metric: string;
}

export interface YarnWeight {
  id: number;
  name: string;
  ply: string | null;
  wpi: string | null;
  knit_gauge: string | null;
  crochet_gauge: string | null;
  description?: string | null;
}

export interface YarnFiber {
  id: number;
  percentage: number;
  fiber_type: {
    id: number;
    name: string;
    fiber_category: { id: number; name: string };
  };
}

export interface Designer {
  id: number;
  name: string;
  permalink: string;
  pattern_count?: number;
  bio?: string | null;
  website?: string | null;
  users?: Array<{
    id: number;
    username: string;
    small_photo_url: string | null;
  }>;
}

export interface Pack {
  id: number;
  primary_pack_id: number | null;
  yarn_id: number | null;
  yarn_name: string | null;
  yarn: Yarn | null;
  colorway: string | null;
  dye_lot: string | null;
  quantity_description: string | null;
  total_skeins: number | null;
  stash_id: number | null;
  shop_name: string | null;
}

export interface Pattern {
  id: number;
  name: string;
  permalink: string;
  craft: { name: string; permalink: string } | null;
  pattern_categories: Array<{ name: string; permalink: string }>;
  pattern_type: { name: string; permalink: string } | null;
  difficulty_average: number | null;
  difficulty_count: number;
  favorites_count: number;
  projects_count: number;
  queued_projects_count: number;
  rating_average: number | null;
  rating_count: number;
  free: boolean;
  price: string | null;
  currency: string | null;
  yardage: number | null;
  yardage_max: number | null;
  yarn_weight_description: string | null;
  first_photo: Photo | null;
  photos: Photo[];
  designer: Designer | null;
  pdf_url: string | null;
  url: string | null;
  sizes_available: string | null;
  gauge: number | null;
  gauge_divisor: number | null;
  gauge_pattern: string | null;
  row_gauge: number | null;
  needle_sizes: NeedleSize[];
  pattern_needle_sizes: NeedleSize[];
  notes_html: string | null;
  notes: string | null;
  pdf_in_library: boolean;
  volumes_in_library: unknown[];
  packs: Pack[];
}

export interface PatternSearchResult {
  id: number;
  name: string;
  permalink: string;
  craft: { name: string; permalink: string } | null;
  difficulty_average: number | null;
  favorites_count: number;
  free: boolean;
  price: string | null;
  currency: string | null;
  yardage: number | null;
  yarn_weight_description: string | null;
  first_photo: Photo | null;
  designer: { id: number; name: string } | null;
  rating_average: number | null;
}

export interface Yarn {
  id: number;
  name: string;
  permalink: string;
  yarn_company: { id: number; name: string; permalink: string } | null;
  rating_average: number | null;
  rating_count: number;
  discontinued: boolean;
  yarn_weight: YarnWeight | null;
  min_gauge: number | null;
  max_gauge: number | null;
  gauge_divisor: number | null;
  min_yardage: number | null;
  max_yardage: number | null;
  min_grams: number | null;
  max_grams: number | null;
  yarn_fibers: YarnFiber[];
  photos: Photo[];
  first_photo: Photo | null;
  colorway_count: number;
  wpi: number | null;
  organic: boolean;
  machine_washable: boolean | null;
}

export interface YarnSearchResult {
  id: number;
  name: string;
  permalink: string;
  yarn_company: { id: number; name: string } | null;
  rating_average: number | null;
  rating_count: number;
  discontinued: boolean;
  yarn_weight: YarnWeight | null;
  yarn_fibers: YarnFiber[];
  first_photo: Photo | null;
  colorway_count: number;
}

export interface QueuedProject {
  id: number;
  position: number;
  pattern: Pattern | null;
  pattern_id: number | null;
  stash: StashEntry | null;
  stash_id: number | null;
  created_at: string;
}

export interface StashEntry {
  id: number;
  name: string;
  yarn_name: string | null;
  yarn: Yarn | null;
  colorway: string | null;
  color_family_band: { id: number; name: string } | null;
  stash_status: { id: number; name: string };
  yarn_weight: YarnWeight | null;
  total_skeins: number | null;
  yards_per_skein: number | null;
  grams_per_skein: number | null;
  notes: string | null;
  photos: Photo[];
  first_photo: Photo | null;
}

export interface Project {
  id: number;
  name: string | null;
  status: { id: number; name: string } | null;
  craft: { id: number; name: string; permalink: string } | null;
  started: string | null;
  completed: string | null;
  made_for: string | null;
  pattern: Pattern | null;
  pattern_id: number | null;
  notes: string | null;
  photos: Photo[];
  first_photo: Photo | null;
  packs: Pack[];
}

export interface Favorite {
  id: number;
  created_at: string;
  type: string;
  favorited: Pattern | Yarn | RavelryUser;
}

export interface LibraryEntry {
  id: number;
  created_at: string;
  entity_type: string;
  pattern: Pattern | null;
  volume: unknown | null;
}

export interface Shop {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  ravelry_url: string | null;
}

export interface ColorFamily {
  id: number;
  name: string;
  permalink: string;
}

export interface PatternCategory {
  id: number;
  name: string;
  permalink: string;
  children?: PatternCategory[];
}

export interface Paginator {
  page: number;
  page_size: number;
  page_count: number;
  results: number;
  last_page: number;
  uri: string | null;
}
