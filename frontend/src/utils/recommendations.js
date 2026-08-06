// Smart Context-Aware & User History Recommendation Engine for M Cube's Cafe

const BEVERAGE_SLUGS = ['mojito', 'fresh-juice', 'shakes', 'lassi', 'ice-cream', 'special-drinks', 'falooda', 'soda', 'hot-beverages'];
const SNACK_SLUGS = ['momos', 'burger', 'sandwich', 'tasty-bites', 'snacks', 'maggi', 'chats', 'noodles', 'rice'];

const getHistoryStorageKey = (userId) => userId ? `mcubes_order_history_user_${userId}` : 'mcubes_order_history_v1';
const getViewedStorageKey = (userId) => userId ? `mcubes_viewed_items_user_${userId}` : 'mcubes_viewed_items_v1';

/**
 * Save ordered item IDs and categories into localStorage history for a specific User ID
 * @param {Array} orderedItems - List of order item objects
 * @param {string|number} userId - The ID of the logged in user
 */
export function recordOrderHistory(orderedItems = [], userId = null) {
  try {
    const key = getHistoryStorageKey(userId);
    const raw = localStorage.getItem(key);
    const history = raw ? JSON.parse(raw) : { itemCounts: {}, categoryCounts: {}, totalOrders: 0 };
    
    history.totalOrders += 1;

    orderedItems.forEach(item => {
      const idStr = String(item.id || item.menu_item || item.menu_item_id);
      const cat = item.categorySlug || item.category_name || item.category || 'general';

      history.itemCounts[idStr] = (history.itemCounts[idStr] || 0) + (item.quantity || 1);
      history.categoryCounts[cat] = (history.categoryCounts[cat] || 0) + (item.quantity || 1);
    });

    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.warn('Could not save order history:', e);
  }
}

/**
 * Seed/sync user history from backend order records for a specific User ID
 * @param {string|number} userId
 * @param {Array} orders - List of order objects from /api/orders/my/
 */
export function syncUserBackendOrders(userId, orders = []) {
  if (!userId || !Array.isArray(orders)) return;
  try {
    const key = getHistoryStorageKey(userId);
    const history = { itemCounts: {}, categoryCounts: {}, totalOrders: orders.length };

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemIdStr = String(item.menu_item || item.menu_item_id || item.id);
          const cat = item.category_slug || item.category || 'general';
          const qty = item.quantity || 1;
          history.itemCounts[itemIdStr] = (history.itemCounts[itemIdStr] || 0) + qty;
          history.categoryCounts[cat] = (history.categoryCounts[cat] || 0) + qty;
        });
      }
    });

    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.warn('Could not sync backend order history:', e);
  }
}

/**
 * Record a menu item view for a specific User ID
 * @param {Object} item 
 * @param {string|number} userId
 */
export function recordItemView(item, userId = null) {
  try {
    if (!item || !item.id || !userId) return;
    const key = getViewedStorageKey(userId);
    const raw = localStorage.getItem(key);
    const viewed = raw ? JSON.parse(raw) : {};
    viewed[item.id] = (viewed[item.id] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(viewed));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Get user order history statistics from localStorage for a specific User ID
 * @param {string|number} userId
 */
export function getOrderHistoryStats(userId = null) {
  try {
    const key = getHistoryStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { itemCounts: {}, categoryCounts: {}, totalOrders: 0 };
  } catch (e) {
    return { itemCounts: {}, categoryCounts: {}, totalOrders: 0 };
  }
}

/**
 * Returns intelligent food recommendations combining Cart Context + User Order History.
 * ONLY RETURNS RECOMMENDATIONS IF USER IS LOGGED IN (userId IS PROVIDED).
 * @param {Array} cartItems - Current items in user's cart
 * @param {Array} allItems - All available menu items
 * @param {number} limit - Maximum number of recommendations to return
 * @param {string|number} userId - Logged-in user's unique ID
 * @returns {Array} List of recommended item objects with match reasons
 */
export function getSmartRecommendations(cartItems = [], allItems = [], limit = 4, userId = null) {
  // REQUIRE LOGIN: If user is not logged in (no userId), return empty array
  if (!userId) {
    return [];
  }

  if (!allItems || allItems.length === 0) return [];

  // Filter out items currently in cart
  const cartItemIds = new Set(cartItems.map(item => item.id));
  const availableItems = allItems.filter(item => !cartItemIds.has(item.id));

  if (availableItems.length === 0) return [];

  // Retrieve user history from localStorage for this specific User ID
  const history = getOrderHistoryStats(userId);
  const viewedKey = getViewedStorageKey(userId);
  const viewedRaw = localStorage.getItem(viewedKey);
  const viewedItems = viewedRaw ? JSON.parse(viewedRaw) : {};

  // Cart context
  const hasMainsOrSnacks = cartItems.some(item => 
    SNACK_SLUGS.includes(item.categorySlug) || 
    BEVERAGE_SLUGS.includes(item.categorySlug) === false
  );

  const hasBeverages = cartItems.some(item => 
    BEVERAGE_SLUGS.includes(item.categorySlug)
  );

  let scoredItems = availableItems.map(item => {
    let score = 0;
    let matchTag = "Chef's Pick for You ✨";

    const itemIdStr = String(item.id);
    const catSlug = item.categorySlug || '';

    // History-based score boost
    const timesOrdered = history.itemCounts[itemIdStr] || 0;
    const catOrderCount = history.categoryCounts[catSlug] || 0;
    const timesViewed = viewedItems[item.id] || 0;

    if (timesOrdered > 0) {
      score += 60 + (timesOrdered * 10);
      matchTag = 'Ordered Before 💖';
    } else if (catOrderCount > 0) {
      score += 40 + (catOrderCount * 5);
      matchTag = 'Based on Your Favorites ⭐';
    } else if (timesViewed > 0) {
      score += 25 + (timesViewed * 2);
      matchTag = 'Recently Viewed 👀';
    }

    // Bestseller boost
    if (item.is_bestseller) {
      score += 30;
      if (score < 40) matchTag = 'Top Bestseller 🔥';
    }

    // Smart pairing boost
    if (cartItems.length > 0) {
      const isBeverage = BEVERAGE_SLUGS.includes(catSlug);
      const isSnack = SNACK_SLUGS.includes(catSlug);

      if (hasMainsOrSnacks && isBeverage) {
        score += 45;
        if (timesOrdered === 0) matchTag = 'Perfect Drink Pair 🍹';
      } else if (hasBeverages && isSnack) {
        score += 45;
        if (timesOrdered === 0) matchTag = 'Pairs Great 🍔';
      }
    } else if (score === 0) {
      // Empty cart - boost high-value popular items
      if (['momos', 'shakes', 'mojito', 'burger'].includes(catSlug)) {
        score += 20;
        matchTag = 'Recommended for You';
      }
    }

    // Deterministic hash variation
    const nameHash = item.name.length % 7;
    score += nameHash;

    return {
      ...item,
      recommendationScore: score,
      matchTag
    };
  });

  // Sort descending by recommendationScore
  scoredItems.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scoredItems.slice(0, limit);
}

