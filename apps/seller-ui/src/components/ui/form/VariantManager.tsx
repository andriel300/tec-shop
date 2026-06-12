'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  X,
  Trash2,
  RefreshCw,
  Info,
  Ruler,
  Palette,
  Layers,
  Scissors,
  HardDrive,
  Cpu,
  Package,
  Zap,
  Plug,
  Scale,
  ArrowLeftRight,
  ArrowUpDown,
  Circle,
  Wind,
  Droplets,
  Tag,
  Hash,
  Target,
  Hand,
  TrendingUp,
  LayoutGrid,
  Sparkles,
  Shirt,
} from 'lucide-react';
import { Input } from '../core/Input';
import {
  ATTRIBUTE_SUGGESTIONS,
  SUGGESTION_CATEGORIES,
  COLOR_PALETTE,
  generateSKU,
  isColorAttribute,
  calculateCombinationCount,
  AttributeInput,
  VariantTable,
} from './variant-manager';

export interface ProductVariant {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  isActive: boolean;
}

export interface VariantAttribute {
  name: string;
  values: string[];
}

export interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
  productName?: string;
  className?: string;
}

const SUGGESTION_ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  Size: Ruler,
  Color: Palette,
  Material: Layers,
  Fit: Shirt,
  Pattern: LayoutGrid,
  Style: Sparkles,
  Fabric: Layers,
  Cut: Scissors,
  Storage: HardDrive,
  Memory: Cpu,
  Capacity: Package,
  Power: Zap,
  Voltage: Plug,
  Weight: Scale,
  Length: ArrowLeftRight,
  Width: ArrowLeftRight,
  Height: ArrowUpDown,
  Diameter: Circle,
  Scent: Wind,
  Flavor: Droplets,
  Fragrance: Wind,
  Edition: Tag,
  Version: Hash,
  Level: TrendingUp,
  Age: Target,
  Difficulty: Target,
  Finish: Hand,
  Texture: Hand,
  Speed: Zap,
  Performance: TrendingUp,
};

/**
 * VariantManager Component
 * Manages product variants with dynamic attributes (size, color, etc.)
 */
