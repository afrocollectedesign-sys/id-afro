/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TShirtStyle, Review, BoutiqueProduct } from '../types';

export const COLOR_PRESETS = {
  white: {
    id: 'clr-white',
    name: 'Alabaster White',
    hex: '#FFFFFF',
    tailwindClass: 'bg-white border-zinc-300',
    textColor: '#18181B',
  },
  black: {
    id: 'clr-black',
    name: 'Pitch Black',
    hex: '#18181B',
    tailwindClass: 'bg-zinc-900 border-zinc-700',
    textColor: '#FFFFFF',
  },
  navy: {
    id: 'clr-navy',
    name: 'Ocean Cobalt',
    hex: '#2B3e50',
    tailwindClass: 'bg-slate-800 border-slate-650',
    textColor: '#F8FAFC',
  },
  sage: {
    id: 'clr-sage',
    name: 'Desert Sage',
    hex: '#627264',
    tailwindClass: 'bg-emerald-800 border-emerald-900',
    textColor: '#F5F5F0',
  },
  heather: {
    id: 'clr-heather',
    name: 'Heather Orchid',
    hex: '#A399B2',
    tailwindClass: 'bg-purple-300 border-purple-400',
    textColor: '#18181B',
  }
};

export const TSHIRT_STYLES: TShirtStyle[] = [
  {
    id: 'style-underscrub',
    name: 'Super Soft Shortsleeve',
    tagline: 'Engineered for Awesome Humans',
    description: 'A technical high-performance crewneck constructed using spun organic yarns for ultra-smooth comfort beneath scrubs, lab coats, or on its own. Resists pilling, wicks sweat, and retains its architectural body shape after intensive washing cycles.',
    price: 18340,
    fabrics: '78% Spun Polyester, 17% Rayon, 5% DuPont Spandex',
    defaultText: 'AWESOME HUMANS',
    rating: 4.9,
    reviewCount: 224,
    colors: [
      COLOR_PRESETS.white,
      COLOR_PRESETS.black,
      COLOR_PRESETS.navy,
      COLOR_PRESETS.sage,
      COLOR_PRESETS.heather
    ]
  },
  {
    id: 'style-athletic',
    name: 'Core Performance Active',
    tagline: 'Four-Way Stretch Core Layer',
    description: 'Optimized dual-weave synthetic mesh built for intense shift-movements and dynamic cooling. Features flatlock anti-rub security seams, curved hem drop cuts, and subtle lateral mesh breathing panels.',
    price: 20960,
    fabrics: '90% Recycled Nylon, 10% Lycra Core',
    defaultText: 'SHIFT READY',
    rating: 4.8,
    reviewCount: 96,
    colors: [
      COLOR_PRESETS.black,
      COLOR_PRESETS.navy,
      COLOR_PRESETS.sage
    ]
  },
  {
    id: 'style-classic',
    name: 'Heavyweight Slub Pocket',
    tagline: 'Vintage Comfort, Modern Durability',
    description: 'Textured slub cotton featuring a thickened vintage rib-knit neckline and structured raw-edge Left Chest utility pocket. Comfortably oversized style built for reliable after-hour transitions.',
    price: 19650,
    fabrics: '100% Organic Ring-Spun Cotton Slub',
    defaultText: "id'afro LABS",
    rating: 4.7,
    reviewCount: 148,
    colors: [
      COLOR_PRESETS.white,
      COLOR_PRESETS.black,
      COLOR_PRESETS.heather
    ]
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Sarah M.',
    rating: 5,
    text: 'Littéralement le t-shirt le plus doux que j\'aie jamais possédé. Je le porte sous ma blouse tous les jours. La coupe est ultra-confortable et tombe parfaitement ! Il résiste parfaitement aux cycles de lavage sans rétrécir.',
    date: '2026-05-18',
    verified: true,
    replies: ['Merci Sarah ! Nous avons conçu ce tissu spécifiquement pour résister aux longues journées. Portez-le bien ! - L\'équipe']
  },
  {
    id: 'rev-2',
    author: 'Michael T.',
    rating: 5,
    text: 'J\'ai acheté le modèle Pitch Black et il est incroyablement élégant. La matière est respirante et robuste. La coupe est ajustée et très professionnelle. Coupe 10/10 !',
    date: '2026-05-29',
    verified: true
  },
  {
    id: 'rev-3',
    author: 'Emma L.',
    rating: 4,
    text: 'Excellente longueur, ne remonte pas en mouvement. Entièrement respirable. Le tissu blanc est bien opaque, sans transparence indésirable. Le service client de la boutique est d\'une grande réactivité.',
    date: '2026-06-02',
    verified: true
  },
  {
    id: 'rev-4',
    author: 'David K.',
    rating: 5,
    text: 'La qualité est digne d\'une marque haut de gamme. Le coton bio mélangé est soyeux tout en gardant une excellente tenue pour un style structuré impeccable.',
    date: '2026-06-10',
    verified: false
  }
];

