import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../../API/api";
import { useAuth } from "./AuthState";
import { CartContext } from "./CartState";

function getGuestItems(key) {
  try {
    const savedItems = localStorage.getItem(key);
    const parsedItems = savedItems ? JSON.parse(savedItems) : [];
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch (error) {
    console.error(`Impossible de lire ${key} depuis le stockage local :`, error);
    return [];
  }
}

export default function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [syncError, setSyncError] = useState("");
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) {
      setIsReady(false);
      return undefined;
    }

    let cancelled = false;
    setIsReady(false);
    setSyncError("");

    if (!user) {
      setCartItems(getGuestItems("cartItems"));
      setFavorites(getGuestItems("favoritesItems"));
      setLoadedUserId(null);
      setIsReady(true);
      return () => {
        cancelled = true;
      };
    }

    setCartItems([]);
    setFavorites([]);

    fetch(`${API_URL}/api/user-data`, { credentials: "include" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Impossible de charger vos données.");
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setCartItems(Array.isArray(data.cartItems) ? data.cartItems : []);
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
        setLoadedUserId(user.id);
        setIsReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Erreur de chargement du panier et des favoris :", error);
        setSyncError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, userId]);

  useEffect(() => {
    if (!isReady || loadedUserId !== userId) return undefined;

    if (!user) {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      localStorage.setItem("favoritesItems", JSON.stringify(favorites));
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/api/user-data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ cartItems, favorites }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Impossible d’enregistrer vos données.");
        }

        if (!cancelled) setSyncError("");
      } catch (error) {
        if (cancelled) return;
        console.error("Erreur de sauvegarde du panier et des favoris :", error);
        setSyncError(error.message);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [cartItems, favorites, isReady, loadedUserId, user, userId]);

  const addToFavorites = useCallback((item) => {
    setFavorites((previous) =>
      previous.some((favorite) => favorite.id === item.id)
        ? previous
        : [...previous, item]
    );
  }, []);

  const removeFromFavorites = useCallback((id) => {
    setFavorites((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const increaseQuantity = useCallback((id) => {
    setCartItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }, []);

  const decreaseQuantity = useCallback((id) => {
    setCartItems((previous) =>
      previous.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const addToCart = useCallback((item) => {
    setCartItems((previous) => [...previous, { ...item, quantity: 1 }]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        addToFavorites,
        favorites,
        removeFromFavorites,
        isReady,
        syncError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
