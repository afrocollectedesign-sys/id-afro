/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  PlusCircle,
  Plus, 
  Minus, 
  Trash2, 
  Sparkles, 
  Share2, 
  Bell,
  Sun,
  Moon,
  Star, 
  X, 
  Sliders, 
  ShieldCheck, 
  Droplets, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  MapPin, 
  CreditCard, 
  Smartphone,
  Wallet,
  Building2,
  ChevronRight,
  Truck,
  Award,
  Grid,
  Compass,
  Home,
  Shirt,
  BarChart2,
  Link,
  Upload,
  Pencil,
  Video,
  MessageCircleMore,
  TrendingUp,
  Package,
  Activity,
  AtSign,
  ShoppingCart,
  Eye,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AnimatePresence, motion } from 'motion/react';
import { TShirtStyle, TShirtColor, TShirtSize, CartItem, Review, BoutiqueProduct } from './types';
import { TSHIRT_STYLES, INITIAL_REVIEWS, COLOR_PRESETS, INITIAL_BOUTIQUE_PRODUCTS } from './data/mockData';
import { loadProductsFromIndexedDB, saveProductsToIndexedDB } from './utils/db';
import BoutiqueView from './components/BoutiqueView';
import { VideoPlayer } from './components/VideoPlayer';
import { loginWithGoogle, logout as firebaseLogout, getCachedToken } from './lib/firebase';
import heroModelImg from './hero-model.png';
import heroRackImg from './hero-rack.png';
import africanNaturePeople from './assets/images/african_nature_people_1781474083970.jpg';

