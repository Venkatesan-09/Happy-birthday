export type RelationshipType =
  | 'Best Friend'
  | 'Friend'
  | 'Partner'
  | 'Parent'
  | 'Mother'
  | 'Father'
  | 'Sibling'
  | 'Cousin'
  | 'Classmate'
  | 'Teacher'
  | 'Mentor'
  | 'Colleague'
  | 'Family Member'
  | 'Other';

export type PrivacyType = 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
export type ExpiryType = 'NEVER' | '7_DAYS' | '30_DAYS' | 'CUSTOM';
export type ExperienceStatus = 'DRAFT' | 'PUBLISHED';

export interface ThemeConfig {
  name: string;
  primaryColor: string; // e.g. #d97706 or #e11d48
  secondaryColor: string;
  accentColor: string;
  font: 'editorial' | 'handwritten' | 'sans' | 'classic';
  background: string; // Tailwind class or hex
  cardBg: string;
  textColor: string;
  mutedTextColor: string;
  animation: 'gentle' | 'cinematic' | 'playful';
}

export interface RecipientInfo {
  name: string;
  nickname?: string;
  relationship: RelationshipType;
  birthday: string; // YYYY-MM-DD
}

export interface ExperienceSettings {
  surpriseMode: boolean; // hide modules until condition/unlock
  expiryType: ExpiryType;
  expiryDate?: string;
  birthdayMode: 'COUNTDOWN' | 'CELEBRATION' | 'EVERGREEN';
  allowResume: boolean;
  backgroundMusicUrl?: string;
  musicAutoPlay?: boolean;
}

export type ModuleType =
  | 'CINEMATIC_OPENING'
  | 'BIRTHDAY_REVEAL'
  | 'LETTER'
  | 'MEMORY_MAP'
  | 'MUSIC'
  | 'VOICE'
  | 'VIDEO'
  | 'THINGS_NEVER_SAID'
  | 'INSIDE_JOKES'
  | 'SECRET'
  | 'UNIVERSE'
  | 'GIFT'
  | 'PUZZLE'
  | 'PEOPLE'
  | 'STORY'
  | 'FUTURE_WISHES'
  | 'FINAL_REVEAL';

export interface BaseModule {
  _id: string;
  experienceId: string;
  type: ModuleType;
  position: number;
  enabled: boolean;
  title: string;
  subtitle?: string;
  settings?: Record<string, any>;
  style?: Record<string, any>;
  isSecret?: boolean;
  unlockCondition?: string;
}

export interface CinematicOpeningContent {
  title: string;
  subtitle: string;
  quote: string;
  tapToBeginText: string;
  teddyMessage: string;
}

export interface BirthdayRevealContent {
  headline: string;
  greeting: string;
  milestoneText?: string;
  specialNote: string;
  confettiColorPalette: string[];
}

export interface LetterContent {
  title: string;
  openingSalutation: string;
  letterBody: string;
  signature: string;
  paperStyle: 'parchment' | 'cream' | 'linen' | 'minimal';
  inkFont: 'Caveat' | 'Playfair Display' | 'Plus Jakarta Sans';
}

export interface MemoryPoint {
  id: string;
  title: string;
  date: string;
  locationName: string;
  description: string;
  photoUrl?: string;
  audioUrl?: string;
  x: number; // percentage 0-100 on map canvas
  y: number; // percentage 0-100 on map canvas
  color?: string;
}

export interface MemoryMapContent {
  mapTheme: 'vintage_scroll' | 'constellation' | 'watercolor_islands' | 'modern_minimal';
  description: string;
  memories: MemoryPoint[];
}

export interface MusicTrackContent {
  trackTitle: string;
  artist: string;
  audioUrl: string;
  ambientPreset?: 'piano_lullaby' | 'acoustic_nostalgia' | 'lofi_chill' | 'cinematic_strings';
  autoplay: boolean;
  loop: boolean;
  volume: number;
}

export interface VoiceMessageContent {
  title: string;
  senderName: string;
  audioUrl: string;
  durationSeconds?: number;
  transcription?: string;
  recordedDate?: string;
}

export interface VideoMessageContent {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
}

export interface UnsaidThingItem {
  id: string;
  topic: string;
  confession: string;
  revealText: string;
  isUnlockedByDefault?: boolean;
}

export interface ThingsNeverSaidContent {
  title: string;
  intro: string;
  items: UnsaidThingItem[];
}

export interface InsideJokeItem {
  id: string;
  title: string;
  setup: string;
  punchline: string;
  imageUrl?: string;
  emoji: string;
}

export interface InsideJokesContent {
  title: string;
  intro: string;
  jokes: InsideJokeItem[];
}

export type GameType = 'BALLOON_POP' | 'MEMORY_MATCH' | 'BIRTHDAY_QUIZ' | 'CATCH_HEARTS' | 'PUZZLE';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MiniGameContent {
  gameType: GameType;
  title: string;
  instructions: string;
  targetScore: number;
  questions?: QuizQuestion[];
  puzzleImageUrl?: string;
  rewardMessage: string;
}

