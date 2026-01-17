import {
  faCircle,
  faCircleDot,
  faSquare,
  faSquareCheck,
  faSquareXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import { NewButton } from "@thunderstore/cyberstorm";
import { PackageCategory } from "@thunderstore/dapper/types";

import "./PackageFilterDropdown.css";

interface FilterProps {
  sections: PackageCategory[];
  categories: PackageCategory[];
  selectedSection: string;
  selectedCategories: string[];
  isNsfw: boolean;
  isDeprecated: boolean;
  onSelectSection: (id: string) => void;
  onToggleCategory: (id: string) => void;
  onToggleNsfw: () => void;
  onToggleDeprecated: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const PackageFilterDropdown: React.FC<FilterProps> = ({
  sections,
  categories,
  selectedSection,
  selectedCategories,
  isNsfw,
  isDeprecated,
  onSelectSection,
  onToggleCategory,
  onToggleNsfw,
  onToggleDeprecated,
  onReset,
  onClose,
}) => {
  return (
    <div className="package-filter-dropdown">
      <div className="package-filter-dropdown__content">
        {/* Sections */}
        <div className="package-filter-dropdown__column">
          <div className="package-filter-dropdown__title">Sections</div>
          <div className="package-filter-dropdown__list">
            <div
              className={`package-filter-item ${
                selectedSection === "" ? "package-filter-item--active" : ""
              }`}
              onClick={() => onSelectSection("")}
            >
              <span className="package-filter-item__label">All</span>
              <div className="package-filter-item__icon">
                <FontAwesomeIcon
                  icon={selectedSection === "" ? faCircleDot : faCircle}
                />
              </div>
            </div>
            {sections.map((section) => (
              <div
                key={section.id}
                className={`package-filter-item ${
                  selectedSection === section.id
                    ? "package-filter-item--active"
                    : ""
                }`}
                onClick={() => onSelectSection(section.id)}
              >
                <span className="package-filter-item__label">
                  {section.name}
                </span>
                <div className="package-filter-item__icon">
                  <FontAwesomeIcon
                    icon={
                      selectedSection === section.id ? faCircleDot : faCircle
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="package-filter-dropdown__column">
          <div className="package-filter-dropdown__title">Categories</div>
          <div className="package-filter-dropdown__list">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  className={`package-filter-item ${
                    isSelected ? "package-filter-item--active" : ""
                  }`}
                  onClick={() => onToggleCategory(cat.id)}
                >
                  <span className="package-filter-item__label">{cat.name}</span>
                  <div className="package-filter-item__icon">
                    <FontAwesomeIcon
                      icon={isSelected ? faSquareCheck : faSquare}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="package-filter-dropdown__column">
          <div className="package-filter-dropdown__title">Tags</div>
          <div className="package-filter-dropdown__list">
            <div
              className={`package-filter-item ${
                isNsfw ? "package-filter-item--active" : ""
              }`}
              onClick={onToggleNsfw}
            >
              <span className="package-filter-item__label">NSFW</span>
              <div className="package-filter-item__icon">
                <FontAwesomeIcon icon={isNsfw ? faSquareCheck : faSquare} />
              </div>
            </div>
            <div
              className={`package-filter-item ${
                isDeprecated ? "package-filter-item--active" : ""
              }`}
              onClick={onToggleDeprecated}
            >
              <span className="package-filter-item__label">Deprecated</span>
              <div className="package-filter-item__icon">
                <FontAwesomeIcon
                  icon={isDeprecated ? faSquareCheck : faSquare}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="package-filter-dropdown__footer">
        <NewButton onClick={onReset} csVariant="secondary" csSize="small">
          Reset all
        </NewButton>
        <NewButton
          onClick={onClose}
          csVariant="primary" // "accent" in design is usually primary/success
          csSize="small"
        >
          Done
        </NewButton>
      </div>
    </div>
  );
};