export const INITIAL_BOUTIQUE_PRODUCTS: BoutiqueProduct[] = [
  {
    id: 'btq-1',
    name: "L'Alabâtre Pur",
    price: 18340,
    category: 'COLLECTION REGULAR',
    tagline: 'Coton peigné de 240g léger',
    defaultColor: COLOR_PRESETS.white,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[0],
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-2',
    name: "Le Charbon Mat",
    price: 20960,
    category: 'COUP DE CŒUR ATELIER',
    tagline: 'Sensation soyeuse anti-boulochage',
    defaultColor: COLOR_PRESETS.black,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[1],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-3',
    name: "La Sauge Sauvage",
    price: 19650,
    category: 'LES COUTES DU FIGS',
    tagline: 'Coupe ample décontractée',
    defaultColor: COLOR_PRESETS.sage,
    bookmarkColor: 'gold',
    stylePreset: TSHIRT_STYLES[2],
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-4',
    name: "L'Étoffe Vert d'Eau",
    price: 22925,
    category: 'PIÈCE MAÎTRESSE',
    tagline: 'Teinture organique durable',
    label: 'Nouveauté de saison',
    defaultColor: COLOR_PRESETS.sage,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[0],
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-5',
    name: "Le Pardessus Lin",
    price: 27510,
    category: 'OUTERWEAR BASE',
    tagline: 'Moulé sur le buste sans friction',
    defaultColor: COLOR_PRESETS.heather,
    bookmarkColor: 'gold',
    stylePreset: TSHIRT_STYLES[2],
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-6',
    name: "Bleu Cobalt Profond",
    price: 19650,
    category: 'MATIÈRE NOBLE',
    tagline: 'Souffle d’élégance minimaliste',
    defaultColor: COLOR_PRESETS.navy,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[1],
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-7',
    name: "L'Ocre Volcanique",
    price: 18995,
    category: 'COLLECTION REGULAR',
    tagline: 'Teinte chaude terre de Sienne',
    defaultColor: COLOR_PRESETS.heather,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[0],
    image: 'https://images.unsplash.com/photo-1618354691551-44de113f0164?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-8',
    name: "La Brume Matinale",
    price: 22270,
    category: 'MATIÈRE NOBLE',
    tagline: 'Toucher ultra-doux micro-tricot',
    defaultColor: COLOR_PRESETS.white,
    bookmarkColor: 'gold',
    stylePreset: TSHIRT_STYLES[1],
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-9',
    name: "Cacao Intense",
    price: 20305,
    category: 'COUP DE CŒUR ATELIER',
    tagline: 'Finition brossée velours haut de gamme',
    defaultColor: COLOR_PRESETS.black,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[2],
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-10',
    name: "L'Argile Pure",
    price: 21615,
    category: 'COLLECTION REGULAR',
    tagline: 'Coton bio non teinté éco-responsable',
    defaultColor: COLOR_PRESETS.white,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[0],
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-11',
    name: "Olive Distillée",
    price: 23580,
    category: 'COUP DE CŒUR ATELIER',
    tagline: 'Sensation fraîcheur lin-coton respirante',
    defaultColor: COLOR_PRESETS.sage,
    bookmarkColor: 'gold',
    stylePreset: TSHIRT_STYLES[1],
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'btq-12',
    name: "Noir de Suie",
    price: 24890,
    category: 'MATIÈRE NOBLE',
    tagline: 'Édition spéciale fil torsadé tricoté',
    defaultColor: COLOR_PRESETS.black,
    bookmarkColor: 'grey',
    stylePreset: TSHIRT_STYLES[2],
    image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=800'
  }
];