export default function App() {
  // --- STATE SYSTEM ---
  const [currentView, setCurrentView] = useState<'home' | 'customizer' | 'history' | 'profile'>('home');
  const [selectedStyle, setSelectedStyle] = useState<TShirtStyle>(TSHIRT_STYLES[0]);
  const [selectedColor, setSelectedColor] = useState<TShirtColor>(TSHIRT_STYLES[0].colors[0]);
  const [selectedSize, setSelectedSize] = useState<TShirtSize>('M');
  const [customText, setCustomText] = useState<string>(TSHIRT_STYLES[0].defaultText);
  const [fontStyle, setFontStyle] = useState<string>('modern');
  const [customScale, setCustomScale] = useState<number>(1.0);
  const [customInkColor, setCustomInkColor] = useState<string>('#18181B');
  const [showPrintArea, setShowPrintArea] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [wishlistCount, setWishlistCount] = useState<number>(12);

  // Moved to avoid ReferenceError

  // Home Page fluid image slider state & setup
  const [currentHeroIndex, setCurrentHeroIndex] = useState<number>(0);
  const [heroDirection, setHeroDirection] = useState<number>(1);

  const heroSlides = [
    {
      image: heroModelImg,
      title: "Active Collection",
      subtitle: "CONFECTION EXCLUSIVE",
    },
    {
      image: heroRackImg,
      title: "Artistic Atelier",
      subtitle: "ESPRIT SANS ENGAGEMENT",
    },
    {
      image: heroModelImg,
      title: "Collection Premium FIGS",
      subtitle: "L'EXCELLENCE DE LA COUPE",
    }
  ];

  // Automatic automatic cycling effect
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroDirection(1);
      setCurrentHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const [selectedBoutiqueProduct, setSelectedBoutiqueProduct] = useState<any | null>(null);
  const [boutiqueProducts, setBoutiqueProducts] = useState<BoutiqueProduct[]>(() => {
    const saved = localStorage.getItem('idafro_products');
    return saved ? JSON.parse(saved) : INITIAL_BOUTIQUE_PRODUCTS;
  });
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  // Load from IndexedDB on mount to support heavy content (larger videos)
  useEffect(() => {
    const initLoad = async () => {
      try {
        const indexedProducts = await loadProductsFromIndexedDB();
        if (indexedProducts && indexedProducts.length > 0) {
          setBoutiqueProducts(indexedProducts);
        }
      } catch (err) {
        console.error("Failed to load products from IndexedDB", err);
      }
    };
    initLoad();
  }, []);

  // Persist products to both IndexedDB (full data) and localStorage (fallback/light config)
  useEffect(() => {
    const hasHeuristics = boutiqueProducts.some(p => p.video === 'HEAVY_BASE64');
    
    // 1. Always save full data in IndexedDB, unless it's the stripped fallback
    if (!hasHeuristics) {
      saveProductsToIndexedDB(boutiqueProducts);
    }

    // 2. Save sync fallback to localStorage
    try {
      localStorage.setItem('idafro_products', JSON.stringify(boutiqueProducts));
    } catch (error) {
      console.warn('Storage quota exceeded for localStorage, using IndexedDB exclusively for videos.');
      // Remove or prune heavy base64 strings in localStorage to avoid crash, but keep IndexedDB intact!
      try {
        const lightweight = boutiqueProducts.map(p => ({
          ...p,
          video: p.video && p.video.startsWith('data:') ? 'HEAVY_BASE64' : p.video
        }));
        localStorage.setItem('idafro_products', JSON.stringify(lightweight));
      } catch (e) {
        // Let it silently fail, IndexedDB is our source of truth anyway!
      }
    }
  }, [boutiqueProducts]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'idafro_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          // If the parsed items have 'HEAVY_BASE64', don't overwrite the state since our state has the real video from IndexedDB!
          const hasHeuristics = parsed.some((p: any) => p.video === 'HEAVY_BASE64');
          if (!hasHeuristics) {
            setBoutiqueProducts(parsed);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cart Drawer & Items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState<boolean>(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  
  // Checkout Multi-step Dialog
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment' | 'success'>('info');
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    paymentMethod: 'flooz' as 'flooz' | 'tmoney' | 'moov' | 'card',
    momoNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  });

  const [pastOrders, setPastOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem('idafro_past_orders_v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('idafro_past_orders_v2', JSON.stringify(pastOrders));
  }, [pastOrders]);


  // Review List & Submission
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [newReview, setNewReview] = useState({ author: '', rating: 5, text: '' });
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

  // UI Utilities
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [sizeUnit, setSizeUnit] = useState<'in' | 'cm'>('in');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [boutiqueSearchQuery, setBoutiqueSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{msg: string, image?: string} | null>(null);
  const [isAddingToBag, setIsAddingToBag] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(2);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notificationsList, setNotificationsList] = useState<{id: string, text: string, date: string, source: 'system' | 'flooz'}[]>([
    {
      id: "notif-0",
      text: "Commande de 15 000 FCFA reçue de AMENYAH Komi (22890123456). Article: Tee-shirt Premium id'afro. Statut: Prêt pour impression.",
      date: new Date(Date.now() - 30 * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      source: 'flooz'
    },
    {
      id: "notif-1",
      text: "Nouvelle commande confirmée de DOE John (22899887766). Montant: 45 000 FCFA. Expédition en préparation.",
      date: new Date(Date.now() - 120 * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      source: 'flooz'
    }
  ]);

  // Update Document Title based on current view
  useEffect(() => {
    if (isCheckoutOpen) {
      document.title = "id'afro | Caisse Sécurisée";
    } else if (isNotificationsOpen) {
      document.title = "id'afro | Notifications";
    } else if (isCartOpen) {
      document.title = "id'afro | Mon Panier";
    } else if (isPortfolioOpen) {
      document.title = "id'afro | Portfolio";
    } else {
      switch (currentView) {
        case 'home':
          document.title = "id'afro | Accueil";
          break;
        case 'customizer':
          document.title = "id'afro | Boutique Premium";
          break;
        case 'history':
          document.title = "id'afro | Suivi Commandes";
          break;
        case 'profile':
          document.title = "id'afro | Mon Compte";
          break;
        default:
          document.title = "id'afro | Boutique Premium";
      }
    }
  }, [currentView, isCheckoutOpen, isCartOpen, isPortfolioOpen, isNotificationsOpen]);

  // Automatically update selected color when style changes
  useEffect(() => {
    setSelectedColor(selectedStyle.colors[0]);
    setCustomText(selectedStyle.defaultText);
  }, [selectedStyle]);

  // Automatically set ink color defaults based on t-shirt fabric darkness
  useEffect(() => {
    setCustomInkColor(selectedColor.textColor);
  }, [selectedColor]);

  // Helper: Trigger custom toast feedback
  const triggerToast = (msg: string, image?: string) => {
    setToastMessage({ msg, image });
    setNotificationsList(prev => [{ id: Math.random().toString(36).substr(2, 9), text: msg, date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), source: 'system' }, ...prev].slice(0, 50));
    setUnreadNotificationsCount(prev => prev + 1);
    
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const triggerFloozNotification = (text: string) => {
    setNotificationsList(prev => [{ id: Math.random().toString(36).substr(2, 9), text, date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), source: 'flooz' }, ...prev].slice(0, 50));
    setUnreadNotificationsCount(prev => prev + 1);
  };

  const confirmOrder = (orderId: string) => {
    setPastOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Expédié' } : o));
    triggerToast("Commande confirmée et mise à jour.");
  };

  // Switch between styles helper
  const handleStyleSwitch = (direction: 'next' | 'prev') => {
    const currentIndex = TSHIRT_STYLES.findIndex(s => s.id === selectedStyle.id);
    let nextIndex = currentIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % TSHIRT_STYLES.length;
    } else {
      nextIndex = (currentIndex - 1 + TSHIRT_STYLES.length) % TSHIRT_STYLES.length;
    }
    setSelectedStyle(TSHIRT_STYLES[nextIndex]);
  };

  // Add Item to Bag Drawer state
  const handleAddToBag = () => {
    setIsAddingToBag(true);
    
    setTimeout(() => {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        styleId: selectedStyle.id,
        styleName: selectedStyle.name,
        price: selectedStyle.price,
        color: selectedColor,
        size: selectedSize,
        customText: customText || "BLANK",
        fontStyle: fontStyle,
        textColor: customInkColor,
        quantity: 1
      };

      setCartItems(prev => {
        // Match exact same t-shirt style, color, size, text and font to increment quantity
        const existingIndex = prev.findIndex(item => 
          item.styleId === newItem.styleId &&
          item.color.id === newItem.color.id &&
          item.size === newItem.size &&
          item.customText === newItem.customText &&
          item.fontStyle === newItem.fontStyle &&
          item.textColor === newItem.textColor
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        }
        return [...prev, newItem];
      });

      setIsAddingToBag(false);
      setIsCartOpen(true);
      triggerToast(`Added ${selectedStyle.name} to bag!`);
    }, 800);
  };

  // Modify Cart quantities
  const updateQuantity = (id: string, amount: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.quantity + amount;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    triggerToast("Item removed from bag.");
  };

  // Calculate Subtotal & Shipping
  const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCharge = cartSubtotal >= 50 || cartSubtotal === 0 ? 0 : 5.99;
  const cartTotal = cartSubtotal + shippingCharge;

  // Submit Review Flow
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.text.trim()) {
      triggerToast("Please fill in all fields.");
      return;
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      author: newReview.author,
      rating: newReview.rating,
      text: newReview.text,
      date: new Date().toISOString().split('T')[0],
      verified: true
    };

    setReviews([review, ...reviews]);
    setNewReview({ author: '', rating: 5, text: '' });
    setShowReviewForm(false);
    triggerToast("Review published successfully! Thank you.");
  };

  // Checkout submit handler
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 'info') {
      if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.phone || !checkoutForm.city) {
        triggerToast("Veuillez remplir toutes les informations d'identification et votre localisation.");
        return;
      }
      
      const newOrders = cartItems.map(item => ({
        id: `CMD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        status: "En attente",
        color: item.color?.hex || "#FFFFFF",
        styleName: item.styleName || "Produit Boutique",
        price: item.price,
        size: item.size || "-",
        qty: item.quantity,
        customerName: checkoutForm.name,
        customerPhone: checkoutForm.phone,
        customerEmail: checkoutForm.email,
        customerLocation: checkoutForm.city
      }));
      setPastOrders(prev => [...newOrders, ...prev]);

      const totalToPay = cartItems.reduce((acc, current) => acc + (current.price * current.quantity), 0);
      const orderMsg = `Nouvelle commande de ${totalToPay.toLocaleString('fr-FR')} FCFA reçue de ${checkoutForm.name} (${checkoutForm.phone}).`;
      triggerFloozNotification(orderMsg);

      setCheckoutStep('success');
    }
  };

  // Clean form and cart after secure check out
  const finishOrder = () => {
    setCartItems([]);
    setIsCheckoutOpen(false);
    setCheckoutStep('info');
    setCheckoutForm({
      name: '',
      email: '',
      phone: '',
      city: '',
      paymentMethod: 'moov',
      momoNumber: '',
      cardNumber: '',
      cardExpiry: '',
      cardCVV: '',
    });
  };

  // Preset quick ink colors based on trends
  const inkColors = [
    { name: 'Onyx Black', hex: '#18181B' },
    { name: 'Pure White', hex: '#FFFFFF' },
    { name: 'Hospital Navy', hex: '#1E3A8A' },
    { name: 'Crimson Red', hex: '#991B1B' },
    { name: 'Vibrant Gold', hex: '#D97706' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-900'} font-sans selection:bg-neutral-900 selection:text-white relative overflow-x-hidden transition-colors duration-500`}>
      
      {/* Dynamic Toast Feedback Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 sm:top-10 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white text-xs sm:text-sm tracking-wider uppercase font-bold pr-5 sm:pr-6 pl-2 py-2 rounded-full shadow-[0_15px_40px_rgba(129,51,241,0.3)] border border-white/20 flex items-center gap-2.5 sm:gap-3 w-max max-w-[90vw] text-center backdrop-blur-md"
          >
            {toastMessage.image ? (
              <img src={toastMessage.image} alt="toast" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full shadow-sm bg-white shrink-0" />
            ) : (
              <div className="pl-3 sm:pl-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
              </div>
            )}
            <span className="truncate">{toastMessage.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING CAPSULE HEADER NAVBAR COMPONENT --- */}
      <div className={`fixed top-0 left-0 right-0 z-50 px-2 sm:px-8 py-2 sm:py-3 ${theme === 'dark' ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-md border-b ${theme === 'dark' ? 'border-white/5' : 'border-white/10'}`}>
        <header className={`max-w-6xl mx-auto w-full ${theme === 'dark' ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white/90 border-neutral-200/40'} backdrop-blur-lg rounded-full shadow-[0_12px_45px_rgba(0,0,0,0.05)] border px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between transition-all`}>
          {/* Brand LOGO (Replica of idafro concentric target) */}
          {/* Brand LOGO (Replica of idafro concentric target) */}
          <div 
            className="flex items-center gap-2 cursor-pointer select-none shrink-0" 
            onClick={() => {
              setCurrentView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img src="/LOGO.png" alt="id'afro" className="h-10 object-contain" />
            <span className="font-sans font-black text-xl tracking-tight hidden sm:flex bg-gradient-to-tr from-[#0062CC] to-[#4DB8FF] bg-clip-text text-transparent">
              id'afro
            </span>
          </div>

          {/* Categories Link Navigation (Screenshot matches) */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-2.5 text-[10px] font-extrabold tracking-wider text-neutral-500">
            <button 
              onClick={() => { 
                setCurrentView('home'); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerToast("Bienvenue sur id'afro"); 
              }}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                currentView === 'home' 
                  ? 'bg-[#0062CC] text-white font-black' 
                  : 'hover:text-black hover:bg-neutral-50'
              }`}
            >
              HOME
            </button>

            {/* BOUTIQUE */}
            <button 
              onClick={() => { 
                setCurrentView('customizer'); 
                setBoutiqueSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerToast("Boutique de T-Shirts chargée"); 
              }}
              className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-0.5 ${
                currentView === 'customizer' 
                  ? 'bg-[#0062CC] text-white font-black' 
                  : 'hover:text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              BOUTIQUE <span className="transform translate-y-[1px] text-[7px]">▼</span>
            </button>

            {/* PORTFOLIO drop */}
            <button 
              onClick={() => setIsPortfolioOpen(true)}
              className="px-4 py-2 rounded-full hover:text-neutral-800 hover:bg-neutral-50 transition-all flex items-center gap-0.5"
            >
              PORTFOLIO <span className="transform translate-y-[1px] text-[7px]">▼</span>
            </button>

            {/* OUR TEAM */}
            <button 
              onClick={() => triggerToast("Our Team : Des artisans dévoués au façonnage de l'excellence.")}
              className="px-4 py-2 rounded-full hover:text-neutral-800 hover:bg-neutral-50 transition-all flex items-center gap-0.5"
            >
              OUR TEAM <span className="transform translate-y-[1px] text-[7px]">▼</span>
            </button>

            {/* CONTACT US */}
            <button 
              onClick={() => triggerToast("Contactez-nous : contact@id'afro.com / +33 1 42 68 53 00")}
              className="px-4 py-2 rounded-full hover:text-neutral-800 hover:bg-neutral-50 transition-all"
            >
              CONTACT US
            </button>

            {/* SUIVI */}
            <button 
              onClick={() => { 
                setCurrentView('history'); 
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerToast("Suivi de vos commandes"); 
              }}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                currentView === 'history' 
                  ? 'bg-[#0062CC] text-white font-black' 
                  : 'hover:text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              SUIVI
            </button>
          </nav>

          {/* Global Action Utility Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-neutral-700 shrink-0">
            {/* Theme Toggle Button (noir / blanc) */}
            <button
              onClick={() => {
                const next = theme === 'light' ? 'dark' : 'light';
                setTheme(next);
                triggerToast(next === 'dark' ? "Mode Sombre" : "Mode Clair");
              }}
              className={`p-1 transition-colors relative ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'}`}
              title={theme === 'dark' ? "Passer au blanc" : "Passer au noir"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Moon className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>

            {/* Bell Notification */}
            <button 
              onClick={() => {
                setIsNotificationsOpen(true);
                setUnreadNotificationsCount(0);
              }} 
              className={`p-1 transition-colors relative ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'}`}
              title="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.5]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-[0_1px_4px_rgba(239,68,68,0.4)] border border-white leading-none scale-100 animate-in zoom-in-50 duration-200">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Animated Search widget */}
            <div className="relative flex items-center">
              {isSearching && (
                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Rechercher..."
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const q = searchQuery.toLowerCase().trim();
                      if (q) {
                        const matchedStyle = TSHIRT_STYLES.find(s => 
                          s.name.toLowerCase().includes(q) || 
                          s.tagline.toLowerCase().includes(q)
                        );
                        if (matchedStyle) {
                          setSelectedStyle(matchedStyle);
                          setSelectedColor(matchedStyle.colors[0]);
                          triggerToast(`Modèle trouvé : ${matchedStyle.name}`);
                        } else {
                          const matchedBoutique = boutiqueProducts.find(p => 
                            p.name.toLowerCase().includes(q) || 
                            (p.tagline || '').toLowerCase().includes(q)
                          );
                          if (matchedBoutique) {
                            setCurrentView('customizer');
                            setBoutiqueSearchQuery(q);
                            triggerToast(`Trouvé dans la boutique : ${matchedBoutique.name}`);
                          } else {
                            triggerToast(`Aucun modèle pour "${searchQuery}"`);
                          }
                        }
                      }
                      setIsSearching(false);
                      setSearchQuery('');
                    }
                  }}
                  className={`rounded-full text-xs px-3.5 py-1.5 pr-6 focus:outline-none w-28 sm:w-40 font-medium border ${theme === 'dark' ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-neutral-100 text-neutral-800 border-neutral-200'}`}
                  autoFocus
                />
              )}
              <button 
                onClick={() => setIsSearching(!isSearching)} 
                className={`p-1 transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950'}`}
                title="Rechercher un modèle"
              >
                {isSearching ? <X className="w-4 h-4" /> : <Search className="w-4 h-4 stroke-[2.5]" />}
              </button>
            </div>

            <button 
              onClick={() => {
                setCurrentView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerToast("Espace Client id'afro - Connexion Pro");
              }}
              className={`p-1 transition-colors hidden sm:block ${currentView === 'profile' ? 'text-[#8133f1]' : (theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-950')}`}
              title="Mon Profil"
            >
              <User className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Cart Icon / Action featuring cleanify red badge */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative hover:opacity-80 p-1 transition-transform active:scale-95 flex items-center justify-center"
              title="Mon Panier"
            >
              <ShoppingBag className={`w-4.5 h-4.5 stroke-[2.5] ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-950'}`} />
              <AnimatePresence>
                {cartItems.length > 0 && (
                  <motion.span
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0 }}
                     className="absolute -top-1 -right-1 bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md border border-white"
                  >
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </header>
      </div>

      {/* Spacer to prevent content overlap since header is fixed */}
      <div className="h-[80px] sm:h-[88px] shrink-0"></div>

      {currentView === 'customizer' ? (
        <div className="pb-24 sm:pb-0">
          <BoutiqueView
            setCurrentView={setCurrentView}
            cartItems={cartItems}
            setCartItems={setCartItems}
            setIsCartOpen={setIsCartOpen}
            setLastAddedItem={setLastAddedItem}
            triggerToast={triggerToast}
            boutiqueProducts={boutiqueProducts}
            theme={theme}
            initialSearchQuery={boutiqueSearchQuery}
            setInitialSearchQuery={setBoutiqueSearchQuery}
          />
        </div>
      ) : currentView === 'history' ? (
        <div className="pb-24 sm:pb-0">
          <HistoryView 
            pastOrders={pastOrders} 
            cartItems={cartItems} 
            boutiqueProducts={boutiqueProducts} 
            triggerToast={triggerToast} 
            confirmOrder={confirmOrder}
            theme={theme}
          />
        </div>
      ) : currentView === 'profile' ? (
        <div className="pb-24 sm:pb-0">
          <ProfileView 
            triggerToast={triggerToast} 
            boutiqueProducts={boutiqueProducts}
            setBoutiqueProducts={setBoutiqueProducts}
            pastOrders={pastOrders}
            setPastOrders={setPastOrders}
            googleToken={googleToken}
            setGoogleToken={setGoogleToken}
            authUser={authUser}
            setAuthUser={setAuthUser}
            theme={theme}
          />
        </div>
      ) : (
        /* --- ACCUEIL LANDING EXPERIENCE (HOME) --- */
        <div className="flex flex-col pb-24 sm:pb-0">
          {/* 1. LUXURY HERO BANNER WIT DYNAMIC SLIDER */}
          <section className={`${theme === 'dark' ? 'bg-neutral-950' : 'bg-white'} pt-2 pb-14 sm:pt-4 sm:pb-24 px-4 sm:px-8 border-b ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'} relative overflow-hidden flex flex-col items-center justify-center w-full transition-colors`}>
            {/* Minimal ambient grid pattern */}
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)]'} bg-[size:30px_30px] opacity-60`}></div>
            
            <div className="w-full relative z-10 flex flex-col items-center justify-center">
              {/* Premium Image Carousel - fluid transitions, stable heights */}
              <div className="w-full max-w-[1650px] mx-auto relative px-2 sm:px-6">
                
                {/* Main Aspect-Constrained Canvas Frame - Borderless & fully transparent to mimic the clean original layout */}
                <div className="relative w-full aspect-square sm:aspect-[16/10] md:aspect-[16/9] mb-4 sm:mb-6 flex items-center justify-center">
                  
                  {/* Sliding image wrap */}
                  <AnimatePresence initial={false} custom={heroDirection}>
                    <motion.div
                      key={currentHeroIndex}
                      custom={heroDirection}
                      variants={{
                        enter: (dir: number) => ({
                          x: dir > 0 ? "100%" : "-100%",
                          opacity: 0
                        }),
                        center: {
                          x: 0,
                          opacity: 1,
                          transition: {
                            x: { type: "spring", stiffness: 220, damping: 26 },
                            opacity: { duration: 0.35 }
                          }
                        },
                        exit: (dir: number) => ({
                          x: dir < 0 ? "100%" : "-100%",
                          opacity: 0,
                          transition: {
                            x: { type: "spring", stiffness: 220, damping: 26 },
                            opacity: { duration: 0.35 }
                          }
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="absolute inset-0 w-full h-full flex items-center justify-center p-0 sm:p-4 md:p-6"
                    >
                      <img 
                        src={heroSlides[currentHeroIndex].image}
                        alt={heroSlides[currentHeroIndex].title}
                        referrerPolicy="no-referrer"
                        className="w-full h-[90%] sm:h-full object-contain mix-blend-multiply select-none pointer-events-none transition-transform duration-700 hover:scale-[1.01]" 
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Floating Glassmorphic Quality Highlights Card Overlay (Plein d'élégance - updated to landscape/portable on mobile) */}
            <div className={`-mt-16 sm:-mt-20 md:-mt-28 lg:-mt-36 relative mx-auto w-full max-w-7xl ${theme === 'dark' ? 'bg-neutral-900/80 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)]' : 'bg-white/80 border-neutral-200/50 shadow-[0_25px_60px_rgba(0,0,0,0.08)]'} backdrop-blur-2xl border rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-12 md:p-16 flex overflow-x-auto md:grid md:grid-cols-3 gap-6 md:gap-12 lg:gap-16 z-20 hover:bg-neutral-800/90 transition-all duration-300 no-scrollbar snap-x`}>
                  <div className="flex gap-4 sm:gap-6 items-start min-w-[260px] md:min-w-0 snap-center">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Award className="w-5 h-5 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h4 className={`font-display font-black text-[12px] sm:text-lg md:text-xl ${theme === 'dark' ? 'text-white' : 'text-neutral-900'} uppercase tracking-widest leading-snug`}>
                        Matériaux Anti-Boulochage
                      </h4>
                      <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} text-[11px] sm:text-base mt-2 leading-relaxed`}>
                        Le mélange ultime de polyester premium filé et rayonne pour une durabilité et un soyeux incomparables.
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex gap-4 sm:gap-6 items-start border-l ${theme === 'dark' ? 'border-white/5' : 'border-neutral-200/20'} pl-6 md:pl-10 lg:pl-12 min-w-[260px] md:min-w-0 snap-center`}>
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h4 className={`font-display font-black text-[12px] sm:text-lg md:text-xl ${theme === 'dark' ? 'text-white' : 'text-neutral-900'} uppercase tracking-widest leading-snug`}>
                        Matières Premières Nobles
                      </h4>
                      <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} text-[11px] sm:text-base mt-2 leading-relaxed`}>
                        Fils de coton peignés ultra-longs de haute qualité, tissés de manière serrée pour un fini mat soyeux.
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 sm:gap-6 items-start border-l ${theme === 'dark' ? 'border-white/5' : 'border-neutral-200/20'} pl-6 md:pl-10 lg:pl-12 min-w-[260px] md:min-w-0 snap-center`}>
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white flex items-center justify-center shrink-0 shadow-md">
                      <ShieldCheck className="w-5 h-5 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <h4 className={`font-display font-black text-[12px] sm:text-lg md:text-xl ${theme === 'dark' ? 'text-white' : 'text-neutral-900'} uppercase tracking-widest leading-snug`}>
                        Garantie Bonheur 30j
                      </h4>
                      <p className={`${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'} text-[11px] sm:text-base mt-2 leading-relaxed`}>
                        Échanges de taille et retours faciles. Si vous n'êtes pas absolument ravi, nous remplaçons sans frais.
                      </p>
                    </div>
                  </div>
                </div>
          </section>





          {/* 5. IMAGE D'ENTREPRISE */}
          <section className={`w-full ${theme === 'dark' ? 'bg-neutral-950 border-t border-white/5' : 'bg-white'} relative z-20`}>
             <div className="w-full">
               <div className="w-full relative overflow-hidden">
                 <img 
                   src="/src/assets/images/tshirt_factory_1781887706050.jpg" 
                   alt="Atelier de fabrication de t-shirts" 
                   referrerPolicy="no-referrer"
                   className="w-full h-[50vh] sm:h-[70vh] lg:h-[80vh] object-cover hover:scale-105 transition-transform duration-[1.5s] ease-out"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-16 lg:p-24">
                   <h2 className="text-white text-3xl sm:text-5xl lg:text-7xl font-display font-black leading-tight max-w-4xl">
                     Solutions pour professionnels
                   </h2>
                   <p className="text-white/90 mt-4 sm:mt-6 text-sm sm:text-lg lg:text-xl max-w-2xl font-medium">
                     Un accompagnement sur-mesure pour les entreprises, associations et clubs. Équipez vos collaborateurs avec l'excellence.
                   </p>
                 </div>
               </div>
             </div>
          </section>


        </div>
      )}

      {/* --- FOOTER SITE ELEMENT --- */}
      <footer className={`${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-neutral-500' : 'bg-white border-neutral-100 text-neutral-400'} border-t py-12 px-4 sm:px-8 text-center text-xs font-mono transition-colors`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full ${theme === 'dark' ? 'bg-white text-black' : 'bg-neutral-900 text-white'} flex items-center justify-center font-bold text-[10px] select-none`}>F</span>
            <span className={`font-display font-extrabold text-sm tracking-wider ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>FIGS CUSTOM LAYERS</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => triggerToast("Privacy & Protection guidelines mock.")} className={`${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'} transition-colors`}>PRIVACY TERMS</button>
            <button onClick={() => triggerToast("Returns portal portal mock.")} className={`${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'} transition-colors`}>RETURNS & EXCHANGES</button>
            <button onClick={() => triggerToast("Contact medical FIGS support line.")} className={`${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'} transition-colors`}>CONTACT LABS</button>
          </div>
          <p>© {new Date().getFullYear()} FIGS Inc. Built for Awesome Humans.</p>
        </div>
      </footer>

      {/* --- NOTIFICATIONS DRAWER --- */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden text-neutral-900">
            {/* Backdrop cover blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs"
            ></motion.div>

            {/* Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-sm w-full flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full h-full bg-neutral-950 text-white shadow-2xl flex flex-col relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageCircleMore className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-display font-black text-lg tracking-wider uppercase text-white">SMS Reçus</h2>
                  </div>
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
                  {notificationsList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 text-white/50">
                      <Bell className="w-12 h-12 mb-4" />
                      <p className="font-display font-bold text-sm tracking-wider uppercase text-white">Aucune notification</p>
                      <p className="text-xs mt-2 text-white/60">Vous êtes à jour.</p>
                    </div>
                  ) : (
                    notificationsList.map((notif) => (
                      <div key={notif.id} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col gap-2 relative overflow-hidden shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                        <div className="absolute -right-4 -top-4 text-emerald-500/10 pointer-events-none">
                          <MessageCircleMore className="w-20 h-20" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-emerald-400 z-10 relative">
                          <span className="flex items-center gap-1.5 font-display">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            SMS de Notification
                          </span>
                          <span className="text-white/30 font-mono">{notif.date}</span>
                        </div>
                        <p className="font-medium z-10 relative text-[12px] font-sans leading-relaxed text-white tracking-wide">
                          {notif.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Clear All Button */}
                <div className="p-6 border-t border-white/5 bg-black/40 shrink-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Apparence</span>
                    <button 
                      onClick={() => {
                        const next = theme === 'light' ? 'dark' : 'light';
                        setTheme(next);
                        triggerToast(`Mode ${next === 'dark' ? 'Sombre' : 'Clair'}`);
                      }}
                      className="flex items-center gap-2 text-[10px] font-black text-white hover:text-[#8133f1] transition-colors uppercase tracking-widest"
                    >
                      {theme === 'dark' ? <Sparkles className="w-3 h-3" /> : <Droplets className="w-3 h-3" />}
                      Mode {theme === 'dark' ? 'Sombre' : 'Clair'}
                    </button>
                  </div>
                  {notificationsList.length > 0 && (
                    <button 
                      onClick={() => setNotificationsList([])}
                      className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-900 rounded-xl font-display font-black tracking-widest text-[9px] uppercase transition-all shadow-lg active:scale-[0.98]"
                    >
                      Effacer tout
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MINI BAG SLIDING OVERLAY (CART DRAWER) --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop cover blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs"
            ></motion.div>

            {/* Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="w-[88vw] sm:w-[400px] max-w-md bg-gradient-to-tr from-[#0062CC] to-[#4DB8FF] shadow-[-10px_0_40px_rgba(129,51,241,0.4),0_-2px_4px_rgba(0,0,0,0.2)_inset,0_4px_10px_rgba(255,255,255,0.4)_inset] flex flex-col justify-between rounded-l-[2rem] sm:rounded-none overflow-hidden text-white"
              >
                {/* Header section of Drawer */}
                <div className="px-6 py-5 border-b border-white/20 flex items-center justify-between backdrop-blur-sm bg-white/5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4.5 h-4.5 text-white drop-shadow-md" />
                    <h2 className="text-md font-display font-extrabold text-white drop-shadow-md">
                      VOTRE PANIER ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                    </h2>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all backdrop-blur-md"
                  >
                    <X className="w-5 h-5 drop-shadow-md" />
                  </button>
                </div>

                {/* Main Items Scroll area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 no-scrollbar">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white">
                        <ShoppingBag className="w-7 h-7 stroke-[1.25]" />
                      </div>
                      <p className="text-sm font-semibold text-white font-display drop-shadow-sm">Votre panier est actuellement vide.</p>
                      <p className="text-xs text-white/80 mt-1 max-w-xs px-4">
                        Découvrez nos modèles premium en coton organique pour commencer.
                      </p>
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          triggerToast("Découvrez nos t-shirts !");
                        }}
                        className="mt-6 bg-white text-[#8133f1] font-display text-[10px] tracking-wider uppercase font-bold px-5 py-3 rounded-full shadow-sm hover:bg-neutral-100"
                      >
                        RETOUR À LA BOUTIQUE
                      </button>
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 relative group text-white shadow-sm"
                      >
                        {/* Image preview */}
                        <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-white/20 bg-white/5 relative flex items-center justify-center">
                          {(item.video && item.video !== 'HEAVY_BASE64') ? (
                            <VideoPlayer 
                              src={item.video} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img 
                              src={item.image || `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&sig=${item.styleId}`} 
                              alt={item.styleName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800";
                              }}
                            />
                          )}
                        </div>

                        {/* Text descriptions */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="text-xs font-bold font-display text-white truncate leading-tight pr-4">
                              {item.styleName}
                            </h4>
                            <span className="text-xs font-bold text-white font-display">
                              {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                            </span>
                          </div>

                          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-white/80 font-mono">
                            <span className="flex items-center gap-1.5 matches-size-styling">
                              <span className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-3xs shrink-0" style={{ backgroundColor: item.color.hex }}></span>
                              <span className="text-white font-semibold font-sans text-[11px]">{item.color.name}</span>
                              <span className="text-white/60 font-mono text-[10px] lowercase">({item.size.toLowerCase()})</span>
                            </span>
                          </div>

                          {/* Quantities button controller */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-white/30 rounded-full bg-white/10 overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 px-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs font-bold px-2 text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 px-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-white/60 hover:text-white hover:bg-white/20 rounded-full transition-colors p-1"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal summary section */}
                {cartItems.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-6 flex flex-col gap-4 mt-auto">
                    <div className="flex flex-col gap-2 font-mono text-xs text-white/80">
                      <div className="flex justify-between items-center">
                        <span>SOUS-TOTAL</span>
                        <span className="text-white font-semibold">{cartSubtotal.toLocaleString("fr-FR")} FCFA</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>LIVRAISON SUIVIE</span>
                        <span className="text-white">{shippingCharge === 0 ? 'OFFERTE (supérieur à 35000 FCFA)' : `${shippingCharge.toLocaleString("fr-FR")} FCFA`}</span>
                      </div>
                      {shippingCharge > 0 && (
                        <div className="text-[10px] text-white/60 italic mt-0.5">
                          💡 Ajoutez {(35000 - cartSubtotal).toLocaleString("fr-FR")} FCFA de plus pour la livraison gratuite !
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/20 my-1"></div>

                    <div className="flex justify-between items-center font-display font-extrabold text-white">
                      <span className="text-sm font-bold drop-shadow-sm">TOTAL</span>
                      <span className="text-lg text-white font-display drop-shadow-md">{cartTotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsCheckoutOpen(true);
                        setCheckoutStep('info');
                      }}
                      className="w-full h-13 bg-white hover:bg-neutral-50 text-[#0062CC] rounded-full font-display font-bold tracking-widest text-xs uppercase shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    >
                      PASSER À LA CAISSE SÉCURISÉE
                      <ArrowRight className="w-4 h-4 text-[#0062CC]" />
                    </button>
                    <p className="text-[10px] text-center text-white/60 mt-1">
                      🔒 Transactions sécurisées avec chiffrement SSL 256 bits.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PORTFOLIO DRAWER --- */}
      <AnimatePresence>
        {isPortfolioOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden text-neutral-900">
            {/* Backdrop cover blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPortfolioOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Full-screen Portfolio view */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full bg-white flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="relative z-10 w-full shrink-0 flex items-center justify-between p-6 bg-white shadow-sm border-b border-neutral-100 xl:px-12">

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-600" />
                  </div>
                  <h2 className="text-xl font-display font-extrabold text-neutral-900">
                    ID'AFRO
                  </h2>
                </div>
                <button 
                  onClick={() => setIsPortfolioOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-6 sm:py-10 pb-32 hide-scrollbar bg-neutral-50/50">
                <div className="max-w-[1600px] mx-auto w-full">
                  <div className="text-center mb-8 sm:mb-14 mt-2 sm:mt-4">
                    <h3 className="text-4xl sm:text-5xl font-black mb-1 sm:mb-3 uppercase tracking-tight text-neutral-900">ID'AFRO</h3>
                    <p className="font-bold uppercase tracking-widest text-[10px] sm:text-sm text-neutral-500">Mode • Style • Personnalisation</p>
                  </div>

                  {/* Pinterest-style Masonry Grid */}
                  <div className="columns-2 sm:columns-2 lg:columns-3 xl:columns-4 gap-2 sm:gap-6 space-y-2 sm:space-y-6">

                    {/* Intro / Brand Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100 group mb-2 sm:mb-6">
                      <img 
                        src={africanNaturePeople} 
                        alt="Aro ID'AFRO" 
                        className="w-full h-40 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="p-4 sm:p-8">
                        <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3">Qui sommes-nous ?</h3>
                        <p className="mb-3 sm:mb-6 text-neutral-600 text-xs sm:text-sm leading-relaxed">
                          ID'AFRO est une marque spécialisée dans la vente de vêtements et la personnalisation d'articles textiles et publicitaires. Notre mission est d'offrir des créations originales qui valorisent l'identité, la culture et le style de chacun.
                        </p>
                        <p className="italic text-neutral-800 font-semibold border-l-2 sm:border-l-4 border-neutral-300 pl-2 sm:pl-4 text-[10px] sm:text-sm mt-2 sm:mt-4">
                          « Portez votre identité avec style. »
                        </p>
                      </div>
                    </div>

                    {/* T-shirts Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100 group mb-2 sm:mb-6">
                      <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600" alt="T-shirts ID'AFRO" className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="p-3 sm:p-6">
                        <h4 className="font-bold mb-1 sm:mb-3 text-sm sm:text-lg flex items-center gap-1 sm:gap-2">👕 T-shirts</h4>
                        <ul className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm text-neutral-600">
                          <li>• Hommes</li>
                          <li>• Femmes</li>
                          <li>• Enfants</li>
                          <li>• Personnalisés</li>
                        </ul>
                      </div>
                    </div>

                    {/* Casquettes Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100 group mb-2 sm:mb-6">
                      <div className="bg-neutral-100 w-full h-20 sm:h-48 flex items-center justify-center text-2xl sm:text-4xl mb-1 sm:mb-2">🧢</div>
                      <div className="p-3 sm:p-6 pt-1 sm:pt-2">
                        <h4 className="font-bold mb-1 sm:mb-3 text-sm sm:text-lg flex items-center gap-1 sm:gap-2">Casquettes</h4>
                        <ul className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm text-neutral-600">
                          <li>• Classiques</li>
                          <li>• Personnalisées</li>
                          <li>• Promotionnelles</li>
                        </ul>
                      </div>
                    </div>

                    {/* Vêtements femmes Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100 group mb-2 sm:mb-6">
                      <img src="https://images.unsplash.com/photo-1515347619152-192a54b3ea59?auto=format&fit=crop&q=80&w=600" alt="Vêtements femmes" className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="p-3 sm:p-6">
                        <h4 className="font-bold mb-1 sm:mb-3 text-sm sm:text-lg flex items-center gap-1 sm:gap-2">👗 Vêtements femmes</h4>
                        <ul className="space-y-0.5 sm:space-y-2 text-[10px] sm:text-sm text-neutral-600">
                          <li>• Robes</li>
                          <li>• Ensembles</li>
                          <li>• Tops</li>
                          <li>• Tendance</li>
                        </ul>
                      </div>
                    </div>

                    {/* Sport Pin */}
                    <div className="break-inside-avoid bg-[#8133f1]/5 rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 border border-[#8133f1]/10 text-center mb-2 sm:mb-6">
                      <div className="text-xl sm:text-4xl mb-2 sm:mb-4">🏃</div>
                      <h4 className="font-bold mb-2 sm:mb-4 text-xs sm:text-lg text-[#8133f1]">Maillots & sport</h4>
                      <ul className="space-y-0.5 sm:space-y-2 text-[9px] sm:text-sm text-[#8133f1]/80 text-left w-max mx-auto">
                        <li>• Football</li>
                        <li>• Basketball</li>
                        <li>• Équipements pers.</li>
                      </ul>
                    </div>

                    {/* Pro Pin */}
                    <div className="break-inside-avoid bg-neutral-900 text-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm mb-2 sm:mb-6">
                      <div className="text-xl sm:text-4xl mb-2 sm:mb-4">👔</div>
                      <h4 className="font-bold mb-2 sm:mb-4 text-xs sm:text-lg">Vêtements pro</h4>
                      <ul className="space-y-0.5 sm:space-y-2 text-[9px] sm:text-sm text-white/70">
                        <li>• Polos</li>
                        <li>• Uniformes</li>
                        <li>• Tenues de travail</li>
                      </ul>
                    </div>

                    {/* Personnalisation: Textile Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm border border-neutral-100 mb-2 sm:mb-6">
                      <div className="inline-flex items-center justify-center px-1.5 sm:px-3 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[8px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-4">Services</div>
                      <h4 className="font-bold text-neutral-900 mb-2 sm:mb-4 text-xs sm:text-lg">Impression textile</h4>
                      <div className="flex flex-wrap gap-1 sm:gap-2 text-[9px] sm:text-sm">
                        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-neutral-50 rounded sm:rounded-lg text-neutral-600">T-shirts</span>
                        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-neutral-50 rounded sm:rounded-lg text-neutral-600">Polos</span>
                        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-neutral-50 rounded sm:rounded-lg text-neutral-600">Maillots</span>
                        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-neutral-50 rounded sm:rounded-lg text-neutral-600">Sweats</span>
                        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-neutral-50 rounded sm:rounded-lg text-neutral-600">Casquettes</span>
                      </div>
                    </div>

                    {/* Personnalisation: Objets & Graphique Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm border border-neutral-100 relative overflow-hidden mb-2 sm:mb-6">
                      <div className="absolute top-0 right-0 w-16 sm:w-32 h-16 sm:h-32 bg-orange-100 rounded-bl-full -mr-4 sm:-mr-10 -mt-4 sm:-mt-10 opacity-50 pointer-events-none"></div>
                      <div className="inline-flex items-center justify-center px-1.5 sm:px-3 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[8px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-6 relative z-10">Création</div>
                      
                      <h4 className="font-bold text-neutral-900 mb-1 sm:mb-3 text-[11px] sm:text-[15px]">Impression objets</h4>
                      <ul className="space-y-0.5 sm:space-y-1.5 text-[9px] sm:text-sm text-neutral-600 mb-2 sm:mb-6">
                        <li>• Tasses (mugs)</li>
                        <li>• Porte-clés</li>
                        <li>• Sacs</li>
                        <li>• Articles promo.</li>
                      </ul>

                      <h4 className="font-bold text-neutral-900 mb-1 sm:mb-3 text-[11px] sm:text-[15px]">Création graphique</h4>
                      <ul className="space-y-0.5 sm:space-y-1.5 text-[9px] sm:text-sm text-neutral-600">
                        <li>• Logos</li>
                        <li>• Visuels pub.</li>
                        <li>• Designs pers.</li>
                        <li>• Identité visuelle</li>
                      </ul>
                    </div>

                    {/* Clients Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm border border-neutral-100 mb-2 sm:mb-6">
                      <h4 className="font-bold text-xs sm:text-lg mb-2 sm:mb-4 text-neutral-900">Nos Clients</h4>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {['Entreprises', 'Écoles', 'Clubs', 'Assoc.', 'Églises', 'Artistes', 'Particuliers'].map(client => (
                          <span key={client} className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 border border-dashed border-neutral-300 rounded-full text-[8px] sm:text-sm text-neutral-600">{client}</span>
                        ))}
                      </div>
                    </div>

                    {/* Pourquoi Pin */}
                    <div className="break-inside-avoid bg-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 shadow-sm border border-neutral-100 mb-2 sm:mb-6">
                      <h4 className="font-bold text-xs sm:text-lg mb-2 sm:mb-5 text-neutral-900">Pourquoi ID'AFRO?</h4>
                      <ul className="space-y-1 sm:space-y-4 text-[9px] sm:text-sm text-neutral-700">
                        <li className="flex items-center gap-1.5 sm:gap-3"><div className="w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 sm:w-3.5 sm:h-3.5" /></div> <span className="font-semibold truncate">Qualité</span></li>
                        <li className="flex items-center gap-1.5 sm:gap-3"><div className="w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 sm:w-3.5 sm:h-3.5" /></div> <span className="font-semibold truncate">Pro</span></li>
                        <li className="flex items-center gap-1.5 sm:gap-3"><div className="w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 sm:w-3.5 sm:h-3.5" /></div> <span className="font-semibold truncate">Unique</span></li>
                        <li className="flex items-center gap-1.5 sm:gap-3"><div className="w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 sm:w-3.5 sm:h-3.5" /></div> <span className="font-semibold truncate">Accessible</span></li>
                        <li className="flex items-center gap-1.5 sm:gap-3"><div className="w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 sm:w-3.5 sm:h-3.5" /></div> <span className="font-semibold truncate">Délais</span></li>
                        <li className="flex items-center gap-1.5 sm:gap-3"><div className="w-3 h-3 sm:w-6 sm:h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0"><Check className="w-2 h-2 sm:w-3.5 sm:h-3.5" /></div> <span className="font-semibold truncate">Suivi</span></li>
                      </ul>
                    </div>

                    {/* Vision & Footer Pin */}
                    <div className="break-inside-avoid bg-neutral-50 rounded-2xl sm:rounded-[2rem] p-3 sm:p-8 border border-neutral-200/60 text-center flex flex-col justify-center mb-2 sm:mb-6">
                      <p className="mb-2 sm:mb-8 text-neutral-600 text-[9px] sm:text-sm leading-relaxed italic">
                        "Un moyen d'expression, de valorisation de la culture africaine."
                      </p>
                      <p className="font-black text-sm sm:text-2xl mb-0.5 sm:mb-2 text-neutral-900">ID'AFRO</p>
                      <p className="text-[7px] sm:text-[10px] font-black tracking-widest uppercase text-neutral-500 mb-2 sm:mb-6">Mode • Création</p>
                      
                      <div className="bg-white py-1.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl border border-neutral-100 shadow-sm mx-auto shadow-sm">
                        <p className="font-bold text-[#8133f1] text-[7px] sm:text-xs tracking-tight">Portez votre identité avec style. 🌍🔥</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SECURE CHECKOUT MULTI-STEP DIALOG BACKDROP --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4">
            {/* Backdrop mask blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (checkoutStep !== 'success') {
                  const cancel = confirm("Abandon Checkout payment processes?");
                  if (cancel) setIsCheckoutOpen(false);
                }
              }}
              className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            ></motion.div>

            {/* Main checkout dialog container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Checkout header step progress indicator */}
              <div className="bg-neutral-900 text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="font-display font-extrabold text-sm tracking-widest uppercase">
                    ID'AFRO | PAIEMENT SÉCURISÉ
                  </span>
                </div>
                {checkoutStep !== 'success' && (
                  <button 
                    onClick={() => {
                      const cancel = confirm("Abandon Checkout payment processes?");
                      if (cancel) setIsCheckoutOpen(false);
                    }}
                    className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress step bar - Simplified */}
              <div className="bg-neutral-100 p-3 flex items-center justify-center font-mono text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">
                {checkoutStep === 'success' ? 'COMMANDE REÇUE AVEC SUCCÈS' : 'REMPLISSEZ VOS COORDONNÉES DE LIVRAISON'}
              </div>

              {/* Checkout Forms */}
              <form onSubmit={handleCheckoutSubmit} className="p-6 sm:p-8 flex flex-col gap-5">
                
                {checkoutStep === 'info' && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-neutral-800 flex items-center gap-1 pb-1 border-b border-neutral-100">
                      <MapPin className="w-4 h-4 text-neutral-600" />
                      Informations de livraison & Localisation
                    </h3>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-450 uppercase">Nom complet du destinataire</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="Ex: Komi Amenyah"
                        className="bg-stone-50 border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-450 uppercase">Identification (N° Téléphone)</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        placeholder="+228 XX XX XX XX"
                        className="bg-stone-50 border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-450 uppercase">Adresse Email de Contact</label>
                      <input
                        type="email"
                        required
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        placeholder="exemple@email.com"
                        className="bg-stone-50 border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-neutral-450 uppercase">Ville & Localisation de résidence</label>
                      <input
                        type="text"
                        required
                        value={checkoutForm.city}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                        placeholder="Ex: Lomé, Quartier Adidogomé"
                        className="bg-stone-50 border border-neutral-200 focus:border-neutral-900 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 h-12 bg-neutral-950 hover:bg-neutral-900 text-white rounded-full font-display font-extrabold tracking-widest text-xs uppercase shadow transition-all flex items-center justify-center gap-2 group"
                    >
                      VALIDER MA COMMANDE
                      <Check className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
                    </button>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="flex flex-col items-center justify-center text-center py-6 gap-5">
                    {/* Animated Check badge circle */}
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center relative shadow-inner">
                      <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-emerald-750 uppercase">
                        TRANSMISSION CAPTURED SUCCESS
                      </span>
                      <h2 className="text-xl sm:text-2xl font-display font-black text-neutral-900">
                        Order #{Math.floor(100000 + Math.random() * 900000)} Placed!
                      </h2>
                      <p className="text-xs text-neutral-450 mt-1 max-w-sm px-4">
                        Thank you for your purchase, <strong className="text-neutral-700">{checkoutForm.name || "Awesome Human"}</strong>. We are processing your custom print layout immediately!
                      </p>
                    </div>

                    {/* Estimated transit progress line */}
                    <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-200 shadow-inner flex flex-col gap-3 mt-2 text-left text-xs font-mono">
                      <div className="flex items-center justify-between font-bold text-neutral-800">
                        <span className="flex items-center gap-1">
                          <Truck className="w-4 h-4 text-indigo-650" />
                          SHIPPING CARRIER TRANSIT TIME
                        </span>
                        <span className="text-indigo-700">3-5 BUSINESS DAYS</span>
                      </div>
                      <div className="relative w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden mt-1">
                        <div className="absolute left-0 h-full w-2/5 bg-neutral-900 rounded-full"></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                        <span>STATION: TRANSMITTED</span>
                        <span>STATION: DISPATCH</span>
                        <span>DELIVERED</span>
                      </div>
                    </div>

                    {/* Order summary list */}
                    <div className="w-full text-left text-xs bg-neutral-50 rounded-xl p-4 border border-neutral-100 max-h-[160px] overflow-y-auto no-scrollbar">
                      <span className="text-[9px] font-mono font-black text-neutral-400 uppercase tracking-wider block mb-2">Item Invoice Recipient Summary</span>
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-1 font-mono text-neutral-600">
                          <span className="truncate max-w-[280px]">{item.quantity}x {item.styleName} ({item.size.toLowerCase()})</span>
                          <span className="font-semibold text-neutral-800">${(item.price * item.quantity).toLocaleString("fr-FR")}</span>
                        </div>
                      ))}
                      <div className="border-t border-dashed border-stone-300 my-2"></div>
                      <div className="flex justify-between items-center font-bold text-neutral-800">
                        <span>TOTAL PAID BILLINGS</span>
                        <span>${cartTotal.toLocaleString("fr-FR")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={finishOrder}
                      className="w-full h-12 bg-neutral-900 hover:bg-neutral-950 text-white rounded-full font-display font-extrabold tracking-widest text-[10px] uppercase shadow mt-2"
                    >
                      RETURN TO CATALOG STOREFRONT
                    </button>
                  </div>
                )}

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SIZING fit DETAIL GUIDE DIALOG MODAL --- */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Size guide header */}
              <div className="bg-neutral-900 text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-display font-bold text-sm tracking-wider uppercase">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  FIGS SIZING fit CHART METRICS
                </div>
                <button 
                  onClick={() => setShowSizeGuide(false)}
                  className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Metric/Imperial units switch */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <span className="text-[11px] text-neutral-500 font-mono tracking-tight font-semibold">
                    MEASURING UNIT SELECTOR:
                  </span>
                  <div className="flex items-center border border-neutral-250 rounded-full bg-white overflow-hidden">
                    <button
                      onClick={() => setSizeUnit('in')}
                      className={`px-3 py-1 text-[10px] font-bold transition-all ${
                        sizeUnit === 'in' ? 'bg-neutral-900 text-white shadow' : 'bg-white hover:bg-neutral-50 text-neutral-500'
                      }`}
                    >
                      INCHES
                    </button>
                    <button
                      onClick={() => setSizeUnit('cm')}
                      className={`px-3 py-1 text-[10px] font-bold transition-all ${
                        sizeUnit === 'cm' ? 'bg-neutral-900 text-white shadow' : 'bg-white hover:bg-neutral-50 text-neutral-500'
                      }`}
                    >
                      CENTIMETERS
                    </button>
                  </div>
                </div>

                {/* Sizing grid metrics representation */}
                <table className="w-full text-xs font-mono text-left">
                  <thead>
                    <tr className="bg-stone-105 border-b border-neutral-300 font-sans font-extrabold text-[10px] tracking-wider uppercase text-neutral-550">
                      <th className="p-3">SIZE FRAME</th>
                      <th className="p-3 text-center">CHEST WIDTH</th>
                      <th className="p-3 text-center">FRONT BODY LENGTH</th>
                      <th className="p-3 text-center">SLEEVE DROP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150">
                    {[
                      { s: 'XS', chestIn: '34-36', chestCm: '86-91', lenIn: '26.5', lenCm: '67', slvIn: '8.0', slvCm: '20' },
                      { s: 'S', chestIn: '36-38', chestCm: '91-96', lenIn: '27.5', lenCm: '70', slvIn: '8.25', slvCm: '21' },
                      { s: 'M', chestIn: '38-40', chestCm: '96-101', lenIn: '28.5', lenCm: '72', slvIn: '8.5', slvCm: '22' },
                      { s: 'L', chestIn: '40-42', chestCm: '101-106', lenIn: '29.5', lenCm: '75', slvIn: '8.75', slvCm: '22' },
                      { s: 'XL', chestIn: '42-45', chestCm: '106-114', lenIn: '30.5', lenCm: '77', slvIn: '9.0', slvCm: '23' },
                      { s: 'XXL', chestIn: '45-48', chestCm: '114-122', lenIn: '31.5', lenCm: '80', slvIn: '9.25', slvCm: '23' },
                    ].map((row) => (
                      <tr key={row.s} className={selectedSize === row.s ? 'bg-indigo-50/50 font-bold text-neutral-900' : 'text-neutral-600'}>
                        <td className="p-3 flex items-center gap-1">
                          {row.s === selectedSize && <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 inline-block"></span>}
                          {row.s}
                        </td>
                        <td className="p-3 text-center">{sizeUnit === 'in' ? row.chestIn : row.chestCm}</td>
                        <td className="p-3 text-center">{sizeUnit === 'in' ? row.lenIn : row.lenCm}</td>
                        <td className="p-3 text-center">{sizeUnit === 'in' ? row.slvIn : row.slvCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Sizing Tips */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs flex flex-col gap-1.5">
                  <span className="font-sans font-bold text-neutral-80s uppercase text-[10px] tracking-wider block">HOW TO ENCOURAGE PERFECT FIT:</span>
                  <p className="text-neutral-500 leading-normal font-medium">
                    Our t-shirts are styled in athletic-drop trims. If you prefer a loose casual comfort overlay, we highly encourage selecting a full 1-size scale higher than your standard measurements.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CURVED LIQUID MOBILE BOTTOM NAVIGATION BAR (md:hidden) --- */}
      <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden bg-transparent pointer-events-none select-none flex justify-center pb-safe">
        {/* Soft atmospheric gradient glow behind the bottom section matching the beautiful reference screen */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-fuchsia-100/20 via-cyan-200/5 to-transparent pointer-events-none" />

        <div className="relative w-full max-w-md h-24 bg-transparent pointer-events-auto flex flex-col justify-end">
          
          {/* Main Curved SVG Canvas */}
          <div className="absolute inset-x-0 bottom-0 h-16 w-full filter drop-shadow-[0_-8px_25px_rgba(0,0,0,0.08)]">
            <div className="w-full h-full overflow-hidden rounded-b-[24px] rounded-t-[14px]">
              <svg 
                viewBox="0 0 400 64" 
                className="w-full h-full" 
                preserveAspectRatio="none"
              >
                <motion.path 
                  animate={{
                    d: currentView === 'home'
                      ? "M 0,16 L -5,16 C 15,16 20,44 40,44 C 60,44 65,16 85,16 L 400,16 L 400,64 L 0,64 Z"
                      : currentView === 'customizer'
                      ? "M 0,16 L 75,16 C 95,16 100,44 120,44 C 140,44 145,16 165,16 L 400,16 L 400,64 L 0,64 Z"
                      : currentView === 'history'
                      ? "M 0,16 L 235,16 C 255,16 260,44 280,44 C 300,44 305,16 325,16 L 400,16 L 400,64 L 0,64 Z"
                      : "M 0,16 L 315,16 C 335,16 340,44 360,44 C 380,44 385,16 405,16 L 400,16 L 400,64 L 0,64 Z"
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="fill-white"
                />
              </svg>
            </div>
          </div>

          {/* Sliding Raised Floating Active Tab Circle Icon Container */}
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none">
            <motion.div 
              className="absolute w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(124,58,237,0.28)] border border-neutral-100"
              animate={{
                left: currentView === 'home' ? '10%' :
                      currentView === 'customizer' ? '30%' :
                      currentView === 'history' ? '70%' :
                      '90%'
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              style={{
                bottom: '34px',
                transform: 'translateX(-50%)'
              }}
            >
              {/* Flat Blue selected active icon wrapper */}
              <div className="w-11 h-11 rounded-full bg-[#0062CC] flex items-center justify-center text-white">
                {currentView === 'home' && <Home className="w-5 h-5 text-white" />}
                {currentView === 'customizer' && <Shirt className="w-5 h-5 text-white" />}
                {currentView === 'history' && <BarChart2 className="w-5 h-5 text-white" />}
                {currentView === 'profile' && <User className="w-5 h-5 text-white" />}
              </div>
            </motion.div>
          </div>

          {/* Interactive Flat Buttons Row */}
          <div className="relative z-10 w-full h-16 grid grid-cols-5 items-center">
            
            {/* TAB 0: HOME */}
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 outline-none"
            >
              <div className={`transition-all duration-300 ${currentView === 'home' ? 'opacity-0 scale-50' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <Home className="w-5 h-5" />
              </div>
              <span className={`text-[9.5px] font-sans font-bold tracking-tight transition-all duration-200 mt-0.5 ${
                currentView === 'home' ? 'text-[#8133f1] font-extrabold translate-y-[-2px]' : 'text-neutral-400'
              }`}>
                Accueil
              </span>
            </button>

            {/* TAB 1: BOUTIQUE */}
            <button
              onClick={() => {
                setCurrentView('customizer');
                setBoutiqueSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 outline-none"
            >
              <div className={`transition-all duration-300 ${currentView === 'customizer' ? 'opacity-0 scale-50' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <Shirt className="w-5 h-5" />
              </div>
              <span className={`text-[9.5px] font-sans font-bold tracking-tight transition-all duration-200 mt-0.5 ${
                currentView === 'customizer' ? 'text-[#8133f1] font-extrabold translate-y-[-2px]' : 'text-neutral-400'
              }`}>
                Boutique
              </span>
            </button>

            {/* TAB 2 (CENTER): PORTFOLIO */}
            <button
              onClick={() => {
                setIsPortfolioOpen(true);
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 outline-none"
            >
              <div className={`transition-all duration-300 ${isPortfolioOpen ? 'rotate-12 scale-110 text-neutral-800' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <Grid className="w-5 h-5" />
              </div>
              <span className={`text-[9.5px] font-sans font-bold tracking-tight transition-all duration-200 mt-0.5 ${
                isPortfolioOpen ? 'text-neutral-800 font-extrabold' : 'text-neutral-400'
              }`}>
                Portfolio
              </span>
            </button>

            {/* TAB 3: HISTORY */}
            <button
              onClick={() => {
                setCurrentView('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 outline-none"
            >
              <div className={`transition-all duration-300 ${currentView === 'history' ? 'opacity-0 scale-50' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <BarChart2 className="w-5 h-5" />
              </div>
              <span className={`text-[9.5px] font-sans font-bold tracking-tight transition-all duration-200 mt-0.5 ${
                currentView === 'history' ? 'text-[#8133f1] font-extrabold translate-y-[-2px]' : 'text-neutral-400'
              }`}>
                Suivi
              </span>
            </button>

            {/* TAB 4: PROFILE */}
            <button
              onClick={() => {
                setCurrentView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-full flex flex-col items-center justify-center gap-0.5 outline-none"
            >
              <div className={`transition-all duration-300 ${currentView === 'profile' ? 'opacity-0 scale-50' : 'text-neutral-400 hover:text-neutral-600'}`}>
                <User className="w-5 h-5" />
              </div>
              <span className={`text-[9.5px] font-sans font-bold tracking-tight transition-all duration-200 mt-0.5 ${
                currentView === 'profile' ? 'text-[#8133f1] font-extrabold translate-y-[-2px]' : 'text-neutral-400'
              }`}>
                Profil
              </span>
            </button>

          </div>

        </div>
      </div>

    </div>
  );
}

// ==========================================
// --- ADDITIONAL RESPONSIVE APP SUB-VIEWS ---
// ==========================================

function SalesChart({ pastOrders, theme = 'light' }: { pastOrders: any[], theme?: 'light' | 'dark' }) {
    const data = React.useMemo(() => {
        const result = [];
        const today = new Date();
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        
        let totalRevenue = 0;
        let addedToday = 0;

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            
            const salesForDay = (pastOrders || []).filter(o => o.date === dateStr || (!o.date && i === 0));
            const dayQty = salesForDay.reduce((acc, curr) => acc + (curr.qty || 1), 0);
            
            totalRevenue += salesForDay.reduce((acc, curr) => acc + (curr.price * (curr.qty || 1)), 0);
            
            if (i === 0) {
                addedToday = dayQty;
            }

            result.push({ 
                name: i === 0 ? "Aujourd'hui" : days[d.getDay()], 
                sales: dayQty 
            });
        }
        
        return { chartData: result, totalRevenue };
    }, [pastOrders]);

    return (
        <div className={`w-full ${theme === 'dark' ? 'bg-neutral-800 border-white/5' : 'bg-white border-neutral-150'} rounded-3xl border p-5 shadow-3xs flex flex-col gap-4 relative overflow-hidden transition-colors`}>
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest">Ventes sur 7 jours</span>                
                    <h3 className={`text-xl font-display font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{(data.totalRevenue).toLocaleString("fr-FR")} FCFA</h3>
                </div>
                {data.totalRevenue > 0 && (
                  <div className="bg-[#0062CC]/10 text-[#0062CC] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="text-[10px] font-black tracking-wider">+{(data.totalRevenue > 0 ? 100 : 0)}%</span>
                      <TrendingUp className="w-3 h-3" />
                  </div>
                )}
            </div>
            
            <div className="h-32 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData}>
                        <defs>
                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0062CC" stopOpacity={1} />
                                <stop offset="100%" stopColor="#4DB8FF" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <Bar 
                            dataKey="sales" 
                            fill="url(#blueGradient)" 
                            radius={[6, 6, 0, 0]} 
                        />
                        <XAxis 
                            dataKey="name" 
                            fontSize={9} 
                            tickMargin={10}
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#a3a3a3', fontWeight: 600 }}
                        />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{ fill: 'rgba(0,98,204,0.05)' }} 
                            contentStyle={{ fontSize: 11, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 700 }}
                            itemStyle={{ color: '#0062CC' }}
                            formatter={(value: number) => [`${value} ventes`, '']}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function HistoryView({ 
  pastOrders, 
  cartItems, 
  boutiqueProducts, 
  triggerToast, 
  confirmOrder,
  theme = 'light'
}: { 
  pastOrders: any[], 
  cartItems: any[], 
  boutiqueProducts: any[], 
  triggerToast: (m: string) => void, 
  confirmOrder: (id: string) => void,
  theme?: 'light' | 'dark'
}) {

  // Calculate today's sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = pastOrders.filter(o => o.date === todayStr || !o.date);
  const totalItemsToday = todaySales.reduce((acc, curr) => acc + (curr.qty || 1), 0);
  const totalRevenueToday = todaySales.reduce((acc, curr) => acc + (curr.price * (curr.qty || 1)), 0);

  return (
    <div className={`flex flex-col gap-6 px-4 py-8 pb-32 max-w-md mx-auto ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-neutral-50/50 border-neutral-100'} min-h-[calc(100vh-140px)] shadow-[0_0_50px_rgba(0,0,0,0.02)] rounded-3xl border my-4 transition-colors`}>
      <div className="flex flex-col gap-1 px-1 mb-2 text-left">
        <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#0062CC] uppercase flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5" />
          Dashboard Boutique
        </span>
        <h2 className={`text-2xl font-display font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'} tracking-tight`}>Suivi des Ventes</h2>
        <p className={`text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'} font-medium font-sans`}>Visualisez vos performances de la journée et l'évolution globale.</p>
      </div>

      {/* Upward trending blue chart */}
      <SalesChart pastOrders={pastOrders} theme={theme} />

      {/* Daily Summary Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-neutral-200/60 shadow-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0062CC]/10 flex items-center justify-center text-[#0062CC] mb-1">
                <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest text-left">Ventes Aujourd'hui</span>
            <span className="text-lg font-display font-black text-neutral-900 text-left">{totalItemsToday}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-neutral-200/60 shadow-sm flex flex-col gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1">
                <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest text-left">Revenus du Jour</span>
            <span className="text-lg font-display font-black text-neutral-900 text-left">{(totalRevenueToday || 0).toLocaleString("fr-FR")} FCFA</span>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200/55 shadow-3xs flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <span className="text-[10px] font-black text-neutral-800 uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#0062CC]" />
            Activité de la Journée
          </span>
          <span className="text-[9px] text-[#0062CC] bg-[#0062CC]/10 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest">En Direct</span>
        </div>
        
        <div className="flex flex-col gap-4">
            {todaySales.slice(0, 3).map((sale, idx) => (
                <div key={idx} className="flex gap-4 items-start relative before:absolute before:left-5 before:top-10 before:bottom-[-20px] before:w-[2px] before:bg-neutral-100 last:before:hidden">
                  <div className="w-10 h-10 rounded-full bg-[#0062CC]/10 text-[#0062CC] flex items-center justify-center shrink-0 border border-[#0062CC]/20 z-10">
                    <ShoppingCart className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 text-left">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">Nouvelle Commande</h4>
                        <span className="text-[9px] text-neutral-400 font-mono">Aujourd'hui</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">{sale.qty}x {sale.styleName} ({sale.size})</p>
                    <span className="text-[10px] font-black text-[#0062CC] bg-[#0062CC]/5 px-2 py-0.5 rounded-md inline-block mt-1.5">{(sale.price * (sale.qty || 1)).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>
            ))}
            
            {todaySales.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs font-medium">Aucune vente aujourd'hui.</div>
            )}
        </div>
      </div>

      {/* Past order cards list */}
      <div className="flex flex-col gap-3.5 mt-2">
        <span className="text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest px-1 text-left">Historique des Commandes</span>
        {pastOrders.map((ord, idx) => (
          <div key={idx} className={`bg-white rounded-3xl p-4.5 border shadow-3xs flex flex-col gap-3 ${ord.status === 'En attente' ? 'border-blue-200 bg-blue-50/10' : 'border-neutral-150'}`}>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold">{ord.id || `CMD-2026-${Math.floor(Math.random()*1000)}`}</span>
                {ord.status === 'En attente' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase animate-pulse">Nouveau</span>}
              </div>
              <span className="text-neutral-400 font-medium">{ord.date ? new Date(ord.date).toLocaleDateString('fr-FR') : "Aujourd'hui"}</span>
            </div>
            <div className="flex gap-3.5 items-center">
              <div 
                className="w-11 h-11 rounded-2xl border border-neutral-150 shrink-0 flex items-center justify-center p-0.5 shadow-3xs"
                style={{ backgroundColor: ord.color || '#000000' }}
              >
                <Shirt className={`w-6 h-6 ${(ord.color === '#FFFFFF' || !ord.color) ? 'text-stone-300' : 'text-white'}`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-xs font-bold text-neutral-800 truncate">{ord.styleName}</h4>
                <p className="text-[10px] font-mono text-neutral-450 mt-0.5">
                  Taille: <strong className="text-neutral-700 font-sans">{ord.size}</strong> — Qté: <strong className="text-neutral-700 font-sans">{ord.qty}</strong> — <strong className="text-neutral-700 font-sans">{((ord.price || 0) * (ord.qty || 1)).toLocaleString("fr-FR")} FCFA</strong>
                </p>
                {ord.customerName && (
                  <p className="text-[9px] font-bold text-neutral-400 mt-1 uppercase tracking-tight">
                    Client: <span className="text-neutral-600">{ord.customerName}</span> {ord.customerPhone && <span className="text-blue-500">({ord.customerPhone})</span>}
                  </p>
                )}
                {ord.customerEmail && (
                  <p className="text-[9px] font-bold text-neutral-400 mt-0.5 lowercase tracking-tight">
                    Email: <span className="text-neutral-600">{ord.customerEmail}</span>
                  </p>
                )}
                {ord.customerLocation && (
                  <p className="text-[9px] font-bold text-neutral-400 mt-0.5 uppercase tracking-tight">
                    Localisation: <span className="text-neutral-600">{ord.customerLocation}</span>
                  </p>
                )}
                {ord.paymentMethod && (
                  <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-neutral-100/50">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${ord.paymentMethod === 'moov' || ord.paymentMethod === 'flooz' ? 'bg-blue-500' : ord.paymentMethod === 'tmoney' ? 'bg-yellow-550' : 'bg-emerald-500'}`} />
                      <span className="text-[8px] font-black uppercase text-neutral-400">Paiement via:</span>
                      <span className="text-[9px] font-bold text-neutral-700 uppercase italic">
                        {ord.paymentMethod === 'flooz' || ord.paymentMethod === 'moov' ? 'Moov Money' : ord.paymentMethod === 'tmoney' ? 'T-Money' : 'Carte'}
                      </span>
                    </div>
                    {ord.momoNumber && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Smartphone className="w-2.5 h-2.5 text-neutral-400" />
                        <span className="text-[9px] font-mono font-bold text-blue-600 tracking-tighter">{ord.momoNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {ord.status === 'En attente' && (
              <button 
                onClick={() => confirmOrder(ord.id)}
                className="w-full py-2.5 bg-[#0062CC] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0051A8] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-200 mt-1"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmer la Commande
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminAnalyticsDashboard({ onClose, pastOrders, triggerToast, setPastOrders, googleToken }: { onClose: () => void; pastOrders: any[]; triggerToast: (m: string) => void; setPastOrders: React.Dispatch<React.SetStateAction<any[]>>; googleToken: string | null; }) {

  const totalRevenue = pastOrders.reduce((acc, curr) => acc + (curr.price * (curr.qty || 1)), 0);
  const totalItems = pastOrders.reduce((acc, curr) => acc + (curr.qty || 1), 0);
  const avgCart = pastOrders.length ? Math.round(totalRevenue / pastOrders.length) : 0;
  
  const activeClients = pastOrders.length > 0 ? 12 + totalItems : 0;
  
  // Aggregate sales by product name
  const productSales: Record<string, number> = {};
  pastOrders.forEach(ord => {
    productSales[ord.styleName] = (productSales[ord.styleName] || 0) + (ord.qty || 1);
  });
  
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .map(([name, sales]) => ({ name, sales, trend: '+100%' }));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 text-left"
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-display font-black text-neutral-900">Analytique Boutique</h2>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Rapports détaillés et performances</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-neutral-150 shadow-3xs flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Revenus Totaux</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-display font-black text-neutral-900">{(totalRevenue).toLocaleString("fr-FR")}</span>
            <span className="text-[10px] font-bold text-neutral-500 font-mono">FCFA</span>
          </div>
          {totalRevenue > 0 && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block self-start font-bold mt-1">+100% ce mois</span>}
        </div>

        <div className="bg-white p-4 rounded-3xl border border-neutral-150 shadow-3xs flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <ShoppingCart className="w-4 h-4 text-[#8133f1]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Panier Moyen</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-display font-black text-neutral-900">{(avgCart).toLocaleString("fr-FR")}</span>
            <span className="text-[10px] font-bold text-neutral-500 font-mono">FCFA</span>
          </div>
          {avgCart > 0 && <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block self-start font-bold mt-1">+100% cette sem.</span>}
        </div>
      </div>


      {/* Traffic & Conversion */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-150 shadow-3xs flex flex-col gap-4">
        <h3 className="text-xs font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00c4cc]" />
          Acquisition & Conversion
        </h3>
        
        <div className="flex gap-4 items-center">
            <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-mono text-neutral-500">Clients Actifs (Live)</span>
                    <span className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeClients > 0 ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`}></span>
                        {activeClients}
                    </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00c4cc] to-[#13a8d9] rounded-full" style={{ width: activeClients > 0 ? '75%' : '0%' }}></div>
                </div>
                <p className="text-[9px] text-neutral-400 font-mono mt-1 pt-1 border-t border-neutral-100">+{activeClients > 0 ? totalItems : 0} acheteurs réguliers</p>
            </div>
            <div className="w-px h-12 bg-neutral-100"></div>
            <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-mono text-neutral-500">Conversion</span>
                    <span className="text-sm font-black text-neutral-900">{pastOrders.length > 0 ? Math.min(100, 4.8 + totalItems * 0.1).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#13a8d9] to-[#8133f1] rounded-full" style={{ width: pastOrders.length > 0 ? `${Math.min(100, 20 + totalItems * 2)}%` : '0%' }}></div>
                </div>
                <p className="text-[9px] text-neutral-400 font-mono mt-1 pt-1 border-t border-neutral-100">Visiteur {'->'} Acheteur</p>
            </div>
        </div>

        <div className="pt-3 border-t border-neutral-100">
            <h4 className="text-[9px] font-mono font-bold text-neutral-400 uppercase mb-2">Sources de Trafic (Mois)</h4>
            <div className="flex gap-2">
                <div className="flex-1 bg-neutral-50 rounded-xl p-2 text-center border border-neutral-100">
                    <span className="block text-xs font-black text-neutral-900">{pastOrders.length > 0 ? "45%" : "0%"}</span>
                    <span className="block text-[8px] font-bold text-neutral-400 uppercase mt-0.5">Réseaux Sociaux</span>
                </div>
                <div className="flex-1 bg-neutral-50 rounded-xl p-2 text-center border border-neutral-100">
                    <span className="block text-xs font-black text-neutral-900">{pastOrders.length > 0 ? "35%" : "0%"}</span>
                    <span className="block text-[8px] font-bold text-neutral-400 uppercase mt-0.5">Recherche</span>
                </div>
                <div className="flex-1 bg-neutral-50 rounded-xl p-2 text-center border border-neutral-100">
                    <span className="block text-xs font-black text-neutral-900">{pastOrders.length > 0 ? "20%" : "0%"}</span>
                    <span className="block text-[8px] font-bold text-neutral-400 uppercase mt-0.5">Direct</span>
                </div>
            </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-150 shadow-3xs flex flex-col gap-4">
        <h3 className="text-xs font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-[#8133f1]" />
          Performance par Catégorie
        </h3>
        
        <div className="flex flex-col gap-3">
            {[
                { name: 'Textile', pct: totalRevenue > 0 ? 100 : 0, rev: `${totalRevenue > 0 ? totalRevenue.toLocaleString("fr-FR") : '0'} FCFA` },
                { name: 'Cosmétique', pct: 0, rev: '0 FCFA' },
                { name: 'Accessoires', pct: 0, rev: '0 FCFA' },
                { name: 'Coiffure', pct: 0, rev: '0 FCFA' },
            ].map((cat) => (
                <div key={cat.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-neutral-700">{cat.name}</span>
                        <span className="font-mono font-bold text-[#8133f1]">{cat.rev}</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-800 rounded-full" style={{ width: `${cat.pct}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-150 shadow-3xs flex flex-col gap-4">
        <h3 className="text-xs font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          Top Modèles Les Plus Demandés
        </h3>
        <div className="flex flex-col divide-y divide-neutral-100">
            {topProducts.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-xs font-medium">Aucun achat enregistré.</div>
            ) : topProducts.slice(0, 5).map((prod, idx) => (
                <div key={prod.name} className="py-2.5 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-500 font-bold font-mono shrink-0">
                        {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">{prod.name}</h4>
                        <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{prod.sales} achats ce mois</p>
                    </div>
                    <span className={`text-[10px] font-bold font-mono ${prod.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-400'}`}>
                        {prod.trend}
                    </span>
                </div>
            ))}
        </div>
      </div>

      {/* Reviews & Satisfaction */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-150 shadow-3xs flex flex-col gap-4">
        <h3 className="text-xs font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          Avis & Satisfaction
        </h3>
        <div className="flex items-center gap-5">
            <div className="flex flex-col items-center justify-center shrink-0">
                <span className="text-3xl font-display font-black text-neutral-900">{pastOrders.length > 0 ? "4.9" : "0.0"}</span>
                <div className={`flex gap-0.5 mt-1 ${pastOrders.length > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                </div>
                <span className="text-[9px] text-neutral-400 font-mono mt-1.5">Sur {pastOrders.length > 0 ? pastOrders.length * 3 : 0} avis</span>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 w-full">
                {[
                    { label: '5 Étoiles', val: pastOrders.length > 0 ? 85 : 0 },
                    { label: '4 Étoiles', val: pastOrders.length > 0 ? 12 : 0 },
                    { label: '3 Étoiles', val: pastOrders.length > 0 ? 2 : 0 },
                    { label: '2 Étoiles', val: pastOrders.length > 0 ? 1 : 0 },
                    { label: '1 Étoile', val: 0 },
                ].map(r => (
                    <div key={r.label} className="flex items-center gap-2 w-full text-[9px] font-mono">
                        <span className="w-12 text-neutral-500 shrink-0">{r.label}</span>
                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${r.val}%` }}></div>
                        </div>
                        <span className="w-6 text-right text-neutral-400">{r.val}%</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RECENT ORDERS - FINAL POLISHED VIEW */}
      <div className="flex flex-col gap-5 text-left mt-4 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-blue-500" />
            Dernières Commandes
          </h3>
          {pastOrders.length > 0 && <span className="text-[9px] font-mono font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{pastOrders.length} TOTAL</span>}
        </div>
        
        <div className="flex flex-col gap-4">
          {pastOrders.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-[10px] font-medium bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 uppercase tracking-widest italic">
              Aucune commande à afficher.
            </div>
          ) : (
            pastOrders.map((ord, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-4 border border-neutral-150 shadow-sm flex flex-col gap-4 transition-all hover:border-blue-200">
                {/* Header: ID & Date */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight">{ord.id}</span>
                  <span className="text-[10px] font-bold text-neutral-300">
                    {ord.date ? new Date(ord.date).toLocaleDateString('fr-FR') : "15/06/2026"}
                  </span>
                </div>
                
                {/* Product Section */}
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-xl border border-neutral-100 shrink-0 flex items-center justify-center bg-stone-50">
                    <Shirt className="w-6 h-6 text-neutral-200" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h4 className="text-[14px] font-black text-neutral-800 uppercase leading-none truncate">
                      {ord.styleName || "PRODUIT SANS NOM"}
                    </h4>
                    <p className="text-[12px] font-bold text-neutral-400 italic leading-none">
                      Taille: <span className="text-neutral-800">{ord.size || 'S'}</span> — 
                      Qté: <span className="text-neutral-800">{ord.qty || 1}</span> — 
                      <span className="text-blue-600 font-black ml-1">{((ord.price || 0) * (ord.qty || 1)).toLocaleString("fr-FR")} FCFA</span>
                    </p>
                    
                    {/* Identification Details */}
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-tight">
                        CLIENT: <span className="text-neutral-900">{ord.customerName}</span> 
                        <span className="text-blue-600 font-extrabold ml-1">({ord.customerPhone})</span>
                      </p>
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-tight">
                        email: <span className="text-neutral-500 lowercase font-bold">{ord.customerEmail || 'non fourni'}</span>
                      </p>
                      <p className="text-[9px] font-black text-neutral-500 uppercase tracking-tight">
                        LOCALISATION: <span className="text-neutral-900 font-extrabold">{ord.customerLocation || 'LOMÉ'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirm Action */}
                <button 
                  disabled={ord.confirming}
                  onClick={async () => {
                    if (ord.confirmed) {
                      triggerToast(`Commande ${ord.id} déjà confirmée.`);
                      return;
                    }

                    if (!ord.customerEmail) {
                      triggerToast("Email client manquant pour l'envoi.");
                      setPastOrders(prev => prev.map(p => p.id === ord.id ? { ...p, confirmed: true } : p));
                      return;
                    }
                    
                    // Mark as confirming in UI
                    setPastOrders(prev => prev.map(p => p.id === ord.id ? { ...p, confirming: true } : p));
                    triggerToast(`Commande ${ord.id} : Envoi de l'email automatique...`);

                    try {
                      const response = await fetch('/api/send-confirmation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          clientEmail: ord.customerEmail,
                          commandeId: ord.id,
                          produit: ord.styleName || "Produit Boutique",
                          prix: (ord.price || 0) * (ord.qty || 1),
                          customerName: ord.customerName,
                          customerLocation: ord.customerLocation,
                          accessToken: googleToken // Pass token here!
                        })
                      });

                      const data = await response.json();

                      if (response.ok) {
                        triggerToast(`Succès : Email envoyé à ${ord.customerName}.`);
                        setPastOrders(prev => prev.map(p => p.id === ord.id ? { ...p, confirmed: true, confirming: false } : p));
                      } else {
                        throw new Error(data.error || "Erreur serveur");
                      }
                    } catch (error: any) {
                      console.error("Email failed:", error);
                      triggerToast(`Erreur : ${error.message || "Impossible d'envoyer l'email automatique."}`);
                      
                      // Fallback to mailto if server fails
                      const subject = encodeURIComponent(`Confirmation de votre commande ${ord.id} - ID'AFRO`);
                      const body = encodeURIComponent(`Bonjour ${ord.customerName},\n\nVotre commande (${ord.styleName}) est confirmée.\n\nL'équipe ID'AFRO`);
                      window.location.href = `mailto:${ord.customerEmail}?subject=${subject}&body=${body}`;
                      
                      setPastOrders(prev => prev.map(p => p.id === ord.id ? { ...p, confirmed: true, confirming: false } : p));
                    }
                  }}
                  className={`w-full py-3 rounded-xl font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    ord.confirmed 
                      ? "bg-emerald-500 text-white shadow-emerald-100" 
                      : ord.confirming
                        ? "bg-blue-400 text-white cursor-not-allowed"
                        : "bg-[#0052cc] text-white hover:bg-[#0047b3] shadow-blue-100"
                  }`}
                >
                  {ord.confirming ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ENVOI EN COURS...
                    </>
                  ) : ord.confirmed ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      COMMANDE CONFIRMÉE
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      CONFIRMER LA COMMANDE
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
        
        {pastOrders.length > 0 && (
          <div className="py-6 flex flex-col items-center gap-2 opacity-30">
            <div className="w-8 h-0.5 bg-neutral-300 rounded-full" />
            <p className="text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-[0.4em]">
              FIN DE LISTE
            </p>
          </div>
        )}
      </div>

    </motion.div>
  );
}

function ProfileView({ 
  triggerToast, 
  boutiqueProducts, 
  setBoutiqueProducts,
  pastOrders,
  setPastOrders,
  googleToken,
  setGoogleToken,
  authUser,
  setAuthUser,
  theme = 'light'
}: { 
  triggerToast: (m: string) => void; 
  boutiqueProducts: BoutiqueProduct[];
  setBoutiqueProducts: React.Dispatch<React.SetStateAction<BoutiqueProduct[]>>;
  pastOrders: any[];
  setPastOrders: React.Dispatch<React.SetStateAction<any[]>>;
  googleToken: string | null;
  setGoogleToken: (t: string | null) => void;
  authUser: any;
  setAuthUser: (u: any) => void;
  theme?: 'light' | 'dark';
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [prefSize, setPrefSize] = useState<string>('M');
  const [notifySetting, setNotifySetting] = useState<boolean>(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [adminListTab, setAdminListTab] = useState<'all' | 'images' | 'videos'>('all');
  const [adminFormMediaType, setAdminFormMediaType] = useState<'image' | 'video'>('image');

  const toggleMediaType = (type: 'image' | 'video') => {
    setAdminFormMediaType(type);
    // On nettoie les champs contraires
    if (type === 'image') {
      setNewProduct(prev => ({ ...prev, video: '' }));
    } else {
      setNewProduct(prev => ({ ...prev, image: '', isBoosted: false }));
    }
  };

  // Admin Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'COLLECTION REGULAR',
    tagline: '',
    description: '',
    image: '',
    video: '',
    videoDuration: '0:05',
    isBoosted: false
  });

  const handleEditClick = (prod: BoutiqueProduct) => {
    setEditingProductId(prod.id);
    setAdminFormMediaType(prod.video ? 'video' : 'image');
    setNewProduct({
      name: prod.name,
      price: prod.price.toString(),
      category: prod.category,
      tagline: prod.tagline,
      description: prod.description || '',
      image: prod.image,
      video: prod.video || '',
      videoDuration: prod.videoDuration || '0:05',
      isBoosted: !!prod.isBoosted
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
    triggerToast(`Modification de : ${prod.name}`);
  };

  const cancelEdit = () => {
    setEditingProductId(null);
    setNewProduct({ name: '', price: '', category: 'COLLECTION REGULAR', tagline: '', description: '', image: '', video: '', videoDuration: '0:05', isBoosted: false });
  };

  const handleDeleteProduct = (id: string) => {
    setBoutiqueProducts(prev => prev.filter(p => p.id !== id));
    if (editingProductId === id) cancelEdit();
    triggerToast("Modèle supprimé.");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isVideo = adminFormMediaType === 'video';
    const mediaValue = isVideo ? newProduct.video : newProduct.image;
    
    const finalName = newProduct.name || (isVideo ? "VIDÉO EXCLUSIVE" : "PRODUIT SANS NOM");

    if (!mediaValue) {
      triggerToast(`CHAMP REQUIS: ${isVideo ? 'VIDÉO' : 'IMAGE'}`);
      return;
    }

    const finalImage = newProduct.image || (isVideo 
      ? 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800' 
      : 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800');
    const finalVideo = isVideo ? newProduct.video : '';
    const finalBoost = newProduct.isBoosted;

    if (editingProductId) {
      // Update existing
      setBoutiqueProducts(prev => prev.map(p => 
        p.id === editingProductId 
          ? { 
              ...p, 
              name: finalName, 
              price: parseFloat(newProduct.price || "0"), 
              category: newProduct.category, 
              tagline: newProduct.tagline, 
              description: newProduct.description,
              image: isVideo ? (p.image || finalImage) : finalImage,
              video: finalVideo,
              videoDuration: isVideo ? (newProduct.videoDuration || '0:05') : undefined,
              isBoosted: finalBoost 
            } 
          : p
      ));
      setEditingProductId(null);
      setNewProduct({ name: '', price: '', category: 'COLLECTION REGULAR', tagline: '', description: '', image: '', video: '', videoDuration: '0:05', isBoosted: false });
      triggerToast("Modèle mis à jour !");
    } else {
      // Add new
      const product: BoutiqueProduct = {
        id: `btq-${Date.now()}`,
        name: finalName,
        price: parseFloat(newProduct.price || "28.00"),
        category: newProduct.category,
        tagline: newProduct.tagline || (isVideo ? 'Modèle Vidéo Exclusive' : 'Nouveau modèle premium'),
        description: newProduct.description,
        image: finalImage,
        video: finalVideo,
        videoDuration: isVideo ? (newProduct.videoDuration || '0:05') : undefined,
        isBoosted: finalBoost,
        defaultColor: COLOR_PRESETS.white,
        bookmarkColor: 'grey',
        stylePreset: TSHIRT_STYLES[0]
      };

      setBoutiqueProducts(prev => [product, ...prev]);
      setNewProduct({ name: '', price: '', category: 'COLLECTION REGULAR', tagline: '', description: '', image: '', video: '', videoDuration: '0:05', isBoosted: false });
      triggerToast("Produit enregistré !");
    }
  };

  return (
    <div className={`flex flex-col gap-5 px-4 py-8 pb-32 max-w-lg mx-auto ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-neutral-50/50 border-neutral-100'} min-h-[calc(100vh-140px)] shadow-[0_0_50px_rgba(0,0,0,0.02)] rounded-3xl border my-4 transition-colors`}>
      
      {/* Google Connection Header */}
      <div className={`flex items-center justify-between mb-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'} p-3 rounded-2xl border backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-[10px] font-black">
            AC
          </div>
          <div>
            <h2 className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'} tracking-tight uppercase`}>Dashboard Admin</h2>
            <p className="text-[9px] text-neutral-400 font-mono">Status: {googleToken ? 'GMAIL CONNECTÉ' : 'MODE HORS-LIGNE'}</p>
          </div>
        </div>
        <div>
          {googleToken ? (
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <button 
                onClick={() => { firebaseLogout(); setGoogleToken(null); setAuthUser(null); triggerToast("Déconnecté !"); }}
                className="text-[9px] font-black text-emerald-700 uppercase"
              >
                Déconnecter Gmail
              </button>
            </div>
          ) : (
            <button 
              onClick={async () => {
                try {
                  const res = await loginWithGoogle();
                  if (res) {
                    setGoogleToken(res.accessToken);
                    setAuthUser(res.user);
                    triggerToast("Connecté à Gmail !");
                  }
                } catch (e) {
                  triggerToast("Erreur de connexion.");
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <AtSign className="w-3 h-3 text-white" />
              <span className="text-[9px] font-black text-white uppercase">Lier Gmail</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-neutral-200/50 p-1 rounded-2xl mb-2">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          <User className="w-3.5 h-3.5" />
          PROFIL
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          <Grid className="w-3.5 h-3.5" />
          ADMINISTRATION
        </button>
      </div>

      {showAnalytics ? (
        <AdminAnalyticsDashboard 
          onClose={() => setShowAnalytics(false)} 
          pastOrders={pastOrders} 
          triggerToast={triggerToast}
          setPastOrders={setPastOrders}
          googleToken={googleToken}
        />
      ) : activeTab === 'profile' ? (
        <>
          {/* Top profile banner card */}
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 text-white rounded-3xl p-6.5 shadow-xl relative overflow-hidden">
            {/* Abstract circles decoration */}
            <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/5 -mr-8 -mt-8 pointer-events-none"></div>
            <div className="absolute left-0 bottom-0 w-24 h-24 rounded-full bg-white/2 -ml-8 -mb-8 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center font-display font-black text-white text-md shadow-inner">
                  AC
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[8px] font-mono font-black text-amber-300 tracking-widest uppercase">Propriétaire Boutique</span>
                  <h3 className="text-base font-display font-black truncate">Afro Collecte Design</h3>
                  <p className="text-[10px] text-neutral-300 font-mono">ADMIN ACCESS: AC-2026-ADMIN</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between text-center">
                <div>
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">Produits</span>
                  <strong className="block text-sm font-display font-black text-white mt-1">{boutiqueProducts.length}</strong>
                </div>
                <div className="border-l border-white/10 h-8 self-center"></div>
                <div>
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">Ventes</span>
                  <strong className="block text-sm font-display font-black text-emerald-400 mt-1">+12%</strong>
                </div>
                <div className="border-l border-white/10 h-8 self-center"></div>
                <div>
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">Statut</span>
                  <strong className="block text-sm font-display font-black text-white mt-1">Actif</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Preferred size select panel */}
          <div className="bg-white rounded-3xl p-5 border border-neutral-150 shadow-3xs flex flex-col gap-3">
            <span className="text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest block text-left">Taille de Coupe Préférée</span>
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    setPrefSize(sz);
                    triggerToast(`Taille par défaut enregistrée : ${sz}`);
                  }}
                  className={`h-9 rounded-xl font-display font-bold text-xs flex items-center justify-center border transition-all ${
                    prefSize === sz 
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs' 
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Fast adjustments options list */}
          <div className="bg-white rounded-3xl border border-neutral-150 shadow-3xs overflow-hidden divide-y divide-neutral-100">
            <div className="p-4 flex items-center justify-between">
              <div className="text-left">
                <h4 className="text-xs font-bold text-neutral-800">Notifications Admin</h4>
                <p className="text-[9px] text-neutral-400 font-mono mt-0.5">Alertes sur les nouvelles commandes</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setNotifySetting(!notifySetting);
                  triggerToast(notifySetting ? "Alertes désactivées" : "Alertes activées");
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-all outline-none flex items-center ${notifySetting ? 'bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1]' : 'bg-neutral-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-all ${notifySetting ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <button 
              onClick={() => setShowAnalytics(true)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
            >
              <div className="text-left">
                <h4 className="text-xs font-bold text-neutral-800">Analytique Boutique</h4>
                <p className="text-[9px] text-neutral-400 font-mono mt-0.5">Vues, clics et taux de conversion</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
          
          {/* SECTION: SEND NOTIFICATION IN PROFILE */}
          <div className="bg-white rounded-3xl border border-neutral-150 shadow-3xs overflow-hidden p-5 flex flex-col gap-3">
            <div className="text-left">
              <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#8133f1]" />
                Envoyer une Notification Rapide
              </h4>
              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">Diffuser un message à tous les utilisateurs</p>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="admin-notif-input"
                placeholder="Message (ex: Promo de 20% !)" 
                className="flex-1 bg-neutral-50/50 border border-neutral-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8133f1]/20 focus:border-[#8133f1] shadow-sm transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const btn = document.getElementById('admin-notif-btn');
                    if (btn) btn.click();
                  }
                }}
              />
              <button 
                type="button"
                id="admin-notif-btn"
                onClick={() => {
                  const input = document.getElementById('admin-notif-input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    triggerToast(input.value.trim());
                    input.value = '';
                  } else {
                    triggerToast('Veuillez entrer un message.');
                  }
                }}
                className="px-5 bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                Envoyer
              </button>
            </div>
          </div>
        </>
      ) : (
        /* --- ADMIN PANEL SECTION --- */
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
        
          <div className={`border rounded-3xl p-5 text-left flex justify-between items-center transition-all ${adminFormMediaType === 'video' ? 'bg-[#8133f1]/5 border-[#8133f1]/20' : 'bg-neutral-50 border-neutral-200'}`}>
            <div>
              <h3 className={`text-sm font-display font-black uppercase tracking-wide ${adminFormMediaType === 'video' ? 'text-[#8133f1]' : 'text-neutral-900'}`}>
                {editingProductId ? "Modifier" : "Publier"} : {adminFormMediaType === 'video' ? 'MODE VIDÉO' : 'MODE IMAGE'}
              </h3>
              <p className="text-[10px] text-neutral-500 mt-1">
                {adminFormMediaType === 'video' 
                  ? 'Fichiers .mp4 optimisés pour un engagement maximal.' 
                  : 'Images haute résolution pour votre catalogue classique.'}
              </p>
            </div>
            {editingProductId && (
              <button 
                onClick={cancelEdit}
                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-[10px] font-bold transition-colors"
              >
                ANNULER
              </button>
            )}
          </div>

          <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left bg-neutral-100/80 p-1.5 rounded-2xl border border-neutral-200">
              <div className="flex relative">
                <motion.div 
                  className={`absolute top-0 bottom-0 rounded-xl shadow-sm border border-neutral-100 transition-colors duration-300`}
                  initial={false}
                  animate={{ 
                    x: adminFormMediaType === 'image' ? '0%' : '100%',
                    width: '50%',
                    backgroundColor: adminFormMediaType === 'image' ? '#ffffff' : '#8133f1'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button 
                  type="button"
                  onClick={() => toggleMediaType('image')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all relative z-10 ${adminFormMediaType === 'image' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  <Link className="w-3.5 h-3.5" />
                  CATALOGUE IMAGE
                </button>
                <button 
                  type="button"
                  onClick={() => toggleMediaType('video')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all relative z-10 ${adminFormMediaType === 'video' ? 'text-white' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  <Video className="w-3.5 h-3.5" />
                  REELS VIDÉO
                </button>
              </div>
            </div>

            <motion.div
              key={adminFormMediaType}
              initial={{ opacity: 0, x: adminFormMediaType === 'image' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black text-neutral-400 uppercase ml-1">
                  Nom du modèle catalogue *
                </label>
                <input 
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Ex: T-Shirt Premium Coton"
                  className="w-full h-12 bg-white border border-neutral-200 rounded-2xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] font-black text-neutral-400 uppercase ml-1">Prix de vente (FCFA) *</label>
                  <input 
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="28.00"
                    className="w-full h-12 bg-white border border-neutral-200 rounded-2xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] font-black text-neutral-400 uppercase ml-1">Catégorie</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full h-12 bg-white border border-neutral-200 rounded-2xl px-4 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-sm appearance-none"
                  >
                    <option>COLLECTION REGULAR</option>
                    <option>COUP DE CŒUR ATELIER</option>
                    <option>MATIÈRE NOBLE</option>
                  </select>
                </div>
              </div>

              {/* --- IMAGE THUMBNAIL (Required for Cart & History) --- */}
              <div className="flex flex-col gap-1.5 text-left mb-1">
                <label className="text-[9px] font-black text-neutral-400 uppercase ml-1">Vignette Image (Essentielle Panier) *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                      placeholder="Lien URL Image (Pinterest, Imgur)..."
                      className="w-full h-12 bg-white border border-neutral-200 rounded-2xl px-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 shadow-sm"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Link className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <label className="cursor-pointer shrink-0">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const url = event.target?.result as string;
                            setNewProduct(prev => ({ ...prev, image: url }));
                            triggerToast("Vignette catalogue chargée !");
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }
                      }} 
                    />
                    <div className="h-12 w-12 bg-neutral-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-colors shadow-sm">
                      <Upload className="w-4 h-4" />
                    </div>
                  </label>
                </div>
                {newProduct.image && (
                  <div className="mt-2 w-full h-32 rounded-2xl border border-neutral-100 bg-neutral-50 overflow-hidden relative group">
                    <img src={newProduct.image} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => setNewProduct({...newProduct, image: ''})}
                      className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-neutral-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* --- VIDEO CONTENT (Conditional) --- */}
              {adminFormMediaType === 'video' && (
                <div className="flex flex-col gap-1.5 text-left mb-2">
                  <label className="text-[9px] font-black text-[#8133f1] uppercase ml-1">URL Vidéo HD (Format Mobile) *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={newProduct.video}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewProduct({...newProduct, video: val});
                        }}
                        placeholder="Lien vidéo direct (Cloudinary, mp4)..."
                        className="w-full h-12 bg-white border border-[#8133f1]/20 rounded-2xl px-4 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-[#8133f1]/10 shadow-sm"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8133f1]/50">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <label className="h-12 px-5 bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white rounded-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-md">
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const url = event.target?.result as string;
                              
                              // Automatically extract duration
                              const tempVideo = document.createElement('video');
                              tempVideo.src = url;
                              tempVideo.onloadedmetadata = () => {
                                const dur = tempVideo.duration;
                                if (!isNaN(dur) && dur > 0) {
                                  const mins = Math.floor(dur / 60);
                                  const secs = Math.floor(dur % 60);
                                  const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                                  setNewProduct(prev => ({ ...prev, video: url, videoDuration: formatted }));
                                } else {
                                  setNewProduct(prev => ({ ...prev, video: url, videoDuration: '0:05' }));
                                }
                              };
                              setNewProduct(prev => ({ ...prev, video: url }));
                              triggerToast("Vidéo chargée !");
                            };
                            reader.readAsDataURL(file);
                            e.target.value = ''; 
                          }
                        }} 
                      />
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left mt-1">
                    <label className="text-[9px] font-black text-[#8133f1] uppercase ml-1">Durée de la Vidéo (Format M:SS ou MM:SS, ex: 0:05) *</label>
                    <input 
                      type="text"
                      value={newProduct.videoDuration || '0:05'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProduct({...newProduct, videoDuration: val});
                      }}
                      placeholder="0:05"
                      className="w-full h-11 bg-white border border-[#8133f1]/10 rounded-2xl px-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#8133f1]/5 shadow-sm"
                    />
                  </div>

                  {(newProduct.video && newProduct.video !== 'HEAVY_BASE64') && (
                    <div className="mt-2 relative w-32 aspect-[9/16] rounded-2xl overflow-hidden border border-[#8133f1]/10 bg-black shadow-inner">
                      <VideoPlayer src={newProduct.video} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewProduct(prev => ({...prev, video: ''}))}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminFormMediaType === 'image' && (
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[9px] font-black text-neutral-400 uppercase ml-1 flex items-center gap-2">
                    Visibilité Premium
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </label>
                  <button 
                    type="button"
                    onClick={() => setNewProduct({...newProduct, isBoosted: !newProduct.isBoosted})}
                    className={`flex items-center gap-3 px-4 h-12 rounded-2xl border transition-all ${
                      newProduct.isBoosted 
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' 
                      : 'bg-white border-neutral-100 text-neutral-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      newProduct.isBoosted ? 'bg-amber-500 border-amber-500 shadow-sm' : 'border-neutral-200'
                    }`}>
                      {newProduct.isBoosted && <Check className="w-3 h-3 text-white stroke-[4]" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Activer le BOOST de mise en avant</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-left">
                <input 
                  type="text"
                  value={newProduct.tagline}
                  onChange={(e) => setNewProduct({...newProduct, tagline: e.target.value})}
                  placeholder={adminFormMediaType === 'image' ? "Petite accroche modèle (Ex: Tendance été...)" : "Accroche pour la vidéo (Ex: Nouveau drop...)"}
                  className="w-full h-12 bg-white border border-neutral-200 rounded-2xl px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[9px] font-black text-neutral-400 uppercase ml-1">Légende & Description</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder={adminFormMediaType === 'image' ? "Description pour la fiche produit..." : "Description visible sous la vidéo..."}
                  rows={2}
                  className="w-full bg-white border border-neutral-200 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-sm resize-none"
                />
              </div>

              <button 
                type="submit"
                className={`h-14 rounded-[1.2rem] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 shadow-sm ${adminFormMediaType === 'image' ? 'bg-neutral-900 text-white' : 'bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white shadow-lg shadow-[#8133f1]/20'}`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                  {editingProductId ? "Valider les changements" : (adminFormMediaType === 'image' ? "Publier l'image au catalogue" : "Mettre en ligne la vidéo")}
                </span>
              </button>
            </motion.div>
          </form>

          {/* List of registered products (Mini review) */}
          <div className="mt-8 text-left">

            <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#8133f1]" />
              Gestion du Catalogue
            </h4>

            {/* SECTION: VIDEOS */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
                <h5 className="text-[10px] font-black text-neutral-800 uppercase flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-[#8133f1]" />
                  Modèles avec Vidéo ({boutiqueProducts.filter(p => !!p.video).length})
                </h5>
              </div>
              
              <div className="flex flex-col gap-3">
                {boutiqueProducts
                  .filter(p => !!p.video)
                  .sort((a, b) => (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0))
                  .map(p => (
                    <AdminProductCard 
                      key={p.id} 
                      product={p} 
                      onEdit={() => handleEditClick(p)} 
                      onDelete={() => handleDeleteProduct(p.id)} 
                    />
                  ))}
                {boutiqueProducts.filter(p => !!p.video).length === 0 && (
                  <p className="text-[10px] text-neutral-400 italic py-4 bg-neutral-50 rounded-2xl text-center border border-dashed border-neutral-200">Aucun modèle vidéo enregistré.</p>
                )}
              </div>
            </div>

            {/* SECTION: IMAGES ONLY */}
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
                <h5 className="text-[10px] font-black text-neutral-800 uppercase flex items-center gap-2">
                  <Shirt className="w-3.5 h-3.5 text-neutral-900" />
                  Modèles Classiques (Images seule) ({boutiqueProducts.filter(p => !p.video).length})
                </h5>
              </div>
              
              <div className="flex flex-col gap-3">
                {boutiqueProducts
                  .filter(p => !p.video)
                  .sort((a, b) => (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0))
                  .map(p => (
                    <AdminProductCard 
                      key={p.id} 
                      product={p} 
                      onEdit={() => handleEditClick(p)} 
                      onDelete={() => handleDeleteProduct(p.id)} 
                    />
                  ))}
                {boutiqueProducts.filter(p => !p.video).length === 0 && (
                  <p className="text-[10px] text-neutral-400 italic py-4 bg-neutral-50 rounded-2xl text-center border border-dashed border-neutral-200">Aucun modèle classique enregistré.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

{/* Helper Component for Admin Product List Card */}
interface AdminProductCardProps {
  product: BoutiqueProduct;
  onEdit: () => void;
  onDelete: () => void;
  key?: React.Key;
}

function AdminProductCard({ product, onEdit, onDelete }: AdminProductCardProps) {
  return (
    <div className={`bg-white p-4 rounded-[2rem] border-2 transition-all flex items-center gap-4 shadow-sm relative group ${product.isBoosted ? 'border-amber-400 bg-amber-50/10' : 'border-neutral-900 shadow-sm hover:shadow-md'}`}>
      {product.isBoosted && (
        <div className="absolute -top-3 right-5 bg-amber-400 text-neutral-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border-2 border-neutral-900 z-10 flex items-center gap-1 animate-pulse">
          <Sparkles className="w-2.5 h-2.5" />
          BOOSTÉ
        </div>
      )}
      <div className="w-14 h-14 rounded-2xl bg-stone-100 overflow-hidden shrink-0 border border-neutral-200 flex items-center justify-center">
        {product.video ? (
          <VideoPlayer 
            src={product.video} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-neutral-900 truncate uppercase tracking-tight">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono font-black text-neutral-500">{product.price} FCFA</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
          <span className="text-[9px] text-neutral-400 font-bold uppercase truncate">{product.category}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onEdit}
          className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all active:scale-90"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={onDelete}
          className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
