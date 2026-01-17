import {
  faBan,
  faCircle,
  faCircleDot,
  faSquare,
  faSquareCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";

import {
  Modal,
  NewButton,
  NewIcon,
  classnames,
} from "@thunderstore/cyberstorm";
import { PackageCategory } from "@thunderstore/dapper/types";

import "./PackageFilterModal.css";

interface FilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: PackageCategory[];
  categories: PackageCategory[];
  initialSelectedSection: string;
  initialSelectedCategories: string[];
  initialExcludedCategories: string[];
  initialIsNsfw: boolean;
  initialIsDeprecated: boolean;
  onApply: (
    section: string,
    categories: string[],
    excludedCategories: string[],
    nsfw: boolean,
    deprecated: boolean
  ) => void;
}

export const PackageFilterModal: React.FC<FilterProps> = ({
  open,
  onOpenChange,
  sections,
  categories,
  initialSelectedSection,
  initialSelectedCategories,
  initialExcludedCategories,
  initialIsNsfw,
  initialIsDeprecated,
  onApply,
}) => {
  const [selectedSection, setSelectedSection] = useState(
    initialSelectedSection
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSelectedCategories
  );
  const [excludedCategories, setExcludedCategories] = useState<string[]>(
    initialExcludedCategories
  );
  const [isNsfw, setIsNsfw] = useState(initialIsNsfw);
  const [isDeprecated, setIsDeprecated] = useState(initialIsDeprecated);

  useEffect(() => {
    if (open) {
      setSelectedSection(initialSelectedSection);
      setSelectedCategories(initialSelectedCategories);
      setExcludedCategories(initialExcludedCategories);
      setIsNsfw(initialIsNsfw);
      setIsDeprecated(initialIsDeprecated);
    }
  }, [
    open,
    initialSelectedSection,
    initialSelectedCategories,
    initialExcludedCategories,
    initialIsNsfw,
    initialIsDeprecated,
  ]);

  const handleApply = () => {
    onApply(
      selectedSection,
      selectedCategories,
      excludedCategories,
      isNsfw,
      isDeprecated
    );
    onOpenChange(false);
  };

  const handleReset = () => {
    setSelectedSection("");
    setSelectedCategories([]);
    setExcludedCategories([]);
    setIsNsfw(false);
    setIsDeprecated(false);
  };

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      // Currently Included -> Switch to Excluded
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
      setExcludedCategories([...excludedCategories, id]);
    } else if (excludedCategories.includes(id)) {
      // Currently Excluded -> Switch to Off
      setExcludedCategories(excludedCategories.filter((c) => c !== id));
    } else {
      // Currently Off -> Switch to Included
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleContent="Filters"
      footerContent={
        <div className="package-filter-modal__footer-content">
          <div className="package-filter-modal__footer-reset">
            <NewButton onClick={handleReset} csVariant="secondary">
              Reset all
            </NewButton>
          </div>
          <div className="package-filter-modal__footer-actions">
            <NewButton
              onClick={() => onOpenChange(false)}
              csVariant="secondary"
            >
              Cancel
            </NewButton>
            <NewButton onClick={handleApply} csVariant="primary">
              Done
            </NewButton>
          </div>
        </div>
      }
      contentClasses="package-filter-modal__container"
    >
      <div className="package-filter-modal__content">
        {/* Sections (Radio Group Style) */}
        <div className="package-filter-modal__column">
          <div className="package-filter-modal__title">Sections</div>
          <div className="package-filter-modal__list radio-group-list">
            <div
              className={classnames(
                "radio-group-item",
                selectedSection === ""
                  ? "radio-group-item--selected"
                  : "radio-group-item--unselected"
              )}
              onClick={() => setSelectedSection("")}
            >
              <span className="radio-group-item__label">All</span>
              <div className="radio-group-item__radio">
                {selectedSection !== "" && (
                  <NewIcon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faCircle} />
                  </NewIcon>
                )}
                {selectedSection === "" && (
                  <NewIcon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={faCircleDot} />
                  </NewIcon>
                )}
              </div>
            </div>
            {sections.map((section) => (
              <div
                key={section.id}
                className={classnames(
                  "radio-group-item",
                  selectedSection === section.id
                    ? "radio-group-item--selected"
                    : "radio-group-item--unselected"
                )}
                onClick={() => setSelectedSection(section.id)}
              >
                <span className="radio-group-item__label">{section.name}</span>
                <div className="radio-group-item__radio">
                  {selectedSection !== section.id && (
                    <NewIcon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faCircle} />
                    </NewIcon>
                  )}
                  {selectedSection === section.id && (
                    <NewIcon csMode="inline" noWrapper>
                      <FontAwesomeIcon icon={faCircleDot} />
                    </NewIcon>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories (Checkbox List Style) */}
        <div className="package-filter-modal__column">
          <div className="package-filter-modal__title">Categories</div>
          <div className="package-filter-modal__list checkbox-list">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const isExcluded = excludedCategories.includes(cat.id);

              return (
                <div
                  key={cat.id}
                  className={classnames(
                    "checkbox-list-item",
                    isSelected
                      ? "checkbox-list-item--checked"
                      : isExcluded
                        ? "checkbox-list-item--excluded"
                        : "checkbox-list-item--unchecked"
                  )}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span className="checkbox-list-item__label">
                    <div className="checkbox-list-item__icon">
                      <NewIcon csMode="inline" noWrapper>
                        <FontAwesomeIcon
                          icon={
                            isSelected
                              ? faSquareCheck
                              : isExcluded
                                ? faBan
                                : faSquare
                          }
                        />
                      </NewIcon>
                    </div>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags (Checkbox List Style) */}
        <div className="package-filter-modal__column">
          <div className="package-filter-modal__title">Tags</div>
          <div className="package-filter-modal__list checkbox-list">
            <div
              className={classnames(
                "checkbox-list-item",
                isNsfw
                  ? "checkbox-list-item--checked"
                  : "checkbox-list-item--unchecked"
              )}
              onClick={() => setIsNsfw(!isNsfw)}
            >
              <span className="checkbox-list-item__label">
                <div className="checkbox-list-item__icon">
                  <NewIcon csMode="inline" noWrapper>
                    <FontAwesomeIcon icon={isNsfw ? faSquareCheck : faSquare} />
                  </NewIcon>
                </div>
                NSFW
              </span>
            </div>
            <div
              className={classnames(
                "checkbox-list-item",
                isDeprecated
                  ? "checkbox-list-item--checked"
                  : "checkbox-list-item--unchecked"
              )}
              onClick={() => setIsDeprecated(!isDeprecated)}
            >
              <span className="checkbox-list-item__label">
                <div className="checkbox-list-item__icon">
                  <NewIcon csMode="inline" noWrapper>
                    <FontAwesomeIcon
                      icon={isDeprecated ? faSquareCheck : faSquare}
                    />
                  </NewIcon>
                </div>
                Deprecated
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
