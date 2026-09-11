import { ThemeConfig, ModuleType, ExperienceModule, RelationshipType } from '../types';

export const DEFAULT_THEMES: Record<string, ThemeConfig> = {
  warm_scrapbook: {
    name: 'Warm Vintage Scrapbook',
    primaryColor: '#b45309', // amber-700
    secondaryColor: '#78350f',
    accentColor: '#f59e0b',
    font: 'editorial',
    background: 'from-[#faf6f0] via-[#f5ede0] to-[#f0e4d0]',
    cardBg: '#fffdfa',
    textColor: '#292524',
    mutedTextColor: '#78716c',
    animation: 'gentle',
  },
  dreamy_dusk: {
    name: 'Dreamy Twilight Dusk',
    primaryColor: '#7c3aed', // violet-600
    secondaryColor: '#4c1d95',
    accentColor: '#f43f5e',
    font: 'classic',
    background: 'from-[#1e1b4b] via-[#2e1065] to-[#0f172a]',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    textColor: '#f8fafc',
    mutedTextColor: '#cbd5e1',
    animation: 'cinematic',
  },
  champagne_celebration: {
    name: 'Champagne & Gold',
    primaryColor: '#d97706',
    secondaryColor: '#92400e',
    accentColor: '#fbbf24',
    font: 'editorial',
    background: 'from-[#fffbeb] via-[#fef3c7] to-[#fde68a]',
    cardBg: '#ffffff',
    textColor: '#451a03',
    mutedTextColor: '#92400e',
    animation: 'playful',
  },
  cosmic_stardust: {
    name: 'Cosmic Stardust',
    primaryColor: '#38bdf8',
    secondaryColor: '#1e3a8a',
    accentColor: '#a855f7',
    font: 'sans',
    background: 'from-[#0b0f19] via-[#111827] to-[#030712]',
    cardBg: 'rgba(17, 24, 39, 0.75)',
    textColor: '#f3f4f6',
    mutedTextColor: '#9ca3af',
    animation: 'cinematic',
  },
  pastel_whispers: {
    name: 'Pastel Rose Whispers',
    primaryColor: '#e11d48',
    secondaryColor: '#9f1239',
    accentColor: '#fda4af',
    font: 'handwritten',
    background: 'from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3]',
    cardBg: '#ffffff',
    textColor: '#4c0519',
    mutedTextColor: '#881337',
    animation: 'gentle',
  },
};

