import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DBStore {
  users: any[];
  experiences: any[];
  modules: any[];
  contributors: any[];
  contributions: any[];
  versions: any[];
  sessions: any[];
  auditLogs: any[];
  media: any[];
  aiGenerations: any[];
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const DATA_FILE = path.join(DATA_DIR, 'dearyou_store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir', e);
  }
}

let store: DBStore = {
  users: [],
  experiences: [],
  modules: [],
  contributors: [],
  contributions: [],
  versions: [],
  sessions: [],
  auditLogs: [],
  media: [],
  aiGenerations: [],
};

// Seed sample experience if empty
function seedInitialData() {
  const defaultUser = {
    _id: 'usr_alex_creator',
    name: 'Alex',
    email: 'alex@dearyou.app',
    passwordHash: hashPassword('password123'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleExpId = 'exp_sam_birthday';
  const sampleExp = {
    _id: sampleExpId,
    creatorId: defaultUser._id,
    slug: 'sam-bestfriend-special',
    recipient: {
      name: 'Sam',
      nickname: 'Sammy',
      relationship: 'Best Friend',
      birthday: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    },
    theme: {
      name: 'Warm Vintage Scrapbook',
      primaryColor: '#b45309',
      secondaryColor: '#78350f',
      accentColor: '#f59e0b',
      font: 'editorial',
      background: 'from-[#faf6f0] via-[#f5ede0] to-[#f0e4d0]',
      cardBg: '#fffdfa',
      textColor: '#292524',
      mutedTextColor: '#78716c',
      animation: 'gentle',
    },
    privacy: {
      type: 'PUBLIC',
    },
    settings: {
      surpriseMode: false,
      expiryType: 'NEVER',
      birthdayMode: 'COUNTDOWN',
      allowResume: true,
      backgroundMusicUrl: '',
      musicAutoPlay: false,
    },
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  const sampleModules = [
    {
      _id: 'mod_open_1',
      experienceId: sampleExpId,
      type: 'CINEMATIC_OPENING',
      position: 0,
      enabled: true,
      title: 'Cinematic Prelude',
      content: {
        title: 'For Sam',
        subtitle: 'A universe of memories gathered just for you.',
        quote: '“Some people make the world brighter just by being in it.”',
        tapToBeginText: 'Step into your story',
        teddyMessage: 'Teddy is here to walk beside you through every memory.',
      },
    },
    {
      _id: 'mod_reveal_2',
      experienceId: sampleExpId,
      type: 'BIRTHDAY_REVEAL',
      position: 1,
      enabled: true,
      title: 'The Birthday Reveal',
      content: {
        headline: 'Happy Birthday, Sam! 🎂',
        greeting: 'Another year of your infectious laughter, courage, and radiant kindness.',
        milestoneText: 'Celebrating the incredible human you are today',
        specialNote: 'Every star on this page was placed with intention. Explore at your own pace.',
        confettiColorPalette: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#a855f7'],
      },
    },
    {
      _id: 'mod_letter_3',
      experienceId: sampleExpId,
      type: 'LETTER',
      position: 2,
      enabled: true,
      title: 'Personal Letter',
      content: {
        title: 'Dear Sam',
        openingSalutation: 'My dearest Sam,',
        letterBody: `As your birthday arrives today, I found myself thinking about all the unspoken moments that have shaped our days together.\n\nFrom our marathon late-night conversations over diner pancakes to the uncontrolled laughing fits over things nobody else understood, you have brought a genuine warmth into my life that nothing else could replace.\n\nThank you for being someone I can always count on, whose presence makes even ordinary Tuesdays feel like adventures. May this year ahead bring you all the peace, laughter, and bold leaps of faith you deserve!`,
        signature: 'Forever your friend, Alex',
        paperStyle: 'parchment',
        inkFont: 'Caveat',
      },
    },
    {
      _id: 'mod_map_4',
      experienceId: sampleExpId,
      type: 'MEMORY_MAP',
      position: 3,
      enabled: true,
      title: 'Memory Map',
      content: {
        mapTheme: 'vintage_scroll',
        description: 'Interactive coordinates of moments that changed our story.',
        memories: [
          {
            id: 'mem_1',
            title: 'The 2 AM Diner Miracle',
            date: 'Autumn',
            locationName: 'Corner Diner',
            description: 'We ordered breakfast at 2 AM and ended up solving all the mysteries of the universe.',
            photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
            x: 28,
            y: 35,
            color: '#f59e0b',
          },
          {
            id: 'mem_2',
            title: 'Lost on Coastal Route 1',
            date: 'Summer Holiday',
            locationName: 'The Ocean Cliffs',
            description: 'GPS failed, song playlist was on repeat, and the sunset was pure cinematic gold.',
            photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
            x: 55,
            y: 26,
            color: '#ec4899',
          },
          {
            id: 'mem_3',
            title: 'Rooftop Fireworks & Confetti',
            date: 'New Year Eve',
            locationName: 'The Highline View',
            description: 'Counting down into the future, making promises that we kept.',
            photoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
            x: 74,
            y: 58,
            color: '#8b5cf6',
          },
        ],
      },
    },
    {
      _id: 'mod_music_5',
      experienceId: sampleExpId,
      type: 'MUSIC',
      position: 4,
      enabled: true,
      title: 'Soundtrack to Our Days',
      content: {
        trackTitle: 'Lofi Birthday Acoustic Glow',
        artist: 'DearYou Studio Acoustics',
        audioUrl: '',
        ambientPreset: 'piano_lullaby',
        autoplay: false,
        loop: true,
        volume: 0.7,
      },
    },
    {
      _id: 'mod_voice_6',
      experienceId: sampleExpId,
      type: 'VOICE',
      position: 5,
      enabled: true,
      title: 'Voice Note for Sam',
      content: {
        title: 'Listen With Your Heart 🎧',
        senderName: 'Alex',
        audioUrl: '',
        durationSeconds: 38,
        transcription: '“Hey Sam! Just wanted you to hear this directly: Happy Birthday! You are one of the most generous humans on this planet, and I hope today treats you like royalty.”',
        recordedDate: 'Recorded for today',
      },
    },
    {
      _id: 'mod_jokes_7',
      experienceId: sampleExpId,
      type: 'INSIDE_JOKES',
      position: 6,
      enabled: true,
      title: 'Inside-Joke Vault',
      content: {
        title: 'The Inside Joke Archive 🎭',
        intro: 'Moments that make zero sense to anyone else on earth.',
        jokes: [
          {
            id: 'j_1',
            title: '“I Have A Great Sense of Direction”',
            setup: 'You said we were only 2 minutes away...',
            punchline: '...and that is why we spent 45 minutes in a tractor supply store parking lot.',
            emoji: '🧭',
          },
          {
            id: 'j_2',
            title: 'The Secret Handshake Incident',
            setup: 'We tried doing an elaborate 10-step handshake at the coffee shop.',
            punchline: 'And knocked over a sugar dispenser that bounced like a basketball.',
            emoji: '☕',
          },
        ],
      },
    },
    {
      _id: 'mod_game_8',
      experienceId: sampleExpId,
      type: 'MINI_GAME',
      position: 7,
      enabled: true,
      title: 'Balloon Pop Game',
      content: {
        gameType: 'BALLOON_POP',
        title: 'Birthday Balloon Popper 🎈',
        instructions: 'Pop 8 birthday balloons before the clock runs down to unlock the mystery box!',
        targetScore: 8,
        questions: [
          {
            question: 'What is Sam’s true natural superpower?',
            options: ['Finding great music', 'Always knowing when friends need a hug', 'Winning trivial debates', 'All of the above!'],
            correctIndex: 3,
            explanation: 'Literally undefeated in every category.',
          },
        ],
        rewardMessage: '✨ You did it! 100% completion on the balloon challenge!',
      },
    },
    {
      _id: 'mod_secret_9',
      experienceId: sampleExpId,
      type: 'SECRET',
      position: 8,
      enabled: true,
      title: 'Secret Vault',
      content: {
        title: 'A Hidden Secret 🔒',
        clue: 'Enter the magic secret word: “teddy” (or tap Teddy 3 times) to unlock!',
        unlockType: 'PASSWORD',
        secretCode: 'teddy',
        secretRevealHeading: 'Secret Unlocked! 🌟',
        secretRevealMessage: 'You found the hidden note: Next Saturday, dinner & dessert are fully on me at your favorite rooftop spot!',
        secretMediaUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
      },
    },
    {
      _id: 'mod_universe_10',
      experienceId: sampleExpId,
      type: 'UNIVERSE',
      position: 9,
      enabled: true,
      title: 'Interactive Universe',
      content: {
        universeTheme: 'GOLDEN_NEBULA',
        introMessage: 'Drag to glide across your personal galaxy. Tap on floating orbs and stars.',
        objects: [
          {
            id: 'obj_1',
            label: 'Star of Kindness',
            type: 'STAR',
            x: 22,
            y: 32,
            size: 30,
            color: '#fbbf24',
            message: 'Your kindness leaves ripples in every room you enter.',
          },
          {
            id: 'obj_2',
            label: 'Memory Nebula',
            type: 'MEMORY_ORB',
            x: 70,
            y: 28,
            size: 36,
            color: '#f43f5e',
            message: 'Remember the festival in the rain? Best day ever.',
            photoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
          },
          {
            id: 'obj_3',
            label: 'Planet of Dreams',
            type: 'PLANET',
            x: 48,
            y: 68,
            size: 44,
            color: '#8b5cf6',
            message: 'Never give up on your big photography dream.',
          },
          {
            id: 'obj_4',
            label: 'Teddy Sentinel 🧸',
            type: 'TEDDY_SATELLITE',
            x: 80,
            y: 70,
            size: 32,
            color: '#d97706',
            message: 'Teddy says: “You are officially the coolest birthday person in the universe!”',
          },
        ],
      },
    },
    {
      _id: 'mod_gift_11',
      experienceId: sampleExpId,
      type: 'GIFT',
      position: 10,
      enabled: true,
      title: 'Virtual Gift Box',
      content: {
        title: 'A Gift for Sam 🎁',
        boxStyle: 'golden_ribbon',
        lidAnimation: 'open_smooth',
        giftMessage: '“You are receiving a real-life custom birthday hamper this week!”',
        giftVoucherTitle: 'GOLDEN FRIENDSHIP PASS',
        giftVoucherDetails: 'Valid forever for 100 laughter sessions and 0 judgment.',
        giftPhotoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
      },
    },
    {
      _id: 'mod_people_12',
      experienceId: sampleExpId,
      type: 'PEOPLE',
      position: 11,
      enabled: true,
      title: 'People Who Love You',
      content: {
        title: 'Notes from the Circle 💕',
        subtitle: 'A few friends dropped by with warm wishes for you.',
        allowPublicSubmissions: true,
        wishes: [
          {
            id: 'w_1',
            name: 'Maya',
            relationship: 'Friend',
            message: 'Happy birthday to the person who makes every hangout ten times better! Have the happiest day!',
            createdAt: '2 days ago',
          },
          {
            id: 'w_2',
            name: 'Leo',
            relationship: 'Cousin',
            message: 'Happy Birthday Sam! Keep shining bright and never lose your amazing curiosity.',
            createdAt: 'Yesterday',
          },
        ],
      },
    },
    {
      _id: 'mod_final_13',
      experienceId: sampleExpId,
      type: 'FINAL_REVEAL',
      position: 12,
      enabled: true,
      title: 'The Grand Finale',
      content: {
        title: 'You Reached 100% ✨',
        grandMessage: 'As another chapter begins today, know that you are deeply appreciated, celebrated, and loved. Blow out your candles, make your biggest wish, and smile. Happy Birthday, Sam!',
        photoGallery: [
          'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
        ],
        signature: 'Crafted with love by Alex',
        specialTeddyWisdom: 'Teddy says: “You found every secret. Here’s to a year of pure wonder!” 🧸✨',
        replayButtonText: 'Relive The Journey Again',
      },
    },
  ];

  store.users = [defaultUser];
  store.experiences = [sampleExp];
  store.modules = sampleModules;

  // Create initial published version
  store.versions = [
    {
      _id: 'ver_1',
      experienceId: sampleExpId,
      versionNumber: 1,
      snapshot: { ...sampleExp, modules: sampleModules },
      publishedAt: sampleExp.publishedAt,
      createdBy: defaultUser._id,
    },
  ];

  persistStore();
}

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
    } else {
      seedInitialData();
    }
  } catch (err) {
    console.warn('Error reading store file, seeding defaults:', err);
    seedInitialData();
  }
}

function persistStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store to disk:', err);
  }
}

// Password hashing
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'dearyou_salt_key').digest('hex');
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Initialize on start
loadStore();

export const db = {
  // Users
  findUserByEmail: (email: string) => store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  findUserById: (id: string) => store.users.find((u) => u._id === id),
  createUser: (userData: any) => {
    const user = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(user);
    persistStore();
    return user;
  },

  // Experiences
  findExperiencesByCreator: (creatorId: string) => {
    return store.experiences
      .filter((e) => e.creatorId === creatorId)
      .map((exp) => {
        const mods = store.modules.filter((m) => m.experienceId === exp._id).sort((a, b) => a.position - b.position);
        return { ...exp, modules: mods };
      });
  },

  findExperienceById: (id: string) => {
    const exp = store.experiences.find((e) => e._id === id);
    if (!exp) return null;
    const mods = store.modules.filter((m) => m.experienceId === exp._id).sort((a, b) => a.position - b.position);
    return { ...exp, modules: mods };
  },

  findExperienceBySlug: (slug: string) => {
    const exp = store.experiences.find((e) => e.slug.toLowerCase() === slug.toLowerCase());
    if (!exp) return null;
    const mods = store.modules.filter((m) => m.experienceId === exp._id && m.enabled).sort((a, b) => a.position - b.position);
    return { ...exp, modules: mods };
  },

  createExperience: (data: any) => {
    const exp = {
      _id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      status: data.status || 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.experiences.push(exp);
    persistStore();
    return exp;
  },

  updateExperience: (id: string, updates: any) => {
    const idx = store.experiences.findIndex((e) => e._id === id);
    if (idx === -1) return null;
    store.experiences[idx] = {
      ...store.experiences[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistStore();
    return db.findExperienceById(id);
  },

  deleteExperience: (id: string) => {
    const idx = store.experiences.findIndex((e) => e._id === id);
    if (idx === -1) return false;
    store.experiences.splice(idx, 1);
    store.modules = store.modules.filter((m) => m.experienceId !== id);
    store.contributors = store.contributors.filter((c) => c.experienceId !== id);
    store.contributions = store.contributions.filter((c) => c.experienceId !== id);
    store.versions = store.versions.filter((v) => v.experienceId !== id);
    persistStore();
    return true;
  },

  // Modules
  findModulesByExperience: (experienceId: string) => {
    return store.modules.filter((m) => m.experienceId === experienceId).sort((a, b) => a.position - b.position);
  },

  createModule: (moduleData: any) => {
    const mod = {
      _id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...moduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.modules.push(mod);
    persistStore();
    return mod;
  },

  updateModule: (moduleId: string, updates: any) => {
    const idx = store.modules.findIndex((m) => m._id === moduleId);
    if (idx === -1) return null;
    store.modules[idx] = {
      ...store.modules[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistStore();
    return store.modules[idx];
  },

  deleteModule: (moduleId: string) => {
    const idx = store.modules.findIndex((m) => m._id === moduleId);
    if (idx === -1) return false;
    store.modules.splice(idx, 1);
    persistStore();
    return true;
  },

  reorderModules: (experienceId: string, moduleIds: string[]) => {
    moduleIds.forEach((id, index) => {
      const mod = store.modules.find((m) => m._id === id && m.experienceId === experienceId);
      if (mod) {
        mod.position = index;
        mod.updatedAt = new Date().toISOString();
      }
    });
    persistStore();
    return db.findModulesByExperience(experienceId);
  },

  // Versions
  findVersions: (experienceId: string) => {
    return store.versions.filter((v) => v.experienceId === experienceId).sort((a, b) => b.versionNumber - a.versionNumber);
  },

  createVersion: (experienceId: string, createdBy: string) => {
    const exp = db.findExperienceById(experienceId);
    if (!exp) return null;
    const existingVersions = store.versions.filter((v) => v.experienceId === experienceId);
    const nextVer = existingVersions.length + 1;
    const version = {
      _id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      experienceId,
      versionNumber: nextVer,
      snapshot: JSON.parse(JSON.stringify(exp)),
      publishedAt: new Date().toISOString(),
      createdBy,
    };
    store.versions.push(version);

    // Update experience status and publishedAt
    db.updateExperience(experienceId, {
      status: 'PUBLISHED',
      publishedAt: version.publishedAt,
    });

    persistStore();
    return version;
  },

  restoreVersion: (experienceId: string, versionId: string) => {
    const version = store.versions.find((v) => v._id === versionId && v.experienceId === experienceId);
    if (!version) return null;
    const snapshot = version.snapshot;

    // Restore experience
    db.updateExperience(experienceId, {
      recipient: snapshot.recipient,
      theme: snapshot.theme,
      privacy: snapshot.privacy,
      settings: snapshot.settings,
    });

    // Replace modules
    store.modules = store.modules.filter((m) => m.experienceId !== experienceId);
    if (snapshot.modules && Array.isArray(snapshot.modules)) {
      snapshot.modules.forEach((m: any) => {
        store.modules.push({ ...m, experienceId });
      });
    }
    persistStore();
    return db.findExperienceById(experienceId);
  },

  // Contributors
  findContributors: (experienceId: string) => {
    return store.contributors.filter((c) => c.experienceId === experienceId);
  },

  findContributorByToken: (token: string) => {
    return store.contributors.find((c) => c.token === token);
  },

  createContributor: (experienceId: string, name: string, email?: string) => {
    const contributor = {
      _id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      experienceId,
      name,
      email: email || '',
      token: crypto.randomBytes(16).toString('hex'),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.contributors.push(contributor);
    persistStore();
    return contributor;
  },

  deleteContributor: (id: string) => {
    const idx = store.contributors.findIndex((c) => c._id === id);
    if (idx === -1) return false;
    store.contributors.splice(idx, 1);
    persistStore();
    return true;
  },

  // Contributions
  findContributions: (experienceId: string) => {
    return store.contributions.filter((c) => c.experienceId === experienceId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findApprovedContributions: (experienceId: string) => {
    return store.contributions.filter((c) => c.experienceId === experienceId && c.approved);
  },

  createContribution: (data: any) => {
    const contribution = {
      _id: `ctb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...data,
      approved: false,
      reviewStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    store.contributions.push(contribution);
    persistStore();
    return contribution;
  },

  reviewContribution: (id: string, approved: boolean, creatorNote?: string) => {
    const ctb = store.contributions.find((c) => c._id === id);
    if (!ctb) return null;
    ctb.approved = approved;
    ctb.reviewStatus = approved ? 'APPROVED' : 'REJECTED';
    if (creatorNote) ctb.creatorNote = creatorNote;
    persistStore();
    return ctb;
  },

  // Recipient Sessions & Progress
  getSessionProgress: (experienceId: string, sessionId: string) => {
    let sess = store.sessions.find((s) => s.experienceId === experienceId && s.sessionId === sessionId);
    if (!sess) {
      sess = {
        _id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        experienceId,
        sessionId,
        completedModules: [],
        discoveredSecrets: [],
        gamesCompleted: [],
        universeDiscoveries: [],
        progress: 0,
        lastVisitedAt: new Date().toISOString(),
      };
      store.sessions.push(sess);
      persistStore();
    }
    return sess;
  },

  updateSessionProgress: (experienceId: string, sessionId: string, updates: any) => {
    let sess = db.getSessionProgress(experienceId, sessionId);
    if (updates.completedModules) {
      sess.completedModules = Array.from(new Set([...sess.completedModules, ...updates.completedModules]));
    }
    if (updates.discoveredSecrets) {
      sess.discoveredSecrets = Array.from(new Set([...sess.discoveredSecrets, ...updates.discoveredSecrets]));
    }
    if (updates.gamesCompleted) {
      sess.gamesCompleted = Array.from(new Set([...sess.gamesCompleted, ...updates.gamesCompleted]));
    }
    if (updates.universeDiscoveries) {
      sess.universeDiscoveries = Array.from(new Set([...sess.universeDiscoveries, ...updates.universeDiscoveries]));
    }
    if (typeof updates.progress === 'number') {
      sess.progress = Math.min(100, Math.max(0, updates.progress));
    }
    sess.lastVisitedAt = new Date().toISOString();
    persistStore();
    return sess;
  },

  // Audit Logs
  logAudit: (action: string, actorId: string, details?: any) => {
    const log = {
      _id: `aud_${Date.now()}`,
      action,
      actorId,
      details,
      timestamp: new Date().toISOString(),
    };
    store.auditLogs.push(log);
    persistStore();
    return log;
  },
};