export interface SecretUnlockContent {
  title: string;
  clue: string;
  unlockType: 'PASSWORD' | 'CLICK_SEQUENCE' | 'GAME_COMPLETE' | 'UNIVERSE_DISCOVERY' | 'PROGRESS';
  secretCode?: string; // for password
  targetClicks?: number; // for click sequence (e.g. 5 taps on Teddy)
  secretRevealHeading: string;
  secretRevealMessage: string;
  secretMediaUrl?: string;
}

export interface UniverseObject {
  id: string;
  label: string;
  type: 'STAR' | 'PLANET' | 'MEMORY_ORB' | 'CONSTELLATION' | 'TEDDY_SATELLITE';
  x: number; // percentage coordinates 5-95
  y: number;
  size: number;
  color: string;
  message: string;
  photoUrl?: string;
}

export interface UniverseContent {
  universeTheme: 'DEEP_COSMOS' | 'GOLDEN_NEBULA' | 'STARRY_PASTEL' | 'MOONLIT_SKY';
  introMessage: string;
  objects: UniverseObject[];
}

export interface VirtualGiftContent {
  title: string;
  boxStyle: 'golden_ribbon' | 'vintage_kraft' | 'velvet_rose' | 'celestial_box';
  lidAnimation: 'explode' | 'open_smooth' | 'glow_unveil';
  giftMessage: string;
  giftPhotoUrl?: string;
  giftVoucherTitle?: string;
  giftVoucherDetails?: string;
}

export interface ContributorWish {
  id: string;
  name: string;
  relationship: string;
  message: string;
  photoUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface PeopleWhoLoveYouContent {
  title: string;
  subtitle: string;
  allowPublicSubmissions: boolean;
  wishes: ContributorWish[];
}

export interface StoryMilestone {
  id: string;
  dateOrYear: string;
  title: string;
  description: string;
  photoUrl?: string;
  tag: string;
}

export interface OurStoryContent {
  title: string;
  intro: string;
  milestones: StoryMilestone[];
}

export interface FutureWishItem {
  id: string;
  wish: string;
  category: 'Bucket List' | 'Trip & Adventure' | 'Life Milestone' | 'Gentle Promise';
  targetYear?: string;
}

export interface FutureWishesContent {
  title: string;
  subtitle: string;
  wishes: FutureWishItem[];
}

export interface FinalRevealContent {
  title: string;
  grandMessage: string;
  photoGallery: string[];
  signature: string;
  specialTeddyWisdom: string;
  replayButtonText: string;
}

export type ModuleContent =
  | CinematicOpeningContent
  | BirthdayRevealContent
  | LetterContent
  | MemoryMapContent
  | MusicTrackContent
  | VoiceMessageContent
  | VideoMessageContent
  | ThingsNeverSaidContent
  | InsideJokesContent
  | MiniGameContent
  | SecretUnlockContent
  | UniverseContent
  | VirtualGiftContent
  | PeopleWhoLoveYouContent
  | OurStoryContent
  | FutureWishesContent
  | FinalRevealContent
  | Record<string, any>;

export interface ExperienceModule extends BaseModule {
  content: ModuleContent;
}

export interface Experience {
  _id: string;
  creatorId: string;
  slug: string;
  recipient: RecipientInfo;
  theme: ThemeConfig;
  privacy: {
    type: PrivacyType;
    passwordHash?: string;
  };
  settings: ExperienceSettings;
  modules?: ExperienceModule[];
  status: ExperienceStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contributor {
  _id: string;
  experienceId: string;
  name: string;
  email?: string;
  token: string;
  status: 'PENDING' | 'SUBMITTED';
  expiresAt: string;
  createdAt: string;
}

export interface Contribution {
  _id: string;
  experienceId: string;
  contributorId: string;
  contributorName: string;
  relationship?: string;
  type: 'MESSAGE' | 'PHOTO' | 'VOICE' | 'VIDEO';
  message: string;
  media?: {
    type: string;
    url: string;
    publicId?: string;
  };
  approved: boolean;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';
  creatorNote?: string;
  createdAt: string;
}

export interface ExperienceVersion {
  _id: string;
  experienceId: string;
  versionNumber: number;
  snapshot: Experience;
  publishedAt: string;
  createdBy: string;
}

export interface RecipientSession {
  _id: string;
  experienceId: string;
  sessionId: string;
  completedModules: string[];
  discoveredSecrets: string[];
  gamesCompleted: string[];
  universeDiscoveries: string[];
  progress: number;
  lastVisitedAt: string;
}

export interface AIGenerationRequest {
  experienceId?: string;
  type: 'LETTER' | 'WISH' | 'JOKE' | 'STORY' | 'FINAL_MESSAGE' | 'FUTURE_WISH' | 'SECRET_MESSAGE';
  relationship: RelationshipType;
  recipientName: string;
  tone: 'heartfelt' | 'playful' | 'nostalgic' | 'poetic' | 'funny' | 'uplifting';
  context?: string;
  memories?: string;
  length?: 'short' | 'medium' | 'deep';
}