export function createDefaultModule(type: ModuleType, position: number, recipientName: string = 'Friend'): ExperienceModule {
  const id = `mod_${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  switch (type) {
    case 'CINEMATIC_OPENING':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Cinematic Prelude',
        subtitle: 'The beginning of your birthday story',
        content: {
          title: `For ${recipientName}`,
          subtitle: 'A piece of time gathered just for you.',
          quote: '“Some people make the world brighter just by being in it.”',
          tapToBeginText: 'Step into your moment',
          teddyMessage: 'Teddy is waiting to walk with you through this story.',
        },
      };

    case 'BIRTHDAY_REVEAL':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'The Birthday Reveal',
        subtitle: 'The joyful celebration banner',
        content: {
          headline: `Happy Birthday, ${recipientName}! 🎂`,
          greeting: 'Today is all about honoring your laughter, your courage, and your kind soul.',
          milestoneText: 'Another glorious trip around the sun',
          specialNote: 'Take a breath. This whole little corner of the world was created with love, just for you.',
          confettiColorPalette: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#10b981'],
        },
      };

    case 'LETTER':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Personal Letter',
        subtitle: 'Words from the deepest corner of the heart',
        content: {
          title: `Dear ${recipientName}`,
          openingSalutation: `My dearest ${recipientName},`,
          letterBody: `As your birthday arrives today, I found myself thinking about all the unspoken moments that have shaped our days together.\n\nFrom the quiet late-night talks to the uncontrolled laughing fits over the smallest things, you have brought a light into my life that nothing else could replace.\n\nThank you for being someone I can always count on, someone whose presence makes even ordinary days feel memorable. May this next year bring you all the warmth, peace, and unexpected happiness you so generously give to everyone around you.`,
          signature: 'Forever with love & gratitude,',
          paperStyle: 'parchment',
          inkFont: 'Caveat',
        },
      };

    case 'MEMORY_MAP':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Memory Map',
        subtitle: 'Interactive coordinates of our shared moments',
        content: {
          mapTheme: 'vintage_scroll',
          description: 'Tap on any memory star below to unlock a cherished moment in time.',
          memories: [
            {
              id: 'mem_1',
              title: 'The Day We First Clicked',
              date: 'The Beginning',
              locationName: 'The Cozy Corner Cafe',
              description: 'We talked for four hours straight until the staff gently told us they were closing for the night.',
              photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
              x: 24,
              y: 35,
              color: '#f59e0b',
            },
            {
              id: 'mem_2',
              title: 'The Spontaneous Road Trip',
              date: 'Midsummer',
              locationName: 'The Scenic Coastline',
              description: 'Blasting terrible 2000s music with the windows down, completely lost, but neither of us cared.',
              photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
              x: 52,
              y: 28,
              color: '#ec4899',
            },
            {
              id: 'mem_3',
              title: 'Stargazing on the Rooftop',
              date: 'Autumn Breeze',
              locationName: 'Under the Open Sky',
              description: 'Wrapped in oversized blankets, speaking about our wildest dreams for the next ten years.',
              photoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
              x: 75,
              y: 60,
              color: '#8b5cf6',
            },
          ],
        },
      };

    case 'MUSIC':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Personal Soundtrack',
        subtitle: 'A dedicated soundtrack & melody that sets the mood for the journey',
        content: {
          title: `Birthday Soundtrack for ${recipientName}`,
          senderName: 'With all my heart',
          audioUrl: '',
          durationSeconds: '2:30',
          playAsBackground: true,
          recordedDate: 'Today',
        },
      };

    case 'VOICE':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Live Voice Recording',
        subtitle: 'Recorded live directly in the browser',
        content: {
          title: `A Live Voice Wish for ${recipientName} 🎙`,
          senderName: 'With love',
          audioUrl: '',
          durationSeconds: '0:30',
          transcription: '“Happy Birthday! I hope this year brings you everything you have been dreaming of.”',
          recordedDate: 'Just now',
        },
      };

    case 'VIDEO':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Video Reel',
        subtitle: 'A cinematic video message or montage',
        content: {
          title: `Special Video Greeting`,
          description: 'A few clips and smiles recorded just to bring a smile to your face.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
          duration: '1:15',
        },
      };

    case 'THINGS_NEVER_SAID':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: "Things I've Never Said",
        subtitle: 'Gentle truths that deserve to be heard',
        content: {
          title: "Things I've Never Said Out Loud",
          intro: 'Sometimes life moves fast and we forget to speak the truths that matter most. Tap each card to uncover a quiet confession.',
          items: [
            {
              id: 't_1',
              topic: 'How you inspire me',
              confession: 'Whenever you handle tough times with such grace, I quietly take notes on how to be stronger.',
              revealText: 'Your resilience has given me courage more times than you will ever realize.',
            },
            {
              id: 't_2',
              topic: 'The unspoken gratitude',
              confession: 'Remember when everything went wrong last winter? You did not offer advice, you just sat beside me.',
              revealText: 'Having someone who lets you simply be human is the rarest gift.',
            },
            {
              id: 't_3',
              topic: 'My wish for your future',
              confession: 'I secretly hope you stop doubting whether you belong in the rooms you walk into.',
              revealText: 'You are worthy of every single dream you have ever quietly whispered.',
            },
          ],
        },
      };

    case 'INSIDE_JOKES':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Inside-Joke Vault',
        subtitle: 'Things only you and I will ever laugh at',
        content: {
          title: 'The Inside Joke Archive 🎭',
          intro: 'If anyone else reads this, they will be utterly bewildered. But you know exactly what happened.',
          jokes: [
            {
              id: 'j_1',
              title: 'The Great Navigation Disaster',
              setup: '“Don’t worry, I know a shortcut that avoids all the traffic...”',
              punchline: 'And that is how we ended up staring at cows in an unpaved farm at 11 PM.',
              emoji: '🗺️',
              imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=800&auto=format&fit=crop&q=80',
            },
            {
              id: 'j_2',
              title: 'The 5-Minute Quick Catchup',
              setup: '“I only have 5 minutes to talk today, seriously!”',
              punchline: 'Cut to 3 hours and 42 minutes later, debating whether penguins have knees.',
              emoji: '⏳',
            },
            {
              id: 'j_3',
              title: 'The Master Chef Experiment',
              setup: '“I don’t need the recipe, cooking is about intuition.”',
              punchline: 'The fire alarm was the only musical guest that evening.',
              emoji: '🍳',
            },
          ],
        },
      };

    case 'SECRET':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Secret Vault',
        subtitle: 'Locked away until discovered',
        content: {
          title: 'A Hidden Secret ✨',
          clue: 'To unlock this mystery, enter the magical password or tap Teddy three times.',
          unlockType: 'PASSWORD',
          secretCode: 'teddy',
          secretRevealHeading: 'You Found The Secret!',
          secretRevealMessage: 'Teddy knew you would crack the code! Here is your true surprise: You are receiving a special personalized care package this weekend, handpicked with all your favorites!',
          secretMediaUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        },
      };

    case 'UNIVERSE':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Interactive Universe',
        subtitle: 'Explore an explorable constellation of memories',
        content: {
          universeTheme: 'GOLDEN_NEBULA',
          introMessage: 'Drag your finger or mouse to glide through your personal galaxy. Tap stars and memory orbs to uncover floating thoughts.',
          objects: [
            {
              id: 'obj_1',
              label: 'Star of Kindness',
              type: 'STAR',
              x: 25,
              y: 30,
              size: 28,
              color: '#fbbf24',
              message: 'Your generosity touches people in ways you rarely see.',
            },
            {
              id: 'obj_2',
              label: 'Orb of Laughter',
              type: 'MEMORY_ORB',
              x: 68,
              y: 25,
              size: 34,
              color: '#f43f5e',
              message: 'May your year be overflowing with laughter so loud it makes strangers smile.',
              photoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'obj_3',
              label: 'Planet of Dreams',
              type: 'PLANET',
              x: 45,
              y: 70,
              size: 44,
              color: '#8b5cf6',
              message: 'Every ambition you hold close is within reach. Keep betting on yourself.',
            },
            {
              id: 'obj_4',
              label: 'Teddy Sentinel 🧸',
              type: 'TEDDY_SATELLITE',
              x: 82,
              y: 65,
              size: 32,
              color: '#d97706',
              message: 'Teddy says: “You deserve to be celebrated every single day, not just today!”',
            },
          ],
        },
      };

    case 'GIFT':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Virtual Gift Box',
        subtitle: 'Untie the ribbon and unwrap a digital surprise',
        content: {
          title: `A Gift for ${recipientName}`,
          boxStyle: 'golden_ribbon',
          lidAnimation: 'open_smooth',
          giftMessage: '“Consider this a Golden Ticket for an all-expenses-paid dinner, concert, or day-out of your absolute choice with me!”',
          giftVoucherTitle: 'GOLDEN ADVENTURE VOUCHER',
          giftVoucherDetails: 'Redeemable anytime over the next 365 days. No expiration, unconditional warmth guaranteed.',
          giftPhotoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
        },
      };

    case 'PUZZLE':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Puzzle Reveal',
        subtitle: 'Assemble the scattered pieces to reveal the photo',
        content: {
          gameType: 'PUZZLE',
          title: 'Memory Puzzle Challenge',
          instructions: 'Tap and swap the tiles to reconstruct the picture!',
          targetScore: 9,
          puzzleImageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
          rewardMessage: '🎉 Puzzle solved! Every piece of our memory fits together perfectly.',
        },
      };

    case 'PEOPLE':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'People Who Love You',
        subtitle: 'A wall of heartfelt messages from friends & family',
        content: {
          title: 'Words from Your Circle 💕',
          subtitle: 'People who care about you took a moment to leave their birthday blessings.',
          allowPublicSubmissions: true,
          wishes: [
            {
              id: 'w_1',
              name: 'Maya',
              relationship: 'College Bestie',
              message: 'Happy Birthday sunshine! Never change your goofy energy. Miss you so much!',
              createdAt: 'Yesterday',
            },
            {
              id: 'w_2',
              name: 'Jordan',
              relationship: 'Partner in Crime',
              message: 'Another year wiser, cooler, and somehow even funnier. Have the best celebration today!',
              createdAt: 'Today',
            },
          ],
        },
      };

    case 'STORY':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Our Story Timeline',
        subtitle: 'Key narrative milestones of our bond',
        content: {
          title: 'The Journey So Far 📖',
          intro: 'A chapter-by-chapter look at how we grew together through the seasons.',
          milestones: [
            {
              id: 's_1',
              dateOrYear: 'Chapter 1: The First Hello',
              title: 'Two Strangers Crossing Paths',
              description: 'Neither of us knew that a brief conversation would spark years of inside jokes and trust.',
              tag: 'Beginning',
            },
            {
              id: 's_2',
              dateOrYear: 'Chapter 2: Weathering Storms',
              title: 'Through the Hard Times',
              description: 'When things got tough, we proved that distance and hurdles only made our connection stronger.',
              tag: 'Growth',
            },
            {
              id: 's_3',
              dateOrYear: 'Chapter 3: Here & Now',
              title: 'Celebrating You Today',
              description: 'Standing here now, watching you become the person you were always destined to be.',
              tag: 'Today',
            },
          ],
        },
      };

    case 'FUTURE_WISHES':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'Future Wishes & Bucket List',
        subtitle: 'Promises and adventures for the years ahead',
        content: {
          title: 'Wishes For The Years Ahead 🌠',
          subtitle: 'Things I hope we do, places we will see, and milestones you will conquer.',
          wishes: [
            {
              id: 'fw_1',
              wish: 'Visit that mountain cabin and wake up to the sunrise with hot cider.',
              category: 'Trip & Adventure',
              targetYear: 'This Year',
            },
            {
              id: 'fw_2',
              wish: 'Finish your personal creative project and share it with the world.',
              category: 'Life Milestone',
              targetYear: 'Soon',
            },
            {
              id: 'fw_3',
              wish: 'Always make time for our annual birthday traditions, no matter where life takes us.',
              category: 'Gentle Promise',
            },
          ],
        },
      };

    case 'FINAL_REVEAL':
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: 'The Grand Finale & 100% Reveal',
        subtitle: 'The emotional climax and birthday benediction',
        content: {
          title: 'You Have Unlocked The Whole Journey ✨',
          grandMessage: 'Thank you for stepping into this little universe created for you. As you blow out your candles today, remember how deeply cherished, celebrated, and loved you are. Happy Birthday!',
          photoGallery: [
            'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
          ],
          signature: 'Created with all my heart, always.',
          specialTeddyWisdom: 'Teddy says: “You found 100% of the memories. May your real life be even more magical than this page!”',
          replayButtonText: 'Relive The Journey Again',
        },
      };

    default:
      return {
        _id: id,
        experienceId: '',
        type,
        position,
        enabled: true,
        title: `${type} Module`,
        content: {},
      };
  }
}

export interface TemplatePreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  theme: string;
  modules: ModuleType[];
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'cinematic_story',
    name: 'Cinematic Odyssey',
    tagline: 'Deep, emotional storytelling with soundtrack & memories',
    description: 'An elegant progression from a cinematic opening into an intimate letter, interactive memory map, soundtrack, universe, and grand finale.',
    theme: 'dreamy_dusk',
    modules: ['CINEMATIC_OPENING', 'BIRTHDAY_REVEAL', 'LETTER', 'MEMORY_MAP', 'MUSIC', 'UNIVERSE', 'FINAL_REVEAL'],
  },
  {
    id: 'playful_bestie',
    name: 'Playful Bestie Edition',
    tagline: 'High-energy fun with puzzles, inside jokes & secrets',
    description: 'Packed with interactive photo puzzles, inside-joke vault, quiz questions, secret unlocks, and community wishes from the circle.',
    theme: 'champagne_celebration',
    modules: ['CINEMATIC_OPENING', 'BIRTHDAY_REVEAL', 'INSIDE_JOKES', 'SECRET', 'GIFT', 'PEOPLE', 'FINAL_REVEAL'],
  },
  {
    id: 'scrapbook_nostalgia',
    name: 'Vintage Memory Scrapbook',
    tagline: 'Warm, tactile memories, voice notes & unsaid truths',
    description: 'Feels like opening a cherished wooden keepsake box filled with parchment letters, voice recordings, photo coordinates, and story milestones.',
    theme: 'warm_scrapbook',
    modules: ['CINEMATIC_OPENING', 'BIRTHDAY_REVEAL', 'LETTER', 'MEMORY_MAP', 'VOICE', 'THINGS_NEVER_SAID', 'STORY', 'FINAL_REVEAL'],
  },
  {
    id: 'celestial_universe',
    name: 'The Interactive Universe',
    tagline: 'Explorable starlight constellation & future wishes',
    description: 'A breathtaking celestial canvas where memories orbit in space alongside future bucket list dreams and secret reveals.',
    theme: 'cosmic_stardust',
    modules: ['CINEMATIC_OPENING', 'BIRTHDAY_REVEAL', 'UNIVERSE', 'SECRET', 'FUTURE_WISHES', 'GIFT', 'FINAL_REVEAL'],
  },
];
