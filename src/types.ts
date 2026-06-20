/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TShirtColor {
  id: string;
  name: string;
  hex: string;
  tailwindClass: string;
  textColor: string; // text print default color on this fabric
}

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export interface TShirtStyle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  fabrics: string;
  defaultText: string;
  colors: TShirtColor[];
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  id: string; // unique identification in cart
  styleId: string;
  styleName: string;
  price: number;
  color: TShirtColor;
  size: TShirtSize;
  customText: string;
  fontStyle: string; // modern, tech, classic, elegant
  textColor: string;
  quantity: number;
  image?: string;
  video?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
  replies?: string[];
}

export interface BoutiqueProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  tagline: string;
  description?: string;
  label?: string;
  image?: string;
  video?: string;
  videoDuration?: string;
  isBoosted?: boolean;
  defaultColor: TShirtColor;
  bookmarkColor: 'gold' | 'grey';
  stylePreset: TShirtStyle;
}
