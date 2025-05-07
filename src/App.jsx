import { useState } from 'react';
import './App.css';
import BiteQuestLogo from './assets/BiteQuestLogo.png';

function App() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchType, setSearchType] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showCookingGuide, setShowCookingGuide] = useState(false);

  const handleSearch = async () => {
    if (searchType === 'materials') {
      try {
        // Search for recipes containing each ingredient
        const recipeSets = await Promise.all(
          ingredients.map(async (ingredient) => {
            const response = await fetch(
              `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`
            );
            const data = await response.json();
            return data.meals || [];
          })
        );

        // Find recipes that contain all ingredients
        const commonRecipes = recipeSets.reduce((common, currentSet) => {
          if (common.length === 0) return currentSet;
          return common.filter(recipe => 
            currentSet.some(currentRecipe => currentRecipe.idMeal === recipe.idMeal)
          );
        }, []);

        // Fetch detailed information for common recipes
        if (commonRecipes.length > 0) {
          const detailedRecipes = await Promise.all(
            commonRecipes.map(async (meal) => {
              const detailResponse = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
              );
              const detailData = await detailResponse.json();
              return detailData.meals[0];
            })
          );
          setRecipes(detailedRecipes);
        } else {
          setRecipes([]);
        }
      } catch (error) {
        console.error('Error searching recipes:', error);
        setRecipes([]);
      }
    } else {
      // Search by food name
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`
      );
      const data = await response.json();
      setRecipes(data.meals || []);
    }
  };

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseModal = () => {
    setSelectedRecipe(null);
    setCurrentStep(0);
    setShowCookingGuide(false);
  };

  const handleStart = () => {
    setShowSearch(true);
  };

  const handleReset = () => {
    setQuery('');
    setRecipes([]);
    setSelectedRecipe(null);
    setShowSearch(false);
    setSearchType(null);
    setIngredients([]);
    setCurrentIngredient('');
  };

  const handleSearchTypeSelect = (type) => {
    setSearchType(type);
  };

  const handleAddIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredientToRemove) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  const handleStartCooking = () => {
    setShowCookingGuide(true);
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    if (currentStep < getRecipeSteps().length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRecipeSteps = () => {
    if (!selectedRecipe) return [];
    return selectedRecipe.strInstructions
      .split('.')
      .filter(step => step.trim().length > 0)
      .map(step => step.trim() + '.');
  };

  return (
    <div className={`App ${recipes.length > 0 ? 'has-results' : ''}`}>
      {!showSearch ? (
        <div className="landing-page">
          <img
            src={BiteQuestLogo}
            alt="Recipe Search Logo"
            className="app-logo"
          />
          <p>Discover delicious recipes from around the world</p>
          <button className="start-button" onClick={handleStart}>
            Start Your Quest
          </button>
        </div>
      ) : !searchType ? (
        <div className="search-type-selection">
          <h2>How would you like to search?</h2>
          <div className="search-type-buttons">
            <button 
              className="search-type-button"
              onClick={() => handleSearchTypeSelect('materials')}
            >
              Search by Materials
            </button>
            <button 
              className="search-type-button"
              onClick={() => handleSearchTypeSelect('food')}
            >
              Search by Food
            </button>
          </div>
        </div>
      ) : (
        <>
          <img
            src={BiteQuestLogo}
            alt="Recipe Search Logo"
            className="app-logo"
            onClick={handleReset}
          />
          
          {searchType === 'materials' ? (
            <div className="ingredients-search">
              <h2>Enter your ingredients</h2>
              <div className="ingredients-input-container">
                <input
                  type="text"
                  placeholder="Type an ingredient and press Add"
                  value={currentIngredient}
                  onChange={(e) => setCurrentIngredient(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={handleAddIngredient}>Add</button>
              </div>
              
              <div className="ingredients-list">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-tag">
                    {ingredient}
                    <button 
                      className="remove-ingredient"
                      onClick={() => handleRemoveIngredient(ingredient)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {ingredients.length > 0 && (
                <button 
                  className="search-button"
                  onClick={handleSearch}
                >
                  Search Recipes
                </button>
              )}
            </div>
          ) : (
            <>
              <p>Search for recipes by name!</p>
              <input
                type="text"
                placeholder="Search by food name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={handleSearch}>Search</button>
            </>
          )}

          <div className="recipe-list">
            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <div
                  key={recipe.idMeal}
                  className="recipe-card"
                  onClick={() => handleRecipeClick(recipe)}
                >
                  <h3>{recipe.strMeal}</h3>
                  <img src={recipe.strMealThumb} alt={recipe.strMeal} />
                </div>
              ))
            ) : (
              query && <p className="loading">No recipes found.</p>
            )}
          </div>
        </>
      )}

      {selectedRecipe && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseModal}>×</button>

            <h2 className="modal-title">{selectedRecipe.strMeal}</h2>

            <img
              src={selectedRecipe.strMealThumb}
              alt={selectedRecipe.strMeal}
              style={{ width: "100%", borderRadius: "10px", marginBottom: "1rem" }}
            />

            <div className="modal-info">
              <strong>Ready in:</strong> ~30 minutes<br />
              <strong>Servings:</strong> ~2
            </div>

            <div className="ingredients-section">
              <h3>Ingredients</h3>
              <ul>
                {Array.from({ length: 20 }, (_, i) => {
                  const ingredient = selectedRecipe[`strIngredient${i + 1}`];
                  const measure = selectedRecipe[`strMeasure${i + 1}`];
                  return (
                    ingredient && ingredient.trim() !== "" && (
                      <li key={i}>{ingredient} - {measure}</li>
                    )
                  );
                })}
              </ul>
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{selectedRecipe.strCategory} | {selectedRecipe.strArea}</p>
            </div>

            {!showCookingGuide ? (
              <div className="cooking-guide-start">
                <h3>Ready to Cook?</h3>
                <button className="start-cooking-button" onClick={handleStartCooking}>
                  Let's Make This!
                </button>
              </div>
            ) : (
              <div className="cooking-steps">
                <h3>Step {currentStep + 1} of {getRecipeSteps().length}</h3>
                <div className="step-content">
                  <p>{getRecipeSteps()[currentStep]}</p>
                </div>
                <div className="step-navigation">
                  <button 
                    className="step-button"
                    onClick={handlePreviousStep}
                    disabled={currentStep === 0}
                  >
                    Previous Step
                  </button>
                  <button 
                    className="step-button"
                    onClick={handleNextStep}
                    disabled={currentStep === getRecipeSteps().length - 1}
                  >
                    {currentStep === getRecipeSteps().length - 1 ? 'Finish' : 'Next Step'}
                  </button>
                </div>
              </div>
            )}

            <div className="suggestions-section">
              <h3>You might also like:</h3>
              <p>{selectedRecipe.strTags || "N/A"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
