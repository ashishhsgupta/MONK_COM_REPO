import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../style/index.css";
import { FaPencilAlt, FaSearch } from "react-icons/fa";
import { RxDragHandleDots2 } from "react-icons/rx";
import { Modal } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Products from "./data";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemType = {
  SECTION: "section",
  VARIANT: "variant",
};

const DraggableVariant = ({ variant, index, moveVariant, children }) => {
  const [, drag] = useDrag(() => ({
    type: ItemType.VARIANT,
    item: { index },
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemType.VARIANT,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveVariant(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  }));

  return <div ref={(node) => drag(drop(node))}>{children}</div>;
};

//section draggable
const ItemTypes = {
  SECTION: "section",
};

const DraggableSection = ({ section, index, moveSection, children }) => {
  const [, drag] = useDrag(() => ({
    type: ItemTypes.SECTION,
    item: { index },
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.SECTION,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveSection(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  }));
  return <div ref={(node) => drag(drop(node))}>{children}</div>;
};

const ProductList = () => {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [checkedProducts, setCheckedProducts] = useState({});
  const [productSections, setProductSections] = useState([
    {
      showDiscountFields: false,
      discountType: "%",
      discountValue: "",
      selectedItems: [],
      variantVisibility: {}, // Section-specific visibility
    },
  ]);

  const openModel = () => {
    const productData = Products || [];
    setProducts(productData);
    setFilteredProducts(productData); // Initialize filteredProducts with all products
    setIsModelOpen(true);
  };

  const closeModel = () => {
    setIsModelOpen(false);
    setSearchTerm(""); // Clear search term when modal is closed
  };

  const handleSearchInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Filter products based on search term
    const filtered = products.filter((product) =>
      product.title.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Count of selected products
  const selectedProductCount = Object.keys(checkedProducts).filter(
    (productId) =>
      checkedProducts[productId]?.allSelected ||
      Object.values(checkedProducts[productId]?.variants || {}).some(
        (isSelected) => isSelected
      )
  ).length;

  const handleMainCheckboxChange = (productId) => {
    const isSelected = checkedProducts[productId]?.allSelected || false;

    setCheckedProducts((prevChecked) => ({
      ...prevChecked,
      [productId]: {
        allSelected: !isSelected,
        variants: prevChecked[productId]?.variants
          ? Object.fromEntries(
              Object.keys(prevChecked[productId].variants).map((variantId) => [
                variantId,
                !isSelected,
              ])
            )
          : Object.fromEntries(
              products
                .find((product) => product.id === productId)
                .variants.map((variant) => [variant.id, !isSelected])
            ),
      },
    }));
  };

  const handleVariantCheckboxChange = (productId, variantId) => {
    setCheckedProducts((prevChecked) => ({
      ...prevChecked,
      [productId]: {
        allSelected: false,
        variants: {
          ...prevChecked[productId]?.variants,
          [variantId]: !prevChecked[productId]?.variants?.[variantId],
        },
      },
    }));
  };

  const handleAddItemClick = (sectionIndex) => {
    const selected = products
      .filter((product) =>
        Object.values(checkedProducts[product.id]?.variants || {}).some(
          (isSelected) => isSelected
        )
      )
      .map((product) => ({
        ...product,
        variants: product.variants.filter(
          (variant) => checkedProducts[product.id]?.variants?.[variant.id]
        ),
      }));

    setProductSections((prevSections) =>
      prevSections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              selectedItems: [...section.selectedItems, ...selected],
              variantVisibility: {
                ...section.variantVisibility,
                ...Object.fromEntries(
                  selected.map((item) => [item.id, false]) // Initialize visibility as false
                ),
              },
            }
          : section
      )
    );

    closeModel();
  };

  const addNewProductSection = () => {
    setProductSections((prevSections) => [
      ...prevSections,
      {
        showDiscountFields: false,
        discountType: "%",
        discountValue: "",
        selectedItems: [],
        variantVisibility: {}, 
      },
    ]);
  };

  const handleDiscountButtonClick = (index) => {
    setProductSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, showDiscountFields: true } : section
      )
    );
  };

  const handleDiscountTypeChange = (e, index) => {
    const newType = e.target.value;
    setProductSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, discountType: newType } : section
      )
    );
  };

  const handleDiscountValueChange = (e, index) => {
    const newValue = e.target.value;
    setProductSections((prevSections) =>
      prevSections.map((section, i) =>
        i === index ? { ...section, discountValue: newValue } : section
      )
    );
  };

  const toggleVariantVisibility = (sectionIndex, itemId) => {
    if (!itemId) {
      console.error("Item ID is undefined");
      return;
    }
    setProductSections((prevSections) =>
      prevSections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              variantVisibility: {
                ...section.variantVisibility,
                [itemId]: !section.variantVisibility[itemId],
              },
            }
          : section
      )
    );
  };

  const moveSection = (fromIndex, toIndex) => {
    setProductSections((prevSections) => {
      const updatedSections = [...prevSections];
      const [movedSection] = updatedSections.splice(fromIndex, 1);
      updatedSections.splice(toIndex, 0, movedSection);
      return updatedSections;
    });
  };

  const moveVariant = (sectionIndex, fromIndex, toIndex) => {
    setProductSections((prevSections) =>
      prevSections.map((section, i) => {
        if (i === sectionIndex) {
          // Find the item with variants in this section
          const updatedItems = [...section.selectedItems];
          const itemIndex = updatedItems.findIndex(
            (item) => item.variants && item.variants.length > fromIndex
          );

          if (itemIndex !== -1) {
            const updatedItem = { ...updatedItems[itemIndex] };
            const updatedVariants = [...updatedItem.variants];

            // Reorder the variants
            const [movedVariant] = updatedVariants.splice(fromIndex, 1);
            updatedVariants.splice(toIndex, 0, movedVariant);

            // Replace the item in the section
            updatedItem.variants = updatedVariants;
            updatedItems[itemIndex] = updatedItem;

            return { ...section, selectedItems: updatedItems };
          }
        }

        return section; // Return unchanged sections
      })
    );
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="product-list">
          <h2 className="product-heading">Add Product</h2>

          {productSections.map((section, index) => (
            <DraggableSection
              key={index}
              section={section}
              index={index}
              moveSection={moveSection}
            >
              <div className="add-product" key={index}>
                <span>
                  <RxDragHandleDots2
                    style={{ width: "30px", height: "30px", cursor: "pointer" }}
                  />
                  {index + 1}
                </span>
                <div className="discount">
                  <div className="edit-btn">
                    <div className="input-field">
                      <input
                        className="input-value"
                        type="text"
                        value="Select Product"
                        readOnly
                      />
                      <button onClick={openModel} className="edit-btn-btn">
                        <FaPencilAlt className="icon" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="variant-flex">
                  <div className="discount-btn-main">
                    <div className="discount-btn">
                      {!section.showDiscountFields && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleDiscountButtonClick(index)}
                        >
                          Add Discount
                        </button>
                      )}
                    </div>

                    {section.showDiscountFields && (
                      <div className="discount-fields">
                        <input
                          type="text"
                          placeholder="0"
                          value={section.discountValue}
                          onChange={(e) => handleDiscountValueChange(e, index)}
                          className="discount-input"
                        />
                        <select
                          value={section.discountType}
                          onChange={(e) => handleDiscountTypeChange(e, index)}
                          className="discount-select"
                        >
                          <option value="%">%</option>
                          <option value="flat">Flat Off</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="visibility-variant">
                    {section.selectedItems.map((item, itemIndex) => (
                      <div key={item.id} className="selected-product">
                        <div className="variant-link-main">
                          <Link
                            onClick={() =>
                              toggleVariantVisibility(index, item.id)
                            }
                            id="product-add-btn"
                          >
                            {section.variantVisibility[item.id]
                              ? "Hide"
                              : "Show"}{" "}
                            Variants
                          </Link>
                        </div>
                        {section.variantVisibility[item.id] && (
                          <div className="internal-variant">
                            {item.variants?.map((variant, variantIndex) => (
                              <DraggableVariant
                                key={variant?.id || variantIndex} 
                                variant={variant}
                                index={variantIndex}
                                moveVariant={(from, to) =>
                                  moveVariant(index, from, to)
                                }
                              >
                                {variant ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      marginLeft: "-90px",
                                    }}
                                  >
                                    <span id="drag-variants">
                                      <RxDragHandleDots2
                                        style={{
                                          width: "20px",
                                          height: "20px",
                                          cursor: "pointer",
                                        }}
                                        className="dot-variant"
                                      />
                                    </span>
                                    <span>
                                      <p className="selected-variant">
                                        {variant.title}
                                      </p>
                                    </span>
                                  </div>
                                ) : (
                                  <p>Variant data is missing.</p>
                                )}
                              </DraggableVariant>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DraggableSection>
          ))}

          <div className="product-add-btn">
            <button className="btn-btn-light" onClick={addNewProductSection}>
              Add Product
            </button>
          </div>
        </div>
      </DndProvider>
      <Modal
        show={isModelOpen}
        onHide={closeModel}
        centered
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton className="border-0">
          <h4>Add Product</h4>
        </Modal.Header>
        <hr />
        <Modal.Body>
          <div className="form-group has-search">
            <span className="form-control-feedback">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by product"
              value={searchTerm}
              onChange={handleSearchInputChange}
            />
          </div>

          {/* display filtered produt */}
          <div className="product-list">
            <div className="product-cards">
              {filteredProducts.length === 0 ? (
                <p>No product found</p>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="products-card">
                    <div className="check-inside-main">
                      <div className="main-checkbox">
                        <input
                          type="checkbox"
                          checked={
                            checkedProducts[product.id]?.allSelected || false
                          }
                          onChange={() => handleMainCheckboxChange(product.id)}
                        />
                      </div>
                      <div className="main-img">
                        <img
                          src={product.image.src}
                          alt="img"
                          style={{ width: "70px", height: "70px" }}
                        />
                      </div>
                      <div className="main-title">
                        <h6>{product.title}</h6>
                      </div>
                    </div>
                    <hr />
                    <div>
                      {product.variants &&
                        product.variants.map((variant) => (
                          <p key={variant.id} className="variant-checkbox">
                            <input
                              type="checkbox"
                              checked={
                                checkedProducts[product.id]?.variants?.[
                                  variant.id
                                ] || false
                              }
                              onChange={() =>
                                handleVariantCheckboxChange(
                                  product.id,
                                  variant.id
                                )
                              }
                            />
                            <span className="model-variant-item">
                              {variant.title}
                            </span>
                            <span className="model-varial-price">
                              ₹ {variant.price}
                            </span>
                          </p>
                        ))}
                      <hr />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "none" }}>
          <p className="product-count">
            {selectedProductCount} product selected
          </p>
          <Button variant="secondary" onClick={closeModel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleAddItemClick(productSections.length - 1)}
          >
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProductList;
