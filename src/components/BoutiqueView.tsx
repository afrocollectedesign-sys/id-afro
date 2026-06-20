import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShoppingBag, 
  ArrowLeft, 
  Star, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight,
  Heart,
  Check,
  Truck,
  RotateCcw,
  MoreHorizontal,
  Eye,
  MessageSquare
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { CartItem, TShirtSize, BoutiqueProduct } from '../types';
import { COLOR_PRESETS, TSHIRT_STYLES } from '../data/mockData';

interface BoutiqueViewProps {
  setCurrentView: (view: 'home' | 'customizer') => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setIsCartOpen: (open: boolean) => void;
  setLastAddedItem: (item: CartItem | null) => void;
  triggerToast: (msg: string, image?: string) => void;
  boutiqueProducts: BoutiqueProduct[];
  theme?: 'light' | 'dark';
  initialSearchQuery?: string;
  setInitialSearchQuery?: (q: string) => void;
}

export default function BoutiqueView({
  setCurrentView,
  cartItems,
  setCartItems,
  setIsCartOpen,
  setLastAddedItem,
  triggerToast,
  boutiqueProducts,
  theme = 'light',
  initialSearchQuery = '',
  setInitialSearchQuery
}: BoutiqueViewProps) {
  
  // Sidebar detailed tracking States
  const [activeProduct, setActiveProduct] = useState<BoutiqueProduct | null>(boutiqueProducts[0] || null);
  const [selectedColor, setSelectedColor] = useState<any>(boutiqueProducts[0]?.defaultColor || COLOR_PRESETS.white);
  const [selectedSize, setSelectedSize] = useState<TShirtSize>('M');

  // Modal detailed tracking States (For the "fenêtre de t-shirts bien stylé")
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedModalProduct, setSelectedModalProduct] = useState<BoutiqueProduct | null>(null);
  const [modalColor, setModalColor] = useState<any>(COLOR_PRESETS.white);
  const [modalSize, setModalSize] = useState<TShirtSize>('M');
  const [isModalWishlisted, setIsModalWishlisted] = useState<boolean>(false);

  // Filter Categories States
  const [activeTopTab, setActiveTopTab] = useState<'all' | 'classic' | 'atelier' | 'limited'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'rond' | 'v' | 'bio' | 'peigne'>('all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery || '');
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isAddingToBag, setIsAddingToBag] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<BoutiqueProduct | null>(null);

  // Sync state with props when catalog changes
  React.useEffect(() => {
    if (boutiqueProducts.length > 0) {
      if (activeProduct) {
        const updated = boutiqueProducts.find(p => p.id === activeProduct.id);
        if (updated) {
          // Update active product data if it changed but keep selection
          if (JSON.stringify(updated) !== JSON.stringify(activeProduct)) {
            setActiveProduct(updated);
          }
        } else {
          // If active product was deleted, switch to the first one available
          setActiveProduct(boutiqueProducts[0]);
          setSelectedColor(boutiqueProducts[0].defaultColor);
        }
      } else {
        setActiveProduct(boutiqueProducts[0]);
        setSelectedColor(boutiqueProducts[0].defaultColor);
      }

      // Also sync modal product if open
      if (selectedModalProduct) {
        const updatedModal = boutiqueProducts.find(p => p.id === selectedModalProduct.id);
        if (updatedModal) {
          setSelectedModalProduct(updatedModal);
        } else {
          setIsModalOpen(false);
          setSelectedModalProduct(null);
        }
      }
    } else {
      setActiveProduct(null);
      setSelectedModalProduct(null);
      setIsModalOpen(false);
    }
  }, [boutiqueProducts]);

  // Prevent background scrolling to avoid double scrollbars when modal is open
  React.useEffect(() => {
    if (isModalOpen || quickViewProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, quickViewProduct]);

  // Sync initialSearchQuery prop with local state
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (setInitialSearchQuery) {
      setInitialSearchQuery(val);
    }
  };

  // When clicking any card, we open the gorgeous focused modal overlay
  const handleProductSelect = (product: BoutiqueProduct, initialSize: TShirtSize = 'M') => {
    setActiveProduct(product);
    setSelectedColor(product.defaultColor);
    setSelectedSize(initialSize);
    setIsWishlisted(false);

    // Populate Modal Options in parallel for seamless display
    setSelectedModalProduct(product);
    setModalColor(product.defaultColor);
    setModalSize(initialSize);
    setIsModalWishlisted(false);
    setIsModalOpen(true);
    
    triggerToast(`Modèle ${product.name} ouvert en taille ${initialSize}`);
  };

  // Handler to add the t-shirt to the bag directly from inside the popup modal
  const handleAddToBagFromModal = () => {
    if (!selectedModalProduct) return;
    setIsAddingToBag(true);
    setTimeout(() => {
      const itemInBg: CartItem = {
        id: `cart-boutique-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        styleId: selectedModalProduct.id,
        styleName: selectedModalProduct.name,
        price: selectedModalProduct.price,
        color: modalColor,
        size: modalSize,
        customText: "",
        fontStyle: "modern",
        textColor: modalColor.textColor,
        quantity: 1,
        image: selectedModalProduct.image,
        video: selectedModalProduct.video
      };

      setCartItems(prev => {
        const existIdx = prev.findIndex(item => 
          item.styleId === itemInBg.styleId &&
          item.color.id === itemInBg.color.id &&
          item.size === itemInBg.size
        );
        if (existIdx > -1) {
          const upd = [...prev];
          upd[existIdx].quantity += 1;
          return upd;
        }
        return [...prev, itemInBg];
      });

      setIsAddingToBag(false);
      setIsModalOpen(false); // Close modal on success!
      setLastAddedItem(itemInBg);
      triggerToast(`Taille ${modalSize} au panier`, selectedModalProduct.image);
      setTimeout(() => setLastAddedItem(null), 2000);
    }, 500);
  };

  // Handler for sidebar purchase
  const handleAddToBag = () => {
    if (!activeProduct) return;
    setIsAddingToBag(true);
    setTimeout(() => {
      const itemInBg: CartItem = {
        id: `cart-boutique-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        styleId: activeProduct.id,
        styleName: activeProduct.name,
        price: activeProduct.price,
        color: selectedColor,
        size: selectedSize,
        customText: "",
        fontStyle: "modern",
        textColor: selectedColor.textColor,
        quantity: 1,
        image: activeProduct.image,
        video: activeProduct.video
      };

      setCartItems(prev => {
        const existIdx = prev.findIndex(item => 
          item.styleId === itemInBg.styleId &&
          item.color.id === itemInBg.color.id &&
          item.size === itemInBg.size
        );
        if (existIdx > -1) {
          const upd = [...prev];
          upd[existIdx].quantity += 1;
          return upd;
        }
        return [...prev, itemInBg];
      });

      setIsAddingToBag(false);
      setLastAddedItem(itemInBg);
      triggerToast(`Taille ${selectedSize} au panier`, activeProduct.image);
      setTimeout(() => setLastAddedItem(null), 2000);
    }, 500);
  };

  // Handler created specifically for the inline dynamic cart picker with size support
  const handleUpdateQtyForSize = (product: BoutiqueProduct, size: TShirtSize, change: number) => {
    setCartItems(prev => {
      const existIdx = prev.findIndex(item => 
        item.styleId === product.id &&
        item.color.id === product.defaultColor.id &&
        item.size === size
      );

      if (existIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existIdx].quantity + change;
        if (newQty <= 0) {
          triggerToast(`✕ ${product.name} (${size}) retiré du panier`);
          return updated.filter((_, idx) => idx !== existIdx);
        } else {
          updated[existIdx].quantity = newQty;
          triggerToast(change > 0 ? `✓ Quantité augmentée pour ${product.name} en ${size}` : `✓ Quantité diminuée pour ${product.name} en ${size}`);
          return updated;
        }
      } else if (change > 0) {
        const newItem: CartItem = {
          id: `cart-boutique-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          styleId: product.id,
          styleName: product.name,
          price: product.price,
          color: product.defaultColor,
          size: size,
          customText: "",
          fontStyle: "modern",
          textColor: product.defaultColor.textColor,
          quantity: 1,
          image: product.image,
          video: product.video
        };
        setLastAddedItem(newItem);
        setTimeout(() => setLastAddedItem(null), 2000);
        triggerToast(`Taille ${size} au panier`, product.image);
        return [...prev, newItem];
      }
      return prev;
    });
  };

  const getProductCartQty = (prod: BoutiqueProduct) => {
    return cartItems
      .filter(it => it.styleId === prod.id && it.color.id === prod.defaultColor.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredProducts = boutiqueProducts
    .filter(prod => {
      // 1. Filter by top category tabs
      if (activeTopTab === 'classic' && prod.category !== 'COLLECTION REGULAR') return false;
      if (activeTopTab === 'atelier' && !['COUP DE CŒUR ATELIER', 'MATIÈRE NOBLE'].includes(prod.category)) return false;
      if (activeTopTab === 'limited' && prod.category === 'COLLECTION REGULAR') return false;
      
      // 2. Filter by active horizontal subcategory filter
      if (activeFilter !== 'all') {
        const matchesRond = activeFilter === 'rond' && prod.name.toLowerCase().includes('rond');
        const matchesV = activeFilter === 'v' && prod.name.toLowerCase().includes('col v');
        const matchesBio = activeFilter === 'bio' && (
          prod.name.toLowerCase().includes('organique') || 
          (prod.description || '').toLowerCase().includes('biologique') || 
          prod.name.toLowerCase().includes('biliologique') || 
          prod.name.toLowerCase().includes('biologique')
        );
        const matchesPeigne = activeFilter === 'peigne' && (
          prod.name.toLowerCase().includes('peigné') || 
          (prod.description || '').toLowerCase().includes('peigné') || 
          (prod.tagline || '').toLowerCase().includes('peigné') || 
          prod.name.toLowerCase().includes('peigne')
        );
        
        if (!matchesRond && !matchesV && !matchesBio && !matchesPeigne) return false;
      }

      // 3. Filter by search query with safe optional checks
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesTagline = (prod.tagline || '').toLowerCase().includes(q);
        const matchesDesc = (prod.description || '').toLowerCase().includes(q);
        const matchesCat = (prod.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesTagline && !matchesDesc && !matchesCat) return false;
      }

      return true;
    })
    .sort((a, b) => (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-800'} min-h-screen pb-6 w-full font-sans antialiased transition-colors duration-500`}>
        
      {/* --- HEADER BAR (Now serving as Top Banner) --- */}
      <div className="w-full bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] pt-4 pb-4 px-2 sm:px-[1.5vw] shadow-md relative z-10">
        <div className="w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#8133f1] border border-white/30 shadow-xs transition-all active:scale-95 flex items-center justify-center"
              title="Retour Accueil"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 id="shop-main-logo" className="text-xl font-display font-black text-white tracking-tight flex items-center gap-1.5 uppercase drop-shadow-sm">
                <Sparkles className="w-4 h-4 text-white fill-white/80" />
                Boutique des T-Shirts
              </h1>
              <p className="text-[10px] text-white/90 font-mono tracking-widest uppercase drop-shadow-sm">
                L'excellence du prêt-à-porter haut de gamme
              </p>
            </div>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher une coupe, un tissu..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-white/10 backdrop-blur-md border border-white/30 focus:border-white text-white placeholder:text-white/70 rounded-full py-1.5 pl-3.5 pr-8 text-xs font-medium w-full sm:w-64 focus:outline-none focus:bg-white/20 transition-all shadow-xs"
            />
            {searchQuery ? (
              <button 
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-2 text-white/70 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-3.5 h-3.5 text-white absolute right-3 top-2.5" />
            )}
          </div>

        </div>
      </div>

      <div className="w-full flex flex-col gap-6 pt-6 px-2 sm:px-[1.5vw]">

        {/* --- DYNAMIC HORIZONTAL TABS (Mockup style selector) --- */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none border-b border-neutral-100 pb-3">
          {[
            { id: 'all', label: 'Toutes les coupes' },
            { id: 'classic', label: 'Collection Régulière' },
            { id: 'atelier', label: "Coupes d'Atelier" },
            { id: 'limited', label: 'Éditions Limitées' }
          ].map((tab) => {
            const isActive = activeTopTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTopTab(tab.id as any);
                  triggerToast(`Filtre : ${tab.label}`);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold font-display tracking-wide border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] text-white border-[#8133f1] shadow-sm' 
                    : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200/80 shadow-xs'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* --- MAIN FULL-WIDTH CONTAINER LAYOUT --- */}
        <div className="w-full flex flex-col gap-6">
            
            {/* Transparent layout to take the screen background color directly */}
            <div className="w-full">
              
              {/* Inside card top micro filter tabs */}
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-3 mb-6 overflow-x-auto scrollbar-none">
                {[
                  { id: 'all', label: 'Tout' },
                  { id: 'rond', label: 'Col Rond Essentiel' },
                  { id: 'v', label: 'Échancré Col V' },
                  { id: 'bio', label: 'Coton Organique 240g' },
                  { id: 'peigne', label: 'Fils Peignés Souples' }
                ].map((filter) => {
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setActiveFilter(filter.id as any);
                        triggerToast(`Catégorie : ${filter.label}`);
                      }}
                      className={`text-xs font-semibold pb-1.5 transition-all relative ${
                        isActive 
                          ? 'text-[#8133f1] font-bold' 
                          : 'text-neutral-450 hover:text-black'
                      }`}
                    >
                      {filter.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Grid representation of product catalog items from mockup - Pinterest layout and beautiful spacing */}
              <div id="shop-catalog-grid" className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3 sm:gap-6 w-full">
                {boutiqueProducts.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingBag className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-black uppercase">Votre boutique est vide</h3>
                    <p className="text-sm">Rendez-vous dans votre espace admin pour ajouter vos premiers modèles.</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-80 min-h-[300px]">
                    <Search className="w-10 h-10 text-neutral-450 mb-3 stroke-[1.5]" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-neutral-600">Aucun modèle trouvé</h3>
                    <p className="text-xs text-neutral-500 mt-1">Aucun modèle ne correspond à votre recherche "{searchQuery}".</p>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-4 px-4 py-1.5 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-[#00c4cc] to-[#8133f1] hover:opacity-90 shadow-sm active:scale-95 transition-all"
                      >
                        Effacer la recherche
                      </button>
                    )}
                  </div>
                ) : filteredProducts.map((prod, idx) => {
                    const isActive = activeProduct?.id === prod.id;
                    const isGoldBookmark = prod.bookmarkColor === 'gold';
                    
                    return (
                      <div 
                        key={prod.id}
                        onClick={() => handleProductSelect(prod)}
                        className="break-inside-avoid mb-4 sm:mb-6 group cursor-pointer flex flex-col gap-1.5 sm:gap-2.5 transition-all duration-355"
                      >
                        {/* Pinterest Tall Card Frame with zoom transitions & border rings on selected/active state */}
                        <motion.div 
                          initial="hidden"
                          whileHover="visible"
                          className={`w-full rounded-xl xs:rounded-2xl sm:rounded-[1.8rem] relative overflow-hidden transition-all duration-500 bg-neutral-100 ${
                          isActive 
                            ? 'ring-2 sm:ring-4 ring-[#8133f1] shadow-[0_22px_45px_rgba(227,74,62,0.25)]' 
                            : 'shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.15)] border border-neutral-200/20'
                        }`}>
                          
                          {!(prod.video && prod.video !== 'HEAVY_BASE64') && (
                            <img 
                              src={prod.image || `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&sig=${prod.id}`}
                              alt={prod.name}
                              loading="eager"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800";
                              }}
                              className="w-full h-auto block object-cover group-hover:scale-105 transition-all duration-700 ease-out select-none pointer-events-none" 
                            />
                          )}

                          {/* Rich High-Fashion Model video layered directly on top */}
                          {(prod.video && prod.video !== 'HEAVY_BASE64') ? (
                            <VideoPlayer 
                              src={prod.video} 
                              className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none pointer-events-none transition-opacity duration-300"
                            />
                          ) : null}

                          {/* Subtle elegant gradient overlay for readability and depth */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60 pointer-events-none" />
                          
                          {/* Floating Category/Duration Label Tag */}
                          {!(prod.video && prod.video !== 'HEAVY_BASE64') ? (
                            <div className="absolute top-1.5 left-1.5 sm:top-3.5 sm:left-3.5 bg-white/90 backdrop-blur-md px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[6.5px] sm:text-[8px] font-sans font-bold tracking-widest text-[#8133f1] shadow-3xs uppercase truncate max-w-[85%]">
                              {prod.category}
                            </div>
                          ) : (
                            <div className="absolute top-1.5 left-1.5 sm:top-3.5 sm:left-3.5 flex items-center gap-1.5 z-30">
                              {/* Video duration pill exactly matching the mockup */}
                              <div className="bg-white/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[7.5px] sm:text-[9.5px] font-sans font-extrabold tracking-tight text-neutral-900 shadow-3xs">
                                {prod.videoDuration || '0:05'}
                              </div>
                              {/* Category pill shifted */}
                              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[6.5px] sm:text-[8px] font-sans font-bold tracking-widest text-white/90 shadow-3xs uppercase truncate max-w-[100px]">
                                {prod.category}
                              </div>
                            </div>
                          )}

                          {/* Bookmark tag in top right, exactly like the mockup */}
                          {prod.isBoosted && (
                            <div className="absolute top-2 right-10 z-20 flex items-center gap-1 bg-amber-400 text-neutral-900 px-2 py-0.5 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/20">
                              <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" />
                              BOOST
                            </div>
                          )}
                          <div className="absolute top-0 right-1.5 sm:right-3.5 z-10 select-none pointer-events-none">
                            <svg 
                              width="12" 
                              height="16" 
                              viewBox="0 0 18 24" 
                              className={`transform drop-shadow-[0_2px_5px_rgba(0,0,0,0.15)] sm:scale-125 transition-all ${
                                isGoldBookmark 
                                  ? 'text-[#8133f1] fill-[#8133f1]' 
                                  : 'text-white/60 fill-white/40'
                              }`}
                            >
                              <path d="M0 0h18v24l-9-5.4L0 24V0z" />
                            </svg>
                          </div>
                          {/* Direct Cart Add sizes swatches overlay - Now with staggered "one-by-one" entrance animation */}
                          <motion.div 
                            variants={{
                              hidden: { opacity: 0, y: 15, scale: 0.95 },
                              visible: {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                transition: {
                                  staggerChildren: 0.12,
                                  delayChildren: 0.1,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 24
                                }
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex absolute inset-x-1 bottom-1 sm:inset-x-2.5 sm:bottom-2.5 px-1 py-1 sm:px-2 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20 flex-col items-center gap-0.5 sm:gap-1"
                          >
                            <motion.span 
                              variants={{
                                hidden: { opacity: 0, scale: 0.9 },
                                visible: { opacity: 1, scale: 1 }
                              }}
                              className="text-[7px] sm:text-[8.5px] font-bold text-neutral-400 tracking-wider uppercase font-mono"
                            >
                            </motion.span>
                            <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1 w-full">
                              {(['S', 'M', 'L', 'XL', 'XXL'] as TShirtSize[]).map((size) => (
                                <motion.button
                                  key={size}
                                  variants={{
                                    hidden: { opacity: 0, y: 12, scale: 0.5 },
                                    visible: { opacity: 1, y: 0, scale: 1 }
                                  }}
                                  whileHover={{ scale: 1.15, zIndex: 10 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateQtyForSize(prod, size, 1);
                                  }}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg border border-neutral-200 bg-white hover:bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] hover:text-white hover:border-[#8133f1] text-[9px] sm:text-[10px] font-display font-semibold flex items-center justify-center transition-all cursor-pointer shadow-3xs"
                                  title={`Ajouter taille ${size}`}
                                >
                                  {size}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        </motion.div>
 
                        {/* Pin info footer with premium details typography */}
                        <div className="flex flex-col items-center gap-1.5 px-2 mt-2 text-center w-full">
                          <div className="flex flex-col items-center gap-0.5 min-w-0 w-full">
                            <div className="flex items-center justify-center gap-1.5 w-full min-w-0 max-w-full">
                              <h4 className="font-display font-black text-[12px] text-neutral-900 leading-tight uppercase tracking-wider truncate">
                                {prod.name}
                              </h4>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickViewProduct(prod);
                                }}
                                className="bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 p-1 rounded-full border border-neutral-200/45 active:scale-90 transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 hover:scale-110"
                                title="Voir les prix, avis et autres"
                              >
                                <MoreHorizontal className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </div>
                            <p className="text-[9px] text-neutral-400 font-medium truncate w-full">
                              {prod.tagline}
                            </p>
                          </div>
                          <div className="inline-flex items-center justify-center bg-white border border-neutral-100 px-3 py-0.5 rounded-full shadow-3xs mt-1">
                            <span className="text-[11px] font-black text-neutral-900 font-mono">
                              {prod.price} FCFA
                            </span>
                          </div>

                          {/* Inline dynamic quantity controllers removed as requested */}
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>

            {/* --- BOTTOM FAVORITES & BENEFITS BLOCKS (Horizontal testimonials rows from visual blueprint) --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {[
                { title: "Coton Biologique", desc: "100% Organique", stat: "Sûr" },
                { title: "Teinture Eco", desc: "Sans toxines", stat: "Niveaux" },
                { title: "Fibres Robustes", desc: "Grammage 240g", stat: "Premium" },
                { title: "Service Durable", desc: "Expédié sous 24h", stat: "Atelier" }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-white/85 rounded-2xl p-3 border border-neutral-200/50 shadow-xs flex items-center gap-3 hover:bg-white transition-colors duration-200"
                >
                  {/* Circular placeholder mimicking the avatar/icon circles at the bottom */}
                  <div className="w-8 h-8 rounded-full bg-neutral-150 flex items-center justify-center shrink-0 border border-neutral-200/40 text-[10px] font-bold text-neutral-600 font-mono">
                    0{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-extrabold text-neutral-800 tracking-tight leading-none truncate">
                      {item.title}
                    </h5>
                    <span className="text-[9px] text-neutral-450 truncate block mt-0.5 font-mono">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>

      </div>

      {/* ================= PRODUCT DETAIL PAGE VIEW (Fullscreen transition for "Site Web" feel) ================= */}
      <AnimatePresence>
        {isModalOpen && selectedModalProduct && (
          <div className={`fixed inset-0 z-50 font-sans ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-white text-neutral-900'} overflow-hidden`}>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className={`${theme === 'dark' ? 'bg-neutral-950' : 'bg-white'} w-full h-full flex flex-col`}
            >
              {/* Top Storefront-style Navigation Bar */}
              <div className={`w-full ${theme === 'dark' ? 'bg-black/80 border-white/5' : 'bg-white/80 border-neutral-100'} backdrop-blur-md border-b px-4 sm:px-8 lg:px-[5vw] py-4 flex items-center justify-between sticky top-0 z-40`}>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className={`flex items-center gap-2.5 ${theme === 'dark' ? 'text-white hover:text-neutral-400' : 'text-neutral-800 hover:text-[#8133f1]'} font-display font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 active:scale-95 group`}
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5] transition-transform group-hover:-translate-x-1" />
                  Retour à la boutique
                </button>
                
                <div className={`hidden md:block font-display font-black text-xs sm:text-sm tracking-[0.3em] uppercase ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-900'} absolute left-1/2 -translate-x-1/2`}>
                  Fiche de Confection
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className={`relative p-2.5 rounded-full ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-neutral-100 hover:bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] hover:text-white'} transition-all active:scale-90 flex items-center justify-center group`}
                  >
                    <ShoppingBag className="w-5 h-5 stroke-[2] transition-colors" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] group-hover:bg-black text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-colors">
                        {cartItems.reduce((acc, it) => acc + it.quantity, 0)}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="p-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white transition-all active:scale-90 flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Page Content Scroll Container */}
              <div className={`overflow-y-auto flex-1 custom-scrollbar ${theme === 'dark' ? 'bg-neutral-900' : 'bg-[#F8F9FA]'}`}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-[5vw] py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              
                  {/* Left Column: Visual Showcase */}
                  <div className="lg:sticky lg:top-8 z-10 w-full mb-8 lg:mb-0">
                    <div className={`relative w-full rounded-[2.5rem] overflow-hidden ${theme === 'dark' ? 'bg-black border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-neutral-200/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)]'} group/modal-img transition-all`}>
                      
                      {selectedModalProduct.image && !selectedModalProduct.video && (
                        <img 
                          src={selectedModalProduct.image} 
                          alt={selectedModalProduct.name}
                          loading="eager"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800";
                          }}
                          className="w-full h-auto block object-cover select-none pointer-events-none transition-transform duration-1000 ease-out group-hover/modal-img:scale-105"
                        />
                      )}

                      {selectedModalProduct.video ? (
                        <VideoPlayer 
                          src={selectedModalProduct.video} 
                          className="w-full h-auto block object-cover select-none pointer-events-none transition-transform duration-1000 ease-out group-hover/modal-img:scale-105 transition-opacity duration-300"
                        />
                      ) : null}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-8 left-8 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-[10px] font-display font-black tracking-widest shadow-xl border border-white/10 uppercase">
                        <Check className="w-4 h-4 text-[#ECD06F] stroke-[3]" />
                        Qualité Atelier
                      </div>



                      <div className="absolute bottom-10 right-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-white/50">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1]" />
                          <span className="w-2 h-2 rounded-full bg-neutral-200" />
                          <span className="w-2 h-2 rounded-full bg-neutral-200" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Specifications */}
                  <div className="flex flex-col gap-10 py-4">
                    <div className="flex flex-col gap-8">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-[#E8F3FF] text-[#8133f1] text-[10px] font-black tracking-[0.2em] uppercase rounded-md font-mono">
                            {selectedModalProduct.category}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-widest">
                            ID: #{selectedModalProduct.id.slice(0, 8)}
                          </span>
                        </div>
                        
                        <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-neutral-950 leading-[0.95] uppercase">
                          {selectedModalProduct.name}
                        </h2>
                        
                        <div className="flex items-center gap-3 mt-6">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="w-5 h-5 fill-[#ECD06F] text-[#ECD06F]" />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-neutral-900 border-l border-neutral-200 pl-3">
                            4.9 (130 avis)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-display font-black text-[#8133f1] tracking-tighter">
                          {selectedModalProduct.price} <span className="text-2xl ml-1">FCFA</span>
                        </span>
                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 shadow-sm">
                          Expédition Immédiate
                        </div>
                      </div>

                <div className={`p-6 ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-150'} rounded-3xl border shadow-sm`}>
                        <h3 className={`text-xs font-black ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'} uppercase tracking-[0.2em] mb-4 flex items-center gap-2`}>
                          <Sparkles className="w-4 h-4 text-[#8133f1]" />
                          Détails de Confection
                        </h3>
                        <p className={`${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'} text-base leading-relaxed font-medium`}>
                          {selectedModalProduct.description || selectedModalProduct.tagline}
                        </p>
                        {!selectedModalProduct.description && (
                          <p className="text-neutral-400 italic text-sm mt-4 leading-relaxed">
                            Notre atelier a sélectionné les meilleures fibres pour garantir une tenue impeccable et un confort thermique idéal sous toutes les saisons.
                          </p>
                        )}
                      </div>

                      <div className="space-y-12">
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                              Taillage (Coupe Unisexe)
                            </span>
                            <button className="text-[10px] font-black text-[#8133f1] uppercase tracking-widest hover:underline">
                              Guide des tailles
                            </button>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-2">
                            {(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as TShirtSize[]).map((size) => {
                              const isSel = modalSize === size;
                              return (
                                <button
                                  key={size}
                                  onClick={() => {
                                    setModalSize(size);
                                    triggerToast(`Taille ${size} au panier`, selectedModalProduct?.image);
                                  }}
                                  className={`h-14 rounded-2xl border-2 font-display font-black text-sm tracking-wider transition-all flex items-center justify-center ${
                                    isSel 
                                      ? 'bg-neutral-950 border-neutral-950 text-white shadow-lg -translate-y-1' 
                                      : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-100'
                                  }`}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-8">
                        <button
                          onClick={handleAddToBagFromModal}
                          disabled={isAddingToBag}
                          className="flex-1 h-16 bg-gradient-to-r from-[#00c4cc] via-[#13a8d9] to-[#8133f1] hover:bg-black text-white rounded-2xl shadow-[0_15px_40px_-5px_rgba(129,51,241,0.3)] hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.3)] transition-all active:scale-95 flex items-center justify-center group"
                        >
                          <ShoppingBag className="w-6 h-6 transition-transform group-hover:scale-110" />
                        </button>

                        <button
                          onClick={() => {
                            setIsModalWishlisted(!isModalWishlisted);
                            triggerToast(isModalWishlisted ? "Retiré des favoris" : "Ajouté aux favoris !");
                          }}
                          className={`flex-1 h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                            isModalWishlisted 
                              ? 'border-rose-100 bg-rose-50 text-rose-500 shadow-rose-200/50' 
                              : 'border-neutral-100 bg-white text-neutral-400 hover:border-neutral-200'
                          }`}
                        >
                          <Heart className={`w-6 h-6 stroke-[2.5] ${isModalWishlisted ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-center text-[10px] text-neutral-500 font-mono py-8 border-y border-neutral-100 mt-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-bold opacity-70">LIVRAISON 48H</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 border-x border-neutral-100">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <RotateCcw className="w-5 h-5 text-indigo-600" />
                          </div>
                          <span className="font-bold opacity-70">RETOUR OFFERT</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                          </div>
                          <span className="font-bold opacity-70">ORIGINE BIO</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= APERÇU RAPIDE DIALOG / POPOVER MODAL (Pinterest style "Prix et Avis et autres") ================= */}
        <AnimatePresence>
          {quickViewProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Dark glassmorphic backdrop overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQuickViewProduct(null)}
                className="absolute inset-0 bg-neutral-950/65 backdrop-blur-sm"
              />

              {/* Content card popup - Compact and sleek window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 30, stiffness: 450 }}
                className="relative w-full max-w-sm bg-white text-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-100/80 flex flex-col z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/50">
                  <h3 className="font-display font-black text-xs tracking-wider uppercase text-neutral-700">
                    Aperçu Rapide
                  </h3>
                  <button 
                    onClick={() => setQuickViewProduct(null)} 
                    className="p-1 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-950 transition-all cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Summary Block */}
                  <div className="flex gap-4">
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-100 shrink-0 shadow-3xs">
                      {quickViewProduct.image && (
                        <img 
                          src={quickViewProduct.image} 
                          alt={quickViewProduct.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800";
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h4 className="font-display font-black text-base text-neutral-900 leading-tight uppercase tracking-tight truncate">
                        {quickViewProduct.name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-semibold tracking-wide uppercase mt-0.5">
                        {quickViewProduct.tagline}
                      </p>
                      
                      {/* Price Tag */}
                      <div className="mt-2 text-md font-extrabold font-mono text-indigo-600">
                        {quickViewProduct.price} FCFA
                      </div>
                    </div>
                  </div>

                  {/* Rating Block */}
                  <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-100 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest font-mono">
                        Note moyenne
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-neutral-800 font-mono">
                          {quickViewProduct.stylePreset?.rating || 4.9} / 5
                        </span>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current stroke-[1.5]" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-500 font-bold font-mono">
                        {quickViewProduct.stylePreset?.reviewCount || 124} avis clients
                      </div>
                      <span className="text-[9px] text-emerald-600 font-black tracking-widest uppercase font-mono">
                        100% Vérifiés
                      </span>
                    </div>
                  </div>

                  {/* Description / Fabric */}
                  <div className="text-xs text-neutral-600 leading-relaxed">
                    <p className="line-clamp-2">
                      {quickViewProduct.description || quickViewProduct.stylePreset?.description || "Coupe premium ajustée avec des coutures renforcées d'id'afro."}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] text-neutral-400 font-medium">
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase font-mono">
                        {quickViewProduct.stylePreset?.fabrics || "100% Coton Organique"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Core CTA Button */}
                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-2">
                  <button
                    onClick={() => {
                      handleProductSelect(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-[11px] font-black tracking-wider uppercase bg-neutral-950 text-white hover:bg-neutral-900 transition-all active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                    Détails & Achat
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('customizer');
                      setQuickViewProduct(null);
                      triggerToast(`Modèle ${quickViewProduct.name} chargé !`);
                    }}
                    className="py-2.5 px-4 rounded-xl text-[11px] font-black tracking-wider uppercase bg-neutral-100 text-neutral-800 hover:bg-neutral-250 transition-all active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1.5 border border-neutral-200"
                  >
                    Personnaliser
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </motion.div>
    );
  }
