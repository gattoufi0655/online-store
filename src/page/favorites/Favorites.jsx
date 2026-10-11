import React, { useContext } from 'react'
import { CartContext } from '../../components/context/CartState'
import PageTransition from '../../components/PageTransition'
import Product from '../../components/slideProducts/Product'




function Favorites() {
    const {favorites, isReady, syncError} = useContext(CartContext)

  return (
    <PageTransition >
        <div className="category_products FavoritesPage">
            <div className="container">
                <div className="top_slide">
                    <h2>Your Favorites</h2>
                </div>

                {syncError && <p role="alert">{syncError}</p>}
                {!isReady ? (
                    <p>Loading your favorites...</p>
                ) : favorites.length === 0 ? (
                    <p>No Favorites Products yet.</p>
                ) : (
                    <div className="products">
                        {favorites.map(item => (
                            <Product item={item} key={item.id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </PageTransition>
  )
}

export default Favorites