const VariantManager: React.FC<VariantManagerProps> = ({
  variants,
  onChange,
  basePrice,
  productName = 'Product',
  className = '',
}) => {
  const t = useTranslations('CreateProduct');

  const attrNameMap = useMemo<Record<string, string>>(() => ({
    Size: t('attrNameSize'),
    Color: t('attrNameColor'),
    Material: t('attrNameMaterial'),
    Fit: t('attrNameFit'),
    Pattern: t('attrNamePattern'),
    Style: t('attrNameStyle'),
    Fabric: t('attrNameFabric'),
    Cut: t('attrNameCut'),
    Storage: t('attrNameStorage'),
    Memory: t('attrNameMemory'),
    Capacity: t('attrNameCapacity'),
    Power: t('attrNamePower'),
    Voltage: t('attrNameVoltage'),
    Weight: t('attrNameWeight'),
    Length: t('attrNameLength'),
    Width: t('attrNameWidth'),
    Height: t('attrNameHeight'),
    Diameter: t('attrNameDiameter'),
    Scent: t('attrNameScent'),
    Flavor: t('attrNameFlavor'),
    Fragrance: t('attrNameFragrance'),
    Edition: t('attrNameEdition'),
    Version: t('attrNameVersion'),
    Level: t('attrNameLevel'),
    Age: t('attrNameAge'),
    Difficulty: t('attrNameDifficulty'),
    Finish: t('attrNameFinish'),
    Texture: t('attrNameTexture'),
    Speed: t('attrNameSpeed'),
    Performance: t('attrNamePerformance'),
  }), [t]);

  const categoryMap = useMemo<Record<string, string>>(() => ({
    Common: t('attrCatCommon'),
    Fashion: t('attrCatFashion'),
    Electronics: t('attrCatElectronics'),
    Physical: t('attrCatPhysical'),
    Beauty: t('attrCatBeauty'),
    'Food & Beauty': t('attrCatFoodBeauty'),
    Version: t('attrCatVersion'),
    Grade: t('attrCatGrade'),
    Surface: t('attrCatSurface'),
    Performance: t('attrCatPerformance'),
  }), [t]);

  const [attributes, setAttributes] = useState<VariantAttribute[]>([
    { name: 'Size', values: [] },
  ]);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState<
    Record<string, string>
  >({});
  const [showAttributeSuggestions, setShowAttributeSuggestions] =
    useState(false);

  const filteredSuggestions = ATTRIBUTE_SUGGESTIONS.filter((suggestion) => {
    const alreadyAdded = attributes.some(
      (attr) => attr.name.toLowerCase() === suggestion.name.toLowerCase()
    );
    const matchesSearch = suggestion.name
      .toLowerCase()
      .includes(newAttributeName.toLowerCase());
    return !alreadyAdded && matchesSearch;
  });

  const generateVariants = () => {
    const activeAttributes = attributes.filter(
      (attr) => attr.values.length > 0
    );

    if (activeAttributes.length === 0) {
      onChange([]);
      return;
    }

    const combinations: Record<string, string>[] = [{}];

    for (const attribute of activeAttributes) {
      const newCombinations: Record<string, string>[] = [];
      for (const combination of combinations) {
        for (const value of attribute.values) {
          newCombinations.push({ ...combination, [attribute.name]: value });
        }
      }
      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    const newVariants: ProductVariant[] = combinations.map((attrs) => {
      const existingVariant = variants.find(
        (v) => JSON.stringify(v.attributes) === JSON.stringify(attrs)
      );

      if (existingVariant) return existingVariant;

      return {
        sku: generateSKU(productName, attrs),
        attributes: attrs,
        price: basePrice,
        stock: 0,
        isActive: true,
      };
    });

    onChange(newVariants);
  };

  const addAttribute = (attributeName?: string) => {
    const nameToAdd = attributeName || newAttributeName;
    if (nameToAdd && !attributes.some((a) => a.name === nameToAdd)) {
      setAttributes([...attributes, { name: nameToAdd, values: [] }]);
      setNewAttributeName('');
      setShowAttributeSuggestions(false);
    }
  };

  const selectSuggestion = (suggestionName: string) => {
    addAttribute(suggestionName);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addAttributeValue = (attributeIndex: number, directValue?: string) => {
    const attribute = attributes[attributeIndex];
    const value = directValue || newAttributeValue[attribute.name];

    if (value && !attribute.values.includes(value)) {
      const newAttrs = [...attributes];
      newAttrs[attributeIndex].values.push(value);
      setAttributes(newAttrs);
      setNewAttributeValue({ ...newAttributeValue, [attribute.name]: '' });
    }
  };

  const removeAttributeValue = (attributeIndex: number, valueIndex: number) => {
    const newAttrs = [...attributes];
    newAttrs[attributeIndex].values.splice(valueIndex, 1);
    setAttributes(newAttrs);
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: unknown
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const combinationCount = calculateCombinationCount(attributes);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Options Configuration */}
      <div className="bg-surface-container-lowest rounded-xl p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t('variantOptionsTitle')}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('variantOptionsSubtitle')}
          </p>
        </div>

        {/* Existing Option Groups */}
        <div className="space-y-5">
          {attributes.map((attribute, attrIndex) => (
            <div key={attrIndex}>
              {/* Option Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComp =
                      SUGGESTION_ICON_MAP[attribute.name] || Tag;
                    return (
                      <IconComp size={14} className="text-brand-primary" />
                    );
                  })()}
                  <span className="text-sm font-semibold text-gray-900">
                    {attrNameMap[attribute.name] ?? attribute.name}
                  </span>
                  {attribute.values.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {t('variantOptionCount', { count: attribute.values.length })}
                    </span>
                  )}
                </div>
                {attrIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => removeAttribute(attrIndex)}
                    className="p-1 rounded-md text-feedback-error hover:bg-feedback-error/10 transition-colors cursor-pointer"
                    title={t('variantRemoveOption', { name: attribute.name })}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Selected Value Chips */}
              {attribute.values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {attribute.values.map((value, valueIndex) => {
                    const colorData = isColorAttribute(attribute.name)
                      ? COLOR_PALETTE.find((c) => c.name === value)
                      : null;

                    return (
                      <span
                        key={valueIndex}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-medium"
                      >
                        {colorData && (
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: colorData.hex,
                              boxShadow:
                                colorData.textColor === '#000000'
                                  ? 'inset 0 0 0 1px rgba(0,0,0,0.15)'
                                  : 'none',
                            }}
                          />
                        )}
                        {value}
                        <button
                          type="button"
                          onClick={() =>
                            removeAttributeValue(attrIndex, valueIndex)
                          }
                          className="ml-0.5 flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                          aria-label={t('variantRemoveValue', { value })}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Value Input (ColorPicker or text) */}
              <AttributeInput
                attributeName={attribute.name}
                selectedValues={attribute.values}
                inputValue={newAttributeValue[attribute.name] || ''}
                onInputChange={(value) =>
                  setNewAttributeValue({
                    ...newAttributeValue,
                    [attribute.name]: value,
                  })
                }
                onAddValue={(directValue) =>
                  addAttributeValue(attrIndex, directValue)
                }
              />

              {/* Divider between options */}
              {attrIndex < attributes.length - 1 && (
                <div className="border-t border-surface-container-highest mt-5" />
              )}
            </div>
          ))}
        </div>

        {/* Add New Option */}
        <div className="pt-4 border-t border-surface-container-highest space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t('variantAddOption')}
          </p>
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <Input
                variant="dark"
                placeholder={t('variantAddOptionPlaceholderGeneric')}
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                onFocus={() => setShowAttributeSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowAttributeSuggestions(false), 200);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAttribute();
                  }
                }}
              />

              {/* Suggestions Dropdown */}
              {showAttributeSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-highest max-h-72 overflow-y-auto">
                  <div className="p-1.5">
                    {SUGGESTION_CATEGORIES.map((category) => {
                      const categoryItems = filteredSuggestions.filter(
                        (s) => s.category === category
                      );
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category}>
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            {categoryMap[category] ?? category}
                          </div>
                          {categoryItems.map((suggestion, index) => {
                            const IconComp =
                              SUGGESTION_ICON_MAP[suggestion.name] || Tag;
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() =>
                                  selectSuggestion(suggestion.name)
                                }
                                className="w-full px-3 py-2 text-left rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2.5 cursor-pointer"
                              >
                                <span className="text-brand-primary">
                                  <IconComp size={14} />
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {attrNameMap[suggestion.name] ?? suggestion.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {newAttributeName && filteredSuggestions.length === 0 && (
                    <div className="p-3 text-sm text-gray-500 border-t border-surface-container-highest">
                      {t.rich('variantPressEnterToAdd', {
                        name: newAttributeName,
                        highlight: (chunks) => (
                          <span className="text-brand-primary font-medium">{chunks}</span>
                        ),
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => addAttribute()}
              className="px-4 py-2 bg-surface-container text-gray-900 rounded-lg hover:bg-surface-container-highest transition-colors whitespace-nowrap flex items-center gap-1.5 text-sm font-medium cursor-pointer"
            >
              <Plus size={15} />
              {t('variantAddBtn')}
            </button>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Info size={12} className="flex-shrink-0" />
            {t('variantAddHint')}
          </p>
        </div>

        {/* Generate Variants CTA */}
        <button
          type="button"
          onClick={generateVariants}
          disabled={combinationCount === 0}
          className="w-full px-4 py-3 bg-brand-primary text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={16} />
          {combinationCount > 0
            ? t('variantGenerateCount', { count: combinationCount })
            : t('variantGenerateEmpty')}
        </button>
      </div>

      {/* Variant Table */}
      <VariantTable
        variants={variants}
        onUpdateVariant={updateVariant}
        onRemoveVariant={removeVariant}
      />
    </div>
  );
};

VariantManager.displayName = 'VariantManager';

export { VariantManager };
