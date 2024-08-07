import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Modal from "react-modal";
import {
  getCreateFormFridgeInstance,
  createShoppingList,
  deleteShoppingList,
} from "../../Api";
import { Trash } from "react-bootstrap-icons";

function ShoppingListSummary({
  allShoppingLists,
  allItems,
  onShoppingListUpdate,
  onShoppingListAdd,
  onShoppingListDelete,
}) {
  const [ingredientOptions, setIngredientOptions] = useState({
    ingredient_list: [],
  });
  const [shoppingListCreateForm, setShoppingListCreateForm] = useState({
    ingredient: "",
    possess: false,
  });
  const [selectedAdd, setSelectedAdd] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [checkedItems, setCheckedItems] = useState(() => {
    const saved = localStorage.getItem("checkedItems");
    return saved ? JSON.parse(saved) : {};
  });
  const [statusMessage, setStatusMessage] = useState(""); // 상태 메시지 추가
  const [favoriteItems] = useState(() => {
    const favorite = localStorage.getItem("favoriteItems");
    return favorite ? JSON.parse(favorite) : {};
  });

  useEffect(() => {
    getCreateFormFridgeInstance()
      .then((res) => {
        setIngredientOptions(res.data);
        console.log("Fetch Shopping List Creating Form");
      })
      .catch((error) => {
        console.error("Error fetching shopping list create form:", error);
      });
  }, []);

  const handleOpenModal = () => {
    setSelectedAdd(true);
  };

  const handleCloseModal = () => {
    setSelectedAdd(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShoppingListCreateForm({ ...shoppingListCreateForm, [name]: value });

    if (name === "ingredient") {
      const selectedIngredient = ingredientOptions.ingredient_list.find(
        (ingredient) => ingredient._id === value
      );
      if (selectedIngredient) {
        setShoppingListCreateForm((prevFormData) => ({
          ...prevFormData,
          possess: true,
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createShoppingListData(shoppingListCreateForm);
  };

  const createShoppingListData = (form) => {
    createShoppingList(form)
      .then((res) => {
        console.log("Shopping List created", res.data);
        setShoppingListCreateForm({
          ingredient: "",
          possess: false,
        });
        onShoppingListAdd(res.data);
        handleCloseModal();
      })
      .catch((error) => {
        console.error("Error creating shopping list item:", error);
      });
  };

  const addNecessaryItems = async () => {
    setStatusMessage("Processing...");
    const shoppingListsIngredientIds = allShoppingLists.map(
      (list) => list.ingredient && list.ingredient._id
    );
    const allItemsIngredientIds = allItems.map((item) => item.ingredient._id);
    const allBadItemsIngredientIds = allItems
      .filter((item) => item.status === "Dying" || item.status === "Dead")
      .map((item) => item.ingredient._id);
    let added = false;

    for (const ingredientId of Object.keys(favoriteItems)) {
      const ingredient = favoriteItems[ingredientId];
      console.log(ingredient);
      if (
        !shoppingListsIngredientIds.includes(ingredient._id) &&
        (!allItemsIngredientIds.includes(ingredient._id) ||
          allBadItemsIngredientIds.includes(ingredient._id))
      ) {
        const shoppingListDataForm = {
          ingredient: ingredient._id,
          possess: false,
        };
        await createShoppingListData(shoppingListDataForm);
        added = true;
      }
    }

    if (!added) {
      setStatusMessage("No items to add");
    } else {
      setStatusMessage("Completed!");
    }
    setTimeout(() => setStatusMessage(""), 1000); // 2초 후 상태 메시지 숨기기
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const onDeleteConfirm = () => {
    deleteShoppingListData(itemToDelete._id);
  };

  const deleteShoppingListData = async (id) => {
    await deleteShoppingList(id)
      .then((res) => {
        console.log("Shopping List deleted:", res.data);
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        onShoppingListDelete(id);
        const newCheckedItems = { ...checkedItems };
        delete newCheckedItems[id];
        setCheckedItems(newCheckedItems);
        localStorage.setItem("checkedItems", JSON.stringify(newCheckedItems));
      })
      .catch((error) => {
        console.error("Error deleting shopping list:", error);
      });
  };

  const handleCheckboxChange = (id) => {
    setCheckedItems((prevState) => {
      const newState = {
        ...prevState,
        [id]: !prevState[id],
      };
      localStorage.setItem("checkedItems", JSON.stringify(newState));
      return newState;
    });
  };

  const deleteCheckedItems = async () => {
    setStatusMessage("Processing...");
    const deletePromises = Object.keys(checkedItems).map((key) => {
      if (checkedItems[key]) {
        return deleteShoppingListData(key);
      }
      return Promise.resolve();
    });
    await Promise.all(deletePromises);
    setStatusMessage("Completed!");
    setTimeout(() => setStatusMessage(""), 1000); // 2초 후 상태 메시지 숨기기
  };

  const isNecessary = (ingredient) => {
    return favoriteItems[ingredient._id] ? "R" : "";
  };

  return (
    <div className="home-shop-container">
      <div className="home-heading">
        <Link to="/api/shoppinglist">
          <h2>Shopping List</h2>
        </Link>
        <button className="btn btn-add" onClick={handleOpenModal}>
          + Add
        </button>
      </div>
      {statusMessage && <div className="status-message">{statusMessage}</div>}
      {allShoppingLists && allShoppingLists.length > 0 ? (
        <ul className="home-shop-list">
          {allShoppingLists.map((list, index) => (
            <li key={index}>
              <input
                type="checkbox"
                id={`custom-checkbox-${index}`}
                className="custom-checkbox"
                checked={!!checkedItems[list._id]}
                onChange={() => handleCheckboxChange(list._id)}
              />
              <label
                htmlFor={`custom-checkbox-${index}`}
                style={{
                  textDecoration: checkedItems[list._id]
                    ? "line-through"
                    : "none",
                }}
              >
                {list.ingredient && (
                  <>
                    <span>{list.ingredient.name}</span>
                    <span className="home-shop-r">
                      {isNecessary(list.ingredient)}
                    </span>
                  </>
                )}
              </label>
              <Trash
                size={12}
                className="trash-btn"
                onClick={() => handleDeleteClick(list)}
                style={{ cursor: "pointer" }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-content">There is no ingredient</div>
      )}

      <div className="home-shop-bottom">
        <button className="btn btn-auto-add" onClick={addNecessaryItems}>
          Add Favorites
        </button>
        <button className="btn btn-clear" onClick={deleteCheckedItems}>
          Clear
        </button>
      </div>

      <Modal
        isOpen={selectedAdd}
        onRequestClose={handleCloseModal}
        contentLabel="Add Shopping List Item"
        className="Modal modal-add-shop"
        overlayClassName="Overlay"
      >
        <div className="modal-heading">
          <h2>Add Shopping List</h2>
          <button
            type="button"
            className="close-btn"
            onClick={handleCloseModal}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Ingredient:
            <select
              name="ingredient"
              value={shoppingListCreateForm.ingredient}
              onChange={handleChange}
              required
            >
              <option value="">Select an ingredient</option>
              {ingredientOptions.ingredient_list.map((ingredient) => (
                <option key={ingredient._id} value={ingredient._id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="confirm-btn">
            Add
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Confirmation"
        className="Modal modal-add-shop"
        overlayClassName="Overlay"
      >
        <h2 style={{ paddingTop: "20px" }}>Delete Confirmation</h2>
        <p>Are you sure you want to delete this item?</p>
        <div className="button-container">
          <button
            className="confirm-btn"
            style={{ backgroundColor: "red" }}
            onClick={onDeleteConfirm}
          >
            Yes, delete
          </button>
          <button
            className="confirm-btn"
            style={{ backgroundColor: "darkgray" }}
            onClick={closeDeleteModal}
          >
            No, cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ShoppingListSummary;